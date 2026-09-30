import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface ListColumn {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'select';
  options?: string[];
  required?: boolean;
}

type Row = Record<string, string | null>;

/** A small table editor: rows of inputs, add/remove, and one "Save" that emits the whole list (the profile APIs replace a section at once). */
@Component({
  selector: 'app-editable-list',
  imports: [FormsModule],
  template: `
    <div class="bg-light rounded p-4 mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">{{ title() }}</h5>
            <button type="button" class="btn btn-sm btn-outline-primary" (click)="add()"><i class="fa fa-plus me-1"></i>Add</button>
        </div>
        @for (row of rows(); track $index; let i = $index) {
            <div class="row g-2 align-items-end mb-2">
                @for (col of columns(); track col.key) {
                    <div class="col">
                        @if (i === 0) { <label class="form-label small mb-1">{{ col.label }}</label> }
                        @if (col.type === 'select') {
                            <select class="form-select form-select-sm" [(ngModel)]="row[col.key]" [name]="col.key + i">
                                @for (o of col.options ?? []; track o) { <option [value]="o">{{ o }}</option> }
                            </select>
                        } @else {
                            <input class="form-control form-control-sm" [type]="col.type === 'date' ? 'date' : 'text'" [(ngModel)]="row[col.key]" [name]="col.key + i">
                        }
                    </div>
                }
                <div class="col-auto">
                    <button type="button" class="btn btn-sm btn-light text-danger" (click)="remove(i)" title="Remove"><i class="fa fa-trash"></i></button>
                </div>
            </div>
        } @empty {
            <p class="text-muted small mb-2">Nothing added yet.</p>
        }
        <div class="d-flex align-items-center gap-3 mt-3">
            <button type="button" class="btn btn-primary px-4" [disabled]="busy()" (click)="submit()">{{ busy() ? 'Saving...' : 'Save' }}</button>
            @if (message()) { <small [class.text-danger]="!ok()" [class.text-success]="ok()">{{ message() }}</small> }
        </div>
    </div>
  `,
})
export class EditableList {
  readonly title = input.required<string>();
  readonly columns = input.required<ListColumn[]>();
  readonly items = input<object[]>([]);
  readonly busy = input(false);
  readonly message = input<string | null>(null);
  readonly ok = input(true);
  readonly save = output<Row[]>();

  protected readonly rows = signal<Row[]>([]);

  constructor() {
    effect(() => {
      const cols = this.columns();
      this.rows.set(
        (this.items() ?? []).map(item => {
          const source = item as Record<string, unknown>;
          const row: Row = {};
          for (const c of cols) {
            const v = source[c.key];
            row[c.key] = v == null ? null : c.type === 'date' ? String(v).slice(0, 10) : String(v);
          }
          return row;
        }),
      );
    });
  }

  protected add(): void {
    const row: Row = {};
    for (const c of this.columns()) {
      row[c.key] = c.type === 'select' ? (c.options?.[0] ?? null) : null;
    }
    this.rows.update(rows => [...rows, row]);
  }

  protected remove(index: number): void {
    this.rows.update(rows => rows.filter((_, i) => i !== index));
  }

  protected submit(): void {
    const cols = this.columns();
    const cleaned = this.rows()
      .filter(r => cols.some(c => (r[c.key] ?? '').toString().trim() !== ''))
      .map(r => {
        const out: Row = {};
        for (const c of cols) {
          const v = (r[c.key] ?? '').toString().trim();
          out[c.key] = v === '' ? null : c.type === 'date' ? new Date(v).toISOString() : v;
        }
        return out;
      });
    this.save.emit(cleaned);
  }
}
