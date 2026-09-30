import { Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { JobPostingSummaryView } from '../core/models/api.models';
import { AuthService } from '../core/services/auth.service';
import { FavoritesStore } from '../core/services/favorites.store';
import { ContractTypePipe, LocationPipe, SalaryPipe } from './formatting.pipes';

/** One ".job-item" row of the template's job listing, bound to a JobPostingSummaryView. */
@Component({
  selector: 'app-job-item',
  imports: [RouterLink, DatePipe, SalaryPipe, LocationPipe, ContractTypePipe],
  template: `
    <div class="job-item p-4 mb-4">
        <div class="row g-4">
            <div class="col-sm-12 col-md-8 d-flex align-items-center">
                <img class="flex-shrink-0 img-fluid border rounded" [src]="logo()" alt="" style="width: 80px; height: 80px;">
                <div class="text-start ps-4">
                    <h5 class="mb-3"><a [routerLink]="['/jobs', job().jobPostingId]">{{ job().title.en || job().title.ar }}</a></h5>
                    <span class="text-truncate me-3"><i class="fa fa-map-marker-alt text-primary me-2"></i>{{ job().location | location }}</span>
                    <span class="text-truncate me-3"><i class="far fa-clock text-primary me-2"></i>{{ job().contractType | contractType }}</span>
                    <span class="text-truncate me-0"><i class="far fa-money-bill-alt text-primary me-2"></i>{{ job().salary | salary }}</span>
                </div>
            </div>
            <div class="col-sm-12 col-md-4 d-flex flex-column align-items-start align-items-md-end justify-content-center">
                <div class="d-flex mb-3">
                    <a class="btn btn-light btn-square me-3" href="#" (click)="$event.preventDefault(); toggleFavorite()" [title]="favorited() ? 'Remove from favorites' : 'Add to favorites'">
                        <i class="fa-heart text-primary" [class.fas]="favorited()" [class.far]="!favorited()"></i>
                    </a>
                    <a class="btn btn-primary" [routerLink]="['/jobs', job().jobPostingId]" fragment="apply">Apply Now</a>
                </div>
                <small class="text-truncate"><i class="far fa-calendar-alt text-primary me-2"></i>Date Line: {{ job().deadlineUtc | date: 'dd MMM, yyyy' }}</small>
            </div>
        </div>
    </div>
  `,
})
export class JobItem {
  readonly job = input.required<JobPostingSummaryView>();
  /** Picks one of the template's five company logos, so the list looks like the original. */
  readonly index = input(0);

  private readonly auth = inject(AuthService);
  private readonly favorites = inject(FavoritesStore);
  private readonly router = inject(Router);

  protected readonly logo = computed(() => `img/com-logo-${(this.index() % 5) + 1}.jpg`);
  protected readonly favorited = computed(() => this.favorites.ids().has(this.job().jobPostingId));

  protected toggleFavorite(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    if (!this.auth.isJobSeeker()) {
      alert('Only job seekers can save favorite jobs.');
      return;
    }
    this.favorites.toggle(this.job().jobPostingId).subscribe({ error: () => alert('Could not update your favorites. Please try again.') });
  }
}
