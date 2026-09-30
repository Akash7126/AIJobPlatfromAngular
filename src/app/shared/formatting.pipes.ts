import { Pipe, PipeTransform } from '@angular/core';
import { JobLocationView, SalaryRangeView } from '../core/models/api.models';
import { categoryName, contractTypeLabel } from '../core/models/categories';

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', BDT: '৳' };

/** "$123 - $456", like the template. */
@Pipe({ name: 'salary' })
export class SalaryPipe implements PipeTransform {
  transform(salary: SalaryRangeView | null | undefined): string {
    if (!salary || (salary.min == null && salary.max == null)) {
      return 'Negotiable';
    }
    const code = salary.currency ?? '';
    const symbol = CURRENCY_SYMBOLS[code.toUpperCase()];
    const format = (value: number) => (symbol ? `${symbol}${value.toLocaleString()}` : `${value.toLocaleString()} ${code}`.trim());
    if (salary.min != null && salary.max != null) {
      return `${format(salary.min)} - ${format(salary.max)}`;
    }
    return salary.min != null ? `From ${format(salary.min)}` : `Up to ${format(salary.max!)}`;
  }
}

/** "New York, USA" -> "City, Governorate". */
@Pipe({ name: 'location' })
export class LocationPipe implements PipeTransform {
  transform(location: JobLocationView | null | undefined): string {
    const parts = [location?.city, location?.governorate].filter(p => !!p);
    return parts.length ? parts.join(', ') : 'Anywhere';
  }
}

@Pipe({ name: 'contractType' })
export class ContractTypePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ? contractTypeLabel(value) : '';
  }
}

@Pipe({ name: 'category' })
export class CategoryPipe implements PipeTransform {
  transform(code: string | null | undefined): string {
    return code ? categoryName(code) : '';
  }
}
