import { Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { JobPostingSummaryView, PagedResult } from '../../core/models/api.models';
import { apiErrorMessage } from '../../core/services/api-error';
import { JobsApi } from '../../core/api/jobs.api';
import { PageHeader } from '../../layout/page-header';
import { ContractTypePipe, LocationPipe, SalaryPipe } from '../../shared/formatting.pipes';

/** Lifecycle actions offered per posting status (POST /jobs/{id}/status). */
const ACTIONS: Record<string, { status: string; label: string }[]> = {
  Draft: [{ status: 'Active', label: 'Publish' }],
  Active: [{ status: 'Paused', label: 'Pause' }, { status: 'Archived', label: 'Archive' }],
  Paused: [{ status: 'Active', label: 'Resume' }, { status: 'Archived', label: 'Archive' }],
  Expired: [{ status: 'Archived', label: 'Archive' }],
};

/** GET /jobs/mine - the employer's own postings, in the template's job-item style. */
@Component({
  selector: 'app-my-jobs',
  imports: [PageHeader, RouterLink, FormsModule, DatePipe, SalaryPipe, LocationPipe, ContractTypePipe],
  template: `
    <app-page-header title="My Job Postings" section="Jobs" sectionLink="/jobs" />

    <div class="container-xxl py-5">
        <div class="container">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-5 gap-3">
                <h1 class="mb-0 wow fadeInUp" data-wow-delay="0.1s">Job Postings</h1>
                <div class="d-flex gap-2">
                    <select class="form-select" [ngModel]="status()" (ngModelChange)="status.set($event); page.set(1)" style="min-width: 160px;">
                        <option value="">All statuses</option>
                        @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
                    </select>
                    <a class="btn btn-primary text-nowrap" routerLink="/post-job"><i class="fa fa-plus me-2"></i>Post A Job</a>
                </div>
            </div>

            @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }

            @if (loading()) {
                <div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>
            } @else {
                @for (job of result()?.items ?? []; track job.jobPostingId; let i = $index) {
                    <div class="job-item p-4 mb-4">
                        <div class="row g-4">
                            <div class="col-sm-12 col-md-8 d-flex align-items-center">
                                <img class="flex-shrink-0 img-fluid border rounded" [src]="'img/com-logo-' + ((i % 5) + 1) + '.jpg'" alt="" style="width: 80px; height: 80px;">
                                <div class="text-start ps-4">
                                    <h5 class="mb-3"><a [routerLink]="['/jobs', job.jobPostingId]">{{ job.title.en || job.title.ar }}</a>
                                        <span class="badge bg-secondary ms-2 align-middle" style="font-size: .7rem;">{{ job.status }}</span></h5>
                                    <span class="text-truncate me-3"><i class="fa fa-map-marker-alt text-primary me-2"></i>{{ job.location | location }}</span>
                                    <span class="text-truncate me-3"><i class="far fa-clock text-primary me-2"></i>{{ job.contractType | contractType }}</span>
                                    <span class="text-truncate me-0"><i class="far fa-money-bill-alt text-primary me-2"></i>{{ job.salary | salary }}</span>
                                </div>
                            </div>
                            <div class="col-sm-12 col-md-4 d-flex flex-column align-items-start align-items-md-end justify-content-center">
                                <div class="d-flex flex-wrap mb-3 gap-2 justify-content-md-end">
                                    <a class="btn btn-light" [routerLink]="['/account/jobs', job.jobPostingId]"><i class="fa fa-cog me-1"></i>Manage</a>
                                    @for (action of actionsFor(job.status); track action.status) {
                                        <button class="btn btn-primary" [disabled]="busyId() === job.jobPostingId" (click)="change(job, action.status)">{{ action.label }}</button>
                                    }
                                </div>
                                <small class="text-truncate"><i class="far fa-calendar-alt text-primary me-2"></i>Date Line: {{ job.deadlineUtc | date: 'dd MMM, yyyy' }}</small>
                            </div>
                        </div>
                    </div>
                } @empty {
                    <p class="text-center py-4">You have no job postings yet.</p>
                }

                @if ((result()?.totalPages ?? 0) > 1) {
                    <nav class="d-flex justify-content-center">
                        <ul class="pagination">
                            <li class="page-item" [class.disabled]="page() === 1"><a class="page-link" href="#" (click)="$event.preventDefault(); page.set(page() - 1)">&laquo;</a></li>
                            <li class="page-item active"><span class="page-link">{{ page() }} / {{ result()?.totalPages }}</span></li>
                            <li class="page-item" [class.disabled]="page() === result()?.totalPages"><a class="page-link" href="#" (click)="$event.preventDefault(); page.set(page() + 1)">&raquo;</a></li>
                        </ul>
                    </nav>
                }
            }
        </div>
    </div>
  `,
})
export class MyJobs {
  private readonly jobs = inject(JobsApi);

  protected readonly statuses = ['Draft', 'Active', 'Paused', 'Expired', 'Archived'];
  protected readonly status = signal('');
  protected readonly page = signal(1);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busyId = signal<string | null>(null);
  protected readonly result = signal<PagedResult<JobPostingSummaryView> | null>(null);

  constructor() {
    effect(() => this.load(this.status(), this.page()));
  }

  protected actionsFor(status: string) {
    return ACTIONS[status] ?? [];
  }

  protected change(job: JobPostingSummaryView, status: string): void {
    this.busyId.set(job.jobPostingId);
    this.error.set(null);
    this.jobs.changeStatus(job.jobPostingId, status).subscribe({
      next: () => {
        this.busyId.set(null);
        this.load(this.status(), this.page());
      },
      error: err => {
        this.busyId.set(null);
        this.error.set(apiErrorMessage(err, 'Could not change the posting status.'));
      },
    });
  }

  private load(status: string, page: number): void {
    this.loading.set(true);
    this.jobs.mine(status || null, page, 10).subscribe({
      next: result => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(apiErrorMessage(err, 'Could not load your postings.'));
        this.loading.set(false);
      },
    });
  }
}
