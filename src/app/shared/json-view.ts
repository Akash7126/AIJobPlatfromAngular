import { Component, computed, input } from '@angular/core';

type Kind = 'empty' | 'primitive' | 'table' | 'list' | 'object';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;

/** Human label for a camelCase key: "createdAtUtc" -> "Created At". */
export function humanize(key: string): string {
  return key
    .replace(/Utc$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, c => c.toUpperCase());
}

/** Short text for a scalar cell (dates localised, booleans as Yes/No, nested values as compact JSON). */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'string' && ISO_DATE.test(value)) {
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : value.length <= 10 ? date.toLocaleDateString() : date.toLocaleString();
  }
  if (Array.isArray(value) && value.every(v => typeof v !== 'object' || v === null)) {
    return value.length ? value.join(', ') : '—';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Renders any API response in the template's style: arrays of objects as a table, objects as a key/value list
 * (recursively), paged results with their items and totals.
 */
@Component({
  selector: 'app-json-view',
  imports: [JsonView],
  template: `
    @switch (kind()) {
      @case ('empty') {
        <p class="text-muted mb-0">{{ emptyText() }}</p>
      }
      @case ('primitive') {
        <p class="mb-0">{{ format(value()) }}</p>
      }
      @case ('list') {
        <ul class="list-unstyled mb-0">
          @for (item of asArray(); track $index) {
            <li><i class="fa fa-angle-right text-primary me-2"></i>{{ format(item) }}</li>
          }
        </ul>
      }
      @case ('table') {
        <div class="table-responsive">
          <table class="table table-sm table-hover align-middle mb-0">
            <thead>
              <tr>
                @for (col of columns(); track col) { <th class="text-nowrap">{{ humanize(col) }}</th> }
              </tr>
            </thead>
            <tbody>
              @for (row of asArray(); track $index) {
                <tr>
                  @for (col of columns(); track col) {
                    <td class="small" style="max-width: 320px; word-break: break-word;">{{ format(cell(row, col)) }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      @case ('object') {
        @if (paging(); as p) {
          <p class="small text-muted mb-2">Page {{ p.page }} of {{ p.totalPages || 1 }} &middot; {{ p.totalCount }} total</p>
          <app-json-view [value]="p.items" [emptyText]="emptyText()" />
        } @else {
          <dl class="row mb-0">
            @for (entry of entries(); track entry[0]) {
              <dt class="col-sm-4 text-truncate">{{ humanize(entry[0]) }}</dt>
              <dd class="col-sm-8">
                @if (isNested(entry[1])) {
                  <div class="border rounded p-2 mb-2 bg-white"><app-json-view [value]="entry[1]" /></div>
                } @else {
                  {{ format(entry[1]) }}
                }
              </dd>
            }
          </dl>
        }
      }
    }
  `,
})
export class JsonView {
  readonly value = input<unknown>();
  readonly emptyText = input('Nothing to show.');

  protected readonly humanize = humanize;
  protected readonly format = formatValue;

  protected readonly kind = computed<Kind>(() => {
    const v = this.value();
    if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) {
      return 'empty';
    }
    if (Array.isArray(v)) {
      return v.every(item => item !== null && typeof item === 'object' && !Array.isArray(item)) ? 'table' : 'list';
    }
    return typeof v === 'object' ? 'object' : 'primitive';
  });

  protected readonly columns = computed(() => {
    const keys = new Set<string>();
    for (const row of this.asArray()) {
      Object.keys(row as object).forEach(k => keys.add(k));
    }
    // Row versions are opaque concurrency tokens, not useful to read.
    keys.delete('rowVersion');
    return [...keys];
  });

  protected readonly entries = computed(() =>
    Object.entries((this.value() ?? {}) as Record<string, unknown>).filter(([k]) => k !== 'rowVersion'),
  );

  protected readonly paging = computed(() => {
    const v = this.value() as Record<string, unknown> | null;
    if (v && Array.isArray(v['items']) && 'totalCount' in v) {
      return v as { items: unknown[]; page: number; totalPages: number; totalCount: number };
    }
    return null;
  });

  protected asArray(): unknown[] {
    const v = this.value();
    return Array.isArray(v) ? v : [];
  }

  protected cell(row: unknown, col: string): unknown {
    return (row as Record<string, unknown>)[col];
  }

  protected isNested(value: unknown): boolean {
    if (value === null || typeof value !== 'object') {
      return false;
    }
    if (Array.isArray(value)) {
      return value.some(v => v !== null && typeof v === 'object');
    }
    return true;
  }
}
