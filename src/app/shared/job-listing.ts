import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { JobPostingSummaryView, JobSearchCriteria, PagedResult } from '../core/models/api.models';
import { apiErrorMessage } from '../core/services/api-error';
import { JobsApi } from '../core/api/jobs.api';
import { JobItem } from './job-item';

type Tab = 'featured' | 'full' | 'part';

const TAB_CONTRACT: Record<Tab, string | null> = { featured: null, full: 'FullTime', part: 'PartTime' };

/**
 * The template's "Job Listing" block (Featured / Full Time / Part Time pills), filled from GET /jobs/search.
 * With `paged` it shows pagination instead of the "Browse More Jobs" button (job list page).
 */
@Component({
  selector: 'app-job-listing',
  imports: [JobItem, RouterLink],
  template: `
    <!-- Jobs Start -->
    <div class="container-xxl py-5">
        <div class="container">
            <h1 class="text-center mb-5 wow fadeInUp" data-wow-delay="0.1s">Job Listing</h1>
            <div class="tab-class text-center wow fadeInUp" data-wow-delay="0.3s">
                <ul class="nav nav-pills d-inline-flex justify-content-center border-bottom mb-5">
                    <li class="nav-item">
                        <a class="d-flex align-items-center text-start mx-3 ms-0 pb-3" [class.active]="tab() === 'featured'" href="#" (click)="$event.preventDefault(); select('featured')">
                            <h6 class="mt-n1 mb-0">Featured</h6>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="d-flex align-items-center text-start mx-3 pb-3" [class.active]="tab() === 'full'" href="#" (click)="$event.preventDefault(); select('full')">
                            <h6 class="mt-n1 mb-0">Full Time</h6>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="d-flex align-items-center text-start mx-3 me-0 pb-3" [class.active]="tab() === 'part'" href="#" (click)="$event.preventDefault(); select('part')">
                            <h6 class="mt-n1 mb-0">Part Time</h6>
                        </a>
                    </li>
                </ul>
                <div class="tab-content">
                    <div class="tab-pane fade show p-0 active">
                        @if (loading()) {
                            <div class="py-5"><div class="spinner-border text-primary" role="status"></div></div>
                        } @else if (error()) {
                            <div class="alert alert-danger">{{ error() }}</div>
                        } @else {
                            @for (job of result()?.items ?? []; track job.jobPostingId; let i = $index) {
                                <app-job-item [job]="job" [index]="i" />
                            } @empty {
                                <p class="py-4">No jobs found. Try a different search.</p>
                            }
                        }

                        @if (paged()) {
                            @if (totalPages() > 1) {
                                <nav class="d-flex justify-content-center">
                                    <ul class="pagination">
                                        <li class="page-item" [class.disabled]="page() === 1">
                                            <a class="page-link" href="#" (click)="$event.preventDefault(); goTo(page() - 1)">&laquo;</a>
                                        </li>
                                        @for (p of pages(); track p) {
                                            <li class="page-item" [class.active]="p === page()">
                                                <a class="page-link" href="#" (click)="$event.preventDefault(); goTo(p)">{{ p }}</a>
                                            </li>
                                        }
                                        <li class="page-item" [class.disabled]="page() === totalPages()">
                                            <a class="page-link" href="#" (click)="$event.preventDefault(); goTo(page() + 1)">&raquo;</a>
                                        </li>
                                    </ul>
                                </nav>
                            }
                        } @else {
                            <a class="btn btn-primary py-3 px-5" routerLink="/jobs" [queryParams]="browseParams()">Browse More Jobs</a>
                        }
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Jobs End -->
  `,
})
export class JobListing {
  private readonly jobs = inject(JobsApi);
  private request?: Subscription;

  /** Extra search filters (keyword, category, location...) from the search bar / query string. */
  readonly criteria = input<JobSearchCriteria>({});
  readonly pageSize = input(5);
  readonly paged = input(false);

  protected readonly tab = signal<Tab>('featured');
  protected readonly page = signal(1);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<PagedResult<JobPostingSummaryView> | null>(null);

  protected readonly totalPages = computed(() => this.result()?.totalPages ?? 0);
  protected readonly pages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const start = Math.max(1, Math.min(current - 2, total - 4));
    return Array.from({ length: Math.min(5, total) }, (_, i) => start + i);
  });
  protected readonly browseParams = computed(() => ({ ...this.criteria(), contractType: TAB_CONTRACT[this.tab()] ?? undefined }));

  constructor() {
    // A contract type in the criteria (from the URL) pre-selects the matching tab.
    effect(() => {
      const contract = this.criteria().contractType;
      this.tab.set(contract === 'FullTime' ? 'full' : contract === 'PartTime' ? 'part' : 'featured');
      this.page.set(1);
    });
    effect(() => this.load(this.criteria(), this.tab(), this.page()));
  }

  protected select(tab: Tab): void {
    this.tab.set(tab);
    this.page.set(1);
  }

  protected goTo(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.page.set(page);
    }
  }

  private load(criteria: JobSearchCriteria, tab: Tab, page: number): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.request = this.jobs
      .search({ ...criteria, contractType: TAB_CONTRACT[tab], page, pageSize: this.pageSize() })
      .subscribe({
        next: result => {
          this.result.set(result);
          this.loading.set(false);
        },
        error: err => {
          this.error.set(apiErrorMessage(err, 'Could not load jobs.'));
          this.result.set(null);
          this.loading.set(false);
        },
      });
  }
}
