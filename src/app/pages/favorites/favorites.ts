import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { JobPostingSummaryView } from '../../core/models/api.models';
import { FavoritesStore } from '../../core/services/favorites.store';
import { JobsApi } from '../../core/api/jobs.api';
import { PageHeader } from '../../layout/page-header';
import { JobItem } from '../../shared/job-item';

/** GET /favorites returns ids only, so each favourite posting is loaded with GET /jobs/{id}. */
@Component({
  selector: 'app-favorites',
  imports: [PageHeader, JobItem, RouterLink],
  template: `
    <app-page-header title="Favorite Jobs" section="Jobs" sectionLink="/jobs" />

    <div class="container-xxl py-5">
        <div class="container">
            <h1 class="text-center mb-5 wow fadeInUp" data-wow-delay="0.1s">Your Favorite Jobs</h1>
            <div class="text-center">
                @if (loading()) {
                    <div class="py-5"><div class="spinner-border text-primary" role="status"></div></div>
                } @else {
                    @for (job of jobs(); track job.jobPostingId; let i = $index) {
                        <app-job-item [job]="job" [index]="i" />
                    } @empty {
                        <p class="mb-4">You haven't saved any jobs yet. Tap the heart on a job to keep it here.</p>
                    }
                    <a class="btn btn-primary py-3 px-5" routerLink="/jobs">Browse More Jobs</a>
                }
            </div>
        </div>
    </div>
  `,
})
export class Favorites {
  private readonly favorites = inject(FavoritesStore);
  private readonly jobService = inject(JobsApi);

  protected readonly loading = signal(true);
  protected readonly jobs = signal<JobPostingSummaryView[]>([]);
  private loadedIds = new Set<string>();

  constructor() {
    effect(() => {
      const ids = [...this.favorites.ids()];
      // Un-favouriting only removes the row; new ids trigger a reload.
      if (ids.every(id => this.loadedIds.has(id)) && !this.loading()) {
        this.jobs.update(list => list.filter(j => this.favorites.ids().has(j.jobPostingId)));
        return;
      }
      this.load(ids);
    });
  }

  private load(ids: string[]): void {
    this.loadedIds = new Set(ids);
    if (!ids.length) {
      this.jobs.set([]);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    forkJoin(ids.map(id => this.jobService.get(id).pipe(catchError(() => of(null))))).subscribe(views => {
      this.jobs.set(views.filter(v => v !== null).map(v => ({ ...v, relevanceScore: null })));
      this.loading.set(false);
    });
  }
}
