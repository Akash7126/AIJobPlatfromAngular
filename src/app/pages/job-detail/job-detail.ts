import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CompanyPageView, JobPostingView, ProfileView } from '../../core/models/api.models';
import { apiErrorMessage } from '../../core/services/api-error';
import { AuthService } from '../../core/services/auth.service';
import { ContentApi } from '../../core/api/content.api';
import { ProfileApi } from '../../core/api/profile.api';
import { FavoritesStore } from '../../core/services/favorites.store';
import { JobsApi } from '../../core/api/jobs.api';
import { PageHeader } from '../../layout/page-header';
import { CategoryPipe, ContractTypePipe, LocationPipe, SalaryPipe } from '../../shared/formatting.pipes';

@Component({
  selector: 'app-job-detail',
  imports: [PageHeader, RouterLink, FormsModule, DatePipe, SalaryPipe, LocationPipe, ContractTypePipe, CategoryPipe],
  templateUrl: './job-detail.html',
})
export class JobDetail {
  /** Route param /jobs/:id. */
  readonly id = input.required<string>();

  protected readonly auth = inject(AuthService);
  private readonly jobs = inject(JobsApi);
  private readonly content = inject(ContentApi);
  private readonly profiles = inject(ProfileApi);
  private readonly favorites = inject(FavoritesStore);
  private readonly router = inject(Router);

  protected readonly job = signal<JobPostingView | null>(null);
  protected readonly company = signal<CompanyPageView | null>(null);
  protected readonly profile = signal<ProfileView | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly applying = signal(false);
  protected readonly applied = signal(false);
  protected readonly applyError = signal<string | null>(null);

  protected readonly favorited = computed(() => {
    const job = this.job();
    return !!job && this.favorites.ids().has(job.jobPostingId);
  });

  protected readonly experience = computed(() => {
    const job = this.job();
    if (!job || (job.minExperienceYears == null && job.maxExperienceYears == null)) {
      return null;
    }
    if (job.minExperienceYears != null && job.maxExperienceYears != null) {
      return `${job.minExperienceYears} - ${job.maxExperienceYears} years`;
    }
    return job.minExperienceYears != null ? `${job.minExperienceYears}+ years` : `Up to ${job.maxExperienceYears} years`;
  });

  protected readonly otherFields = computed(() => Object.entries(this.job()?.otherFields ?? {}));

  constructor() {
    effect(() => this.load(this.id()));
    effect(() => {
      if (this.auth.isJobSeeker()) {
        this.profiles.mine().subscribe({ next: p => this.profile.set(p), error: () => this.profile.set(null) });
      }
    });
  }

  protected apply(): void {
    const job = this.job();
    if (!job) {
      return;
    }
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/jobs/${job.jobPostingId}` } });
      return;
    }
    if (!this.auth.isJobSeeker()) {
      this.applyError.set('Only job seeker accounts can apply for jobs.');
      return;
    }
    this.applying.set(true);
    this.applyError.set(null);
    this.jobs.addInterested({ referenceType: 'Posting', postingId: job.jobPostingId }).subscribe({
      next: () => {
        this.applying.set(false);
        this.applied.set(true);
      },
      error: err => {
        this.applying.set(false);
        this.applyError.set(apiErrorMessage(err, 'Could not submit your application.'));
      },
    });
  }

  protected toggleFavorite(): void {
    const job = this.job();
    if (!job) {
      return;
    }
    if (!this.auth.isJobSeeker()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/jobs/${job.jobPostingId}` } });
      return;
    }
    this.favorites.toggle(job.jobPostingId).subscribe();
  }

  private load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.applied.set(false);
    this.company.set(null);
    this.jobs.get(id).subscribe({
      next: job => {
        this.job.set(job);
        this.loading.set(false);
        if (job.employerAccountId) {
          this.content.companyPage(job.employerAccountId).subscribe({ next: c => this.company.set(c), error: () => undefined });
        }
      },
      error: err => {
        this.job.set(null);
        this.loading.set(false);
        this.error.set(apiErrorMessage(err, 'This job could not be found.'));
      },
    });
  }
}
