import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JobSearchCriteria } from '../core/models/api.models';
import { JOB_CATEGORIES } from '../core/models/categories';

/** The green search strip (Keyword / Category / Location); submits to /jobs with query params. */
@Component({
  selector: 'app-search-bar',
  imports: [FormsModule],
  template: `
    <!-- Search Start -->
    <div class="container-fluid bg-primary mb-5 wow fadeIn" data-wow-delay="0.1s" style="padding: 35px;">
        <div class="container">
            <form class="row g-2" (ngSubmit)="search()">
                <div class="col-md-10">
                    <div class="row g-2">
                        <div class="col-md-4">
                            <input type="text" class="form-control border-0" placeholder="Keyword" name="keyword" [(ngModel)]="keyword" />
                        </div>
                        <div class="col-md-4">
                            <select class="form-select border-0" name="category" [(ngModel)]="categoryCode">
                                <option value="">Category</option>
                                @for (category of categories; track category.code) {
                                    <option [value]="category.code">{{ category.name }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-md-4">
                            <input type="text" class="form-control border-0" placeholder="Location (city)" name="city" [(ngModel)]="city" />
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <button type="submit" class="btn btn-dark border-0 w-100">Search</button>
                </div>
            </form>
        </div>
    </div>
    <!-- Search End -->
  `,
})
export class SearchBar {
  private readonly router = inject(Router);

  /** Pre-fills the fields (job list page keeps the current search visible). */
  readonly criteria = input<JobSearchCriteria>({});

  protected readonly categories = JOB_CATEGORIES;
  protected readonly keyword = signal('');
  protected readonly categoryCode = signal('');
  protected readonly city = signal('');

  constructor() {
    effect(() => {
      const c = this.criteria();
      this.keyword.set(c.keyword ?? '');
      this.categoryCode.set(c.categoryCode ?? '');
      this.city.set(c.city ?? '');
    });
  }

  protected search(): void {
    this.router.navigate(['/jobs'], {
      queryParams: {
        keyword: this.keyword().trim() || null,
        categoryCode: this.categoryCode() || null,
        city: this.city().trim() || null,
      },
    });
  }
}
