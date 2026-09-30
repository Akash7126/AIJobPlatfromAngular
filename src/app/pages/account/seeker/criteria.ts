import { SearchCriteriaView } from '../../../core/models/platform.models';

export const splitList = (v: string): string[] =>
  v
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length);

/** Readable one-line summary of a stored search/filter. */
export function describeCriteria(c: SearchCriteriaView | null): string {
  if (!c) {
    return '—';
  }
  const parts = [
    c.keyword && `"${c.keyword}"`,
    c.categoryCode,
    c.contractType,
    [c.city, c.governorate].filter(Boolean).join(', '),
    c.salaryMin != null || c.salaryMax != null ? `salary ${c.salaryMin ?? ''}-${c.salaryMax ?? ''}` : null,
  ].filter(p => !!p);
  return parts.length ? parts.join(' · ') : 'All jobs';
}
