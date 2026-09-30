import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmployerApi } from '../../../core/api/employer.api';
import { EmployerDashboardDto, EmployerRegistrationView } from '../../../core/models/platform.models';
import { Loader } from '../../../shared/action-state';

/** AuditLogging /employers/me/dashboard + EmployerOnboarding /employers/me/registration. */
@Component({
  selector: 'app-employer-overview',
  imports: [DatePipe, RouterLink],
  template: `
    @if (registration.value(); as r) {
        @if (r.status !== 'Approved') {
            <div class="alert alert-warning">
                Your company registration is <strong>{{ r.status }}</strong>.
                @if (!r.level2) { Complete your <a routerLink="../company">company profile</a> so an administrator can approve it. }
            </div>
        }
    }

    <div class="row g-4 mb-4">
        @for (tile of tiles(); track tile.label) {
            <div class="col-sm-6 col-lg-3">
                <div class="cat-item rounded p-4 h-100">
                    <i class="fa fa-2x text-primary mb-3" [class]="tile.icon"></i>
                    <h6 class="mb-2">{{ tile.label }}</h6>
                    <p class="mb-0 fs-4 fw-bold text-dark">{{ tile.value }}</p>
                </div>
            </div>
        }
    </div>

    <div class="bg-light rounded p-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">Recent Postings</h5>
            <a class="btn btn-sm btn-primary" routerLink="/post-job"><i class="fa fa-plus me-1"></i>Post A Job</a>
        </div>
        @for (p of dashboard.value()?.items ?? []; track p.jobPostingId) {
            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                <a [routerLink]="['/account/jobs', p.jobPostingId]" class="fw-bold">{{ p.title }}</a>
                <span><span class="badge bg-secondary me-2">{{ p.status }}</span><small class="text-muted">{{ p.updatedAtUtc | date: 'dd MMM, yyyy' }}</small></span>
            </div>
        } @empty {
            <p class="text-muted mb-0">{{ dashboard.loading() ? 'Loading...' : dashboard.error() ?? 'No postings yet.' }}</p>
        }
    </div>
  `,
})
export class EmployerOverview implements OnInit {
  private readonly api = inject(EmployerApi);

  protected readonly dashboard = new Loader<EmployerDashboardDto>();
  protected readonly registration = new Loader<EmployerRegistrationView>();

  ngOnInit(): void {
    this.dashboard.load(this.api.dashboard());
    this.registration.load(this.api.registration());
  }

  protected tiles(): { label: string; value: string | number; icon: string }[] {
    const d = this.dashboard.value();
    return [
      { label: 'Registration', value: d ? (d.registrationApproved ? 'Approved' : 'Pending') : '...', icon: 'fa-building' },
      { label: 'Job Postings', value: d?.postings ?? '...', icon: 'fa-briefcase' },
      { label: 'Active Postings', value: d?.activePostings ?? '...', icon: 'fa-check-circle' },
      { label: 'Shortlists', value: d?.shortlists ?? '...', icon: 'fa-list-ol' },
    ];
  }
}
