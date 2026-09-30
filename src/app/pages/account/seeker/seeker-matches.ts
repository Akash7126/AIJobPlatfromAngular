import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { JobsApi } from '../../../core/api/jobs.api';
import { MatchingApi } from '../../../core/api/matching.api';
import { JobPostingSummaryView, PagedResult } from '../../../core/models/api.models';
import { JobRecommendationDto, MatchScoreDetailDto, MatchedJobDto } from '../../../core/models/platform.models';
import { Loader } from '../../../shared/action-state';
import { JobItem } from '../../../shared/job-item';
import { JsonView } from '../../../shared/json-view';

/** AiMatching: /matches/jobs (+ per-job score breakdown), /recommendations/jobs; JobPosting: /jobs/recommended. */
@Component({
  selector: 'app-seeker-matches',
  imports: [RouterLink, DecimalPipe, DatePipe, FormsModule, JobItem, JsonView],
  template: `
    <div class="bg-light rounded p-4 mb-4">
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
            <h5 class="mb-0">Your Best Job Matches</h5>
            <div class="d-flex align-items-center gap-2">
                <label class="small text-nowrap" for="minScore">Min score</label>
                <input id="minScore" type="number" min="0" max="100" class="form-control form-control-sm" style="width: 90px;" [(ngModel)]="minScore" (change)="loadMatches()">
            </div>
        </div>
        @for (m of matches.value()?.items ?? []; track m.matchScoreId) {
            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                <div>
                    <a [routerLink]="['/jobs', m.jobPostingId]" class="fw-bold">{{ m.title }}</a>
                    <small class="text-muted d-block">Computed {{ m.computedAtUtc | date: 'dd MMM, yyyy' }}</small>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-primary fs-6">{{ m.score | number: '1.0-0' }}%</span>
                    <button class="btn btn-sm btn-outline-primary" (click)="explain(m.jobPostingId)">Why?</button>
                </div>
            </div>
            @if (detail()?.jobPostingId === m.jobPostingId) {
                <div class="bg-white border rounded p-3 my-2">
                    <p class="mb-2">{{ detail()!.meetsThreshold ? 'This job meets the match threshold.' : 'Below the match threshold.' }}</p>
                    <app-json-view [value]="detail()!.breakdown" />
                </div>
            }
        } @empty {
            <p class="text-muted mb-0">{{ matches.loading() ? 'Loading...' : matches.error() ?? 'No matches yet. Complete your profile and upload a resume to get matched.' }}</p>
        }
    </div>

    <div class="bg-light rounded p-4 mb-4">
        <h5 class="mb-3">AI Recommendations</h5>
        @if (aiRecs.value(); as r) {
            <small class="text-muted d-block mb-2">Strategy: {{ r.strategy }}</small>
            @for (item of r.items; track item.jobPostingId) {
                <div class="border-bottom py-2">
                    <a [routerLink]="['/jobs', item.jobPostingId]" class="fw-bold">{{ item.title }}</a>
                    <span class="badge bg-secondary ms-2">{{ item.score | number: '1.0-0' }}%</span>
                    <small class="d-block text-muted">{{ item.reason }}</small>
                </div>
            } @empty { <p class="text-muted mb-0">No recommendations yet.</p> }
        } @else {
            <p class="text-muted mb-0">{{ aiRecs.loading() ? 'Loading...' : aiRecs.error() }}</p>
        }
    </div>

    <h5 class="mb-3">Recommended For You</h5>
    <div class="text-center">
        @for (job of recommended.value()?.items ?? []; track job.jobPostingId; let i = $index) {
            <app-job-item [job]="job" [index]="i" />
        } @empty {
            <p class="text-muted">{{ recommended.loading() ? 'Loading...' : recommended.error() ?? 'No recommended jobs right now.' }}</p>
        }
    </div>
  `,
})
export class SeekerMatches implements OnInit {
  private readonly matching = inject(MatchingApi);
  private readonly jobs = inject(JobsApi);

  protected minScore: number | null = null;
  protected readonly matches = new Loader<PagedResult<MatchedJobDto>>();
  protected readonly aiRecs = new Loader<JobRecommendationDto>();
  protected readonly recommended = new Loader<PagedResult<JobPostingSummaryView>>();
  protected readonly detail = signal<MatchScoreDetailDto | null>(null);

  ngOnInit(): void {
    this.loadMatches();
    this.aiRecs.load(this.matching.jobRecommendations());
    this.recommended.load(this.jobs.recommended(1, 5));
  }

  protected loadMatches(): void {
    this.matches.load(this.matching.jobMatches(this.minScore, 1, 20));
  }

  protected explain(jobPostingId: string): void {
    if (this.detail()?.jobPostingId === jobPostingId) {
      this.detail.set(null);
      return;
    }
    this.matching.jobScore(jobPostingId).subscribe({ next: d => this.detail.set(d), error: () => this.detail.set(null) });
  }
}
