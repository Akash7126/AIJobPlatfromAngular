import { Injectable, effect, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { JobsApi } from '../api/jobs.api';
import { AuthService } from './auth.service';

/** The signed-in job seeker's favourite job ids, so every heart button shows the right state. */
@Injectable({ providedIn: 'root' })
export class FavoritesStore {
  private readonly jobs = inject(JobsApi);
  private readonly auth = inject(AuthService);

  readonly ids = signal<ReadonlySet<string>>(new Set());

  constructor() {
    effect(() => {
      if (this.auth.isJobSeeker()) {
        this.reload();
      } else {
        this.ids.set(new Set());
      }
    });
  }

  has(jobId: string): boolean {
    return this.ids().has(jobId);
  }

  reload(): void {
    this.jobs.favorites().subscribe({
      next: list => this.ids.set(new Set(list.jobPostingIds ?? [])),
      error: () => this.ids.set(new Set()),
    });
  }

  toggle(jobId: string): Observable<boolean> {
    return this.jobs.toggleFavorite(jobId).pipe(
      tap(favorited => {
        const next = new Set(this.ids());
        if (favorited) {
          next.add(jobId);
        } else {
          next.delete(jobId);
        }
        this.ids.set(next);
      }),
    );
  }
}
