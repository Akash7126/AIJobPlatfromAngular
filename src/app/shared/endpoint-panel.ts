import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ServiceKey } from '../../environments/environment';
import { ApiClient, HttpMethod, Query, seg } from '../core/api/api-client';
import { apiErrorMessage } from '../core/services/api-error';
import { JsonView, humanize } from './json-view';

export type FieldType = 'text' | 'textarea' | 'number' | 'bool' | 'date' | 'datetime' | 'select' | 'list' | 'json' | 'file';

/**
 * Where a field goes: a `{name}` path segment, the query string, a JSON body property, a multipart form field,
 * or `raw` (the value itself is the whole JSON body).
 */
export type FieldLocation = 'path' | 'query' | 'body' | 'form' | 'raw';

export interface FieldDef {
  name: string;
  in: FieldLocation;
  type?: FieldType;
  label?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  default?: string | number | boolean;
  help?: string;
}

/** One API endpoint as a runnable form. `path` uses `{name}` placeholders for path fields. */
export interface EndpointDef {
  title: string;
  service: ServiceKey;
  method: HttpMethod;
  path: string;
  description?: string;
  fields?: FieldDef[];
  /** Run immediately when shown (read endpoints without required input). */
  autoRun?: boolean;
  /** Ask for confirmation first (destructive actions). */
  confirm?: string;
  idempotent?: boolean;
  /** The response is a file to download instead of JSON. */
  download?: boolean;
}

type FieldValue = string | number | boolean | File | null;

const METHOD_CLASS: Record<HttpMethod, string> = {
  GET: 'bg-primary',
  POST: 'bg-secondary',
  PUT: 'bg-warning text-dark',
  PATCH: 'bg-info text-dark',
  DELETE: 'bg-danger',
};

/** Renders an EndpointDef as a card with inputs, a run button and the formatted response. */
@Component({
  selector: 'app-endpoint-panel',
  imports: [FormsModule, JsonView],
  template: `
    <div class="bg-light rounded p-4 mb-4">
        <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
            <span class="badge" [class]="methodClass()">{{ def().method }}</span>
            <h5 class="mb-0">{{ def().title }}</h5>
        </div>
        <p class="small text-muted mb-3"><code>{{ def().path }}</code>@if (def().description) { &nbsp;&middot; {{ def().description }} }</p>

        <form (ngSubmit)="run()" class="row g-2 align-items-end">
            @for (field of fields(); track field.name) {
                <div [class]="colClass(field)">
                    <label class="form-label small mb-1" [for]="id(field)">{{ label(field) }}@if (field.required) {<span class="text-danger"> *</span>}</label>
                    @switch (field.type ?? 'text') {
                        @case ('textarea') {
                            <textarea class="form-control" rows="3" [id]="id(field)" [name]="field.name" [(ngModel)]="values[field.name]" [placeholder]="field.placeholder ?? ''"></textarea>
                        }
                        @case ('json') {
                            <textarea class="form-control font-monospace small" rows="4" [id]="id(field)" [name]="field.name" [(ngModel)]="values[field.name]" [placeholder]="field.placeholder ?? 'JSON'"></textarea>
                        }
                        @case ('bool') {
                            <div class="form-check form-switch pt-1">
                                <input class="form-check-input" type="checkbox" [id]="id(field)" [name]="field.name" [(ngModel)]="values[field.name]">
                            </div>
                        }
                        @case ('select') {
                            <select class="form-select" [id]="id(field)" [name]="field.name" [(ngModel)]="values[field.name]">
                                @if (!field.required) { <option [ngValue]="null">—</option> }
                                @for (o of field.options ?? []; track o) { <option [value]="o">{{ o }}</option> }
                            </select>
                        }
                        @case ('file') {
                            <input class="form-control bg-white" type="file" [id]="id(field)" (change)="pickFile(field, $event)">
                        }
                        @case ('number') {
                            <input class="form-control" type="number" [id]="id(field)" [name]="field.name" [(ngModel)]="values[field.name]" [placeholder]="field.placeholder ?? ''">
                        }
                        @case ('date') {
                            <input class="form-control" type="date" [id]="id(field)" [name]="field.name" [(ngModel)]="values[field.name]">
                        }
                        @case ('datetime') {
                            <input class="form-control" type="datetime-local" [id]="id(field)" [name]="field.name" [(ngModel)]="values[field.name]">
                        }
                        @default {
                            <input class="form-control" type="text" [id]="id(field)" [name]="field.name" [(ngModel)]="values[field.name]"
                                   [placeholder]="field.placeholder ?? (field.type === 'list' ? 'comma separated' : '')">
                        }
                    }
                    @if (field.help) { <div class="form-text">{{ field.help }}</div> }
                </div>
            }
            <div class="col-12 col-md-auto">
                <button type="submit" class="btn btn-primary px-4" [disabled]="busy()">
                    {{ busy() ? 'Running...' : def().method === 'GET' ? 'Load' : 'Send' }}
                </button>
            </div>
        </form>

        @if (error()) {
            <div class="alert alert-danger mt-3 mb-0">{{ error() }}</div>
        }
        @if (done()) {
            <div class="mt-3">
                @if (result() === null || result() === undefined) {
                    <div class="alert alert-success mb-0"><i class="fa fa-check me-2"></i>Done.</div>
                } @else {
                    <div class="bg-white rounded border p-3"><app-json-view [value]="result()" /></div>
                }
            </div>
        }
    </div>
  `,
})
export class EndpointPanel implements OnInit {
  readonly def = input.required<EndpointDef>();

