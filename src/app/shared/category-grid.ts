import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JOB_CATEGORIES } from '../core/models/categories';
import { JobsApi } from '../core/api/jobs.api';

/** "Explore By Category": the eight template tiles with live vacancy counts from GET /jobs/search. */
@Component({
  selector: 'app-category-grid',
  imports: [RouterLink],
  template: `
    <!-- Category Start -->
    <div class="container-xxl py-5">
        <div class="container">
            <h1 class="text-center mb-5 wow fadeInUp" data-wow-delay="0.1s">Explore By Category</h1>
            <div class="row g-4">
                @for (category of categories; track category.code; let i = $index) {
                    <div class="col-lg-3 col-sm-6 wow fadeInUp" [attr.data-wow-delay]="delays[i % 4]">
                        <a class="cat-item rounded p-4" routerLink="/jobs" [queryParams]="{ categoryCode: category.code }">
                            <i class="fa fa-3x text-primary mb-4" [class]="category.icon"></i>
                            <h6 class="mb-3">{{ category.name }}</h6>
                            <p class="mb-0">{{ counts()[category.code] ?? '...' }} Vacancy</p>
                        </a>
                    </div>
                }
            </div>
        </div>
    </div>
    <!-- Category End -->
  `,
})
export class CategoryGrid implements OnInit {
  private readonly jobs = inject(JobsApi);

  protected readonly categories = JOB_CATEGORIES;
  protected readonly delays = ['0.1s', '0.3s', '0.5s', '0.7s'];
  protected readonly counts = signal<Record<string, number>>({});

  ngOnInit(): void {
    for (const category of this.categories) {
      this.jobs.search({ categoryCode: category.code, page: 1, pageSize: 1 }).subscribe({
        next: result => this.counts.update(c => ({ ...c, [category.code]: result.totalCount })),
        error: () => this.counts.update(c => ({ ...c, [category.code]: 0 })),
      });
    }
  }
}