  private readonly api = inject(ApiClient);

  protected values: Record<string, FieldValue> = {};
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly done = signal(false);
  protected readonly result = signal<unknown>(null);

  protected readonly fields = computed(() => this.def().fields ?? []);
  protected readonly methodClass = computed(() => METHOD_CLASS[this.def().method]);
  private readonly uid = Math.random().toString(36).slice(2, 8);

  ngOnInit(): void {
    for (const f of this.fields()) {
      this.values[f.name] = f.default ?? (f.type === 'bool' ? false : null);
    }
    if (this.def().autoRun) {
      this.run();
    }
  }

  protected id(field: FieldDef): string {
    return `${this.uid}-${field.name}`;
  }

  protected label(field: FieldDef): string {
    return field.label ?? humanize(field.name);
  }

  protected colClass(field: FieldDef): string {
    return field.type === 'textarea' || field.type === 'json' ? 'col-12' : 'col-12 col-md-6 col-lg-4';
  }

  protected pickFile(field: FieldDef, event: Event): void {
    this.values[field.name] = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  protected run(): void {
    const def = this.def();
    const missing = this.fields().filter(f => f.required && this.isEmpty(this.values[f.name]));
    if (missing.length) {
      this.error.set(`Please fill in: ${missing.map(f => this.label(f)).join(', ')}.`);
      return;
    }
    if (def.confirm && !confirm(def.confirm)) {
      return;
    }

    let request: Observable<unknown>;
    try {
      request = this.buildRequest(def);
    } catch (e) {
      this.error.set((e as Error).message);
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    this.done.set(false);
    request.subscribe({
      next: value => {
        this.busy.set(false);
        this.done.set(true);
        if (value instanceof Blob) {
          this.save(value);
          this.result.set({ downloaded: true, size: value.size, type: value.type });
        } else {
          this.result.set(value ?? null);
        }
      },
      error: err => {
        this.busy.set(false);
        this.error.set(apiErrorMessage(err));
      },
    });
  }

  private buildRequest(def: EndpointDef): Observable<unknown> {
    let path = def.path;
    const query: Query = {};
    const body: Record<string, unknown> = {};
    const form: Record<string, string> = {};
    let file: File | null = null;
    let raw: unknown = undefined;
    let hasBody = false;

    for (const f of this.fields()) {
      const value = this.convert(f, this.values[f.name]);
      switch (f.in) {
        case 'path':
          path = path.replace(`{${f.name}}`, seg(String(value ?? '')));
          break;
        case 'query':
          query[f.name] = value as string | number | boolean | null;
          break;
        case 'body':
          body[f.name] = value;
          hasBody = true;
          break;
        case 'raw':
          raw = value;
          break;
        case 'form':
          if (value instanceof File) {
            file = value;
          } else if (value !== null && value !== undefined) {
            form[f.name] = String(value);
          }
          break;
      }
    }

    if (file) {
      return this.api.upload(def.service, path, file, form);
    }
    const payload = raw !== undefined ? raw : hasBody ? body : def.method === 'GET' || def.method === 'DELETE' ? undefined : {};
    return this.api.request(def.service, def.method, path, {
      query,
      body: payload,
      idempotent: def.idempotent,
      responseType: def.download ? 'blob' : 'json',
    });
  }

  private convert(field: FieldDef, value: FieldValue): unknown {
    if (value instanceof File) {
      return value;
    }
    if (this.isEmpty(value)) {
      return field.type === 'list' ? [] : field.type === 'bool' ? false : null;
    }
    switch (field.type) {
      case 'number':
        return Number(value);
      case 'list':
        return String(value)
          .split(',')
          .map(v => v.trim())
          .filter(v => v.length);
      case 'json':
        try {
          return JSON.parse(String(value));
        } catch {
          throw new Error(`${this.label(field)} is not valid JSON.`);
        }
      case 'datetime':
        return new Date(String(value)).toISOString();
      default:
        return value;
    }
  }

  private isEmpty(value: FieldValue | undefined): boolean {
    return value === null || value === undefined || value === '';
  }

  private save(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.def().title.replace(/\W+/g, '-').toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
