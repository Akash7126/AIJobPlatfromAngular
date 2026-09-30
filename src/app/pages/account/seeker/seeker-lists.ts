import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ContentApi } from '../../../core/api/content.api';
import { JobsApi } from '../../../core/api/jobs.api';
import { JobPostingView, NewsListItemView } from '../../../core/models/api.models';
import { CONTRACT_TYPES, JOB_CATEGORIES } from '../../../core/models/categories';
import { InterestedListItemView, SavedSearchRequest, SavedSearchView } from '../../../core/models/platform.models';
import { ActionState, Loader } from '../../../shared/action-state';
import { ContractTypePipe, LocationPipe, SalaryPipe } from '../../../shared/formatting.pipes';
import { describeCriteria } from './criteria';

const emptySearch = (): SavedSearchRequest => ({
  keyword: null,
  governorate: null,
  city: null,
  salaryMin: null,
  salaryMax: null,
  contractType: null,
  postedAfterUtc: null,
  deadlineBeforeUtc: null,
  categoryCode: null,
  notifyOnMatch: true,
});

/** JobPosting saved searches: list, create, toggle alerts, delete; plus "bookmark as filter" into the interested list. */
@Component({
  selector: 'app-seeker-saved-searches',
  imports: [FormsModule, DatePipe, RouterLink],
  template: `
    <div class="bg-light rounded p-4 mb-4">
        <h5 class="mb-3">Saved Searches</h5>
        @for (s of searches.value() ?? []; track s.savedSearchId) {
            <div class="d-flex flex-wrap justify-content-between align-items-center border-bottom py-2 gap-2">
                <div>
                    <a routerLink="/jobs" [queryParams]="queryFor(s)" class="fw-bold">{{ describe(s.criteria) }}</a>
                    <small class="d-block text-muted">Saved {{ s.createdAtUtc | date: 'dd MMM, yyyy' }}</small>
                </div>
                <div class="d-flex align-items-center gap-3">
                    <div class="form-check form-switch mb-0">
                        <input class="form-check-input" type="checkbox" [id]="'n' + s.savedSearchId" [checked]="s.notifyOnMatch" (change)="toggleNotify(s)">
                        <label class="form-check-label small" [for]="'n' + s.savedSearchId">Alerts</label>
                    </div>
                    <button class="btn btn-sm btn-light text-danger" (click)="remove(s)"><i class="fa fa-trash"></i></button>
                </div>
            </div>
        } @empty {
            <p class="text-muted">{{ searches.loading() ? 'Loading...' : 'No saved searches yet.' }}</p>
        }
    </div>

    <div class="bg-light rounded p-4">
        <h5 class="mb-3">Save A New Search</h5>
        <div class="row g-2">
            <div class="col-md-4"><input class="form-control" placeholder="Keyword" [(ngModel)]="draft.keyword"></div>
            <div class="col-md-4">
                <select class="form-select" [(ngModel)]="draft.categoryCode">
                    <option [ngValue]="null">Any category</option>
                    @for (c of categories; track c.code) { <option [value]="c.code">{{ c.name }}</option> }
                </select>
            </div>
            <div class="col-md-4">
                <select class="form-select" [(ngModel)]="draft.contractType">
                    <option [ngValue]="null">Any job nature</option>
                    @for (c of contractTypes; track c.value) { <option [value]="c.value">{{ c.label }}</option> }
                </select>
            </div>
            <div class="col-md-3"><input class="form-control" placeholder="City" [(ngModel)]="draft.city"></div>
            <div class="col-md-3"><input class="form-control" placeholder="Governorate" [(ngModel)]="draft.governorate"></div>
            <div class="col-md-3"><input class="form-control" type="number" placeholder="Salary from" [(ngModel)]="draft.salaryMin"></div>
            <div class="col-md-3"><input class="form-control" type="number" placeholder="Salary to" [(ngModel)]="draft.salaryMax"></div>
            <div class="col-12 d-flex flex-wrap align-items-center gap-3 mt-2">
                <div class="form-check mb-0">
                    <input class="form-check-input" type="checkbox" id="notify" [(ngModel)]="draft.notifyOnMatch">
                    <label class="form-check-label" for="notify">Notify me about new matches</label>
                </div>
                <button class="btn btn-primary px-4" [disabled]="state.busy()" (click)="save()">Save Search</button>
                <button class="btn btn-outline-primary" [disabled]="state.busy()" (click)="bookmark()">Add To Interested</button>
                @if (state.message()) { <small [class.text-danger]="!state.ok()" [class.text-success]="state.ok()">{{ state.message() }}</small> }
            </div>
        </div>
    </div>
  `,
})
export class SeekerSavedSearches implements OnInit {
  private readonly jobs = inject(JobsApi);

  protected readonly categories = JOB_CATEGORIES;
  protected readonly contractTypes = CONTRACT_TYPES;
  protected readonly searches = new Loader<SavedSearchView[]>();
  protected readonly state = new ActionState();
  protected readonly describe = describeCriteria;
  protected draft = emptySearch();

  ngOnInit(): void {
    this.reload();
  }

  protected queryFor(s: SavedSearchView): Record<string, string | null> {
    return { keyword: s.criteria.keyword, categoryCode: s.criteria.categoryCode, city: s.criteria.city, contractType: s.criteria.contractType };
  }

  protected save(): void {
    this.state.run(this.jobs.saveSearch({ ...this.draft }), 'Search saved.', () => {
      this.draft = emptySearch();
      this.reload();
    });
  }

  protected bookmark(): void {
    const { keyword, governorate, city, salaryMin, salaryMax, contractType, categoryCode } = this.draft;
    this.state.run(
      this.jobs.addInterested({ referenceType: 'Filter', postingId: null, keyword, governorate, city, salaryMin, salaryMax, contractType, categoryCode }),
      'Filter added to your interested list.',
    );
  }

  protected toggleNotify(s: SavedSearchView): void {
    this.state.run(this.jobs.setSavedSearchNotify(s.savedSearchId, !s.notifyOnMatch), 'Updated.', () => this.reload());
  }

  protected remove(s: SavedSearchView): void {
    if (confirm('Delete this saved search?')) {
      this.state.run(this.jobs.deleteSavedSearch(s.savedSearchId), 'Deleted.', () => this.reload());
    }
  }

  private reload(): void {
    this.searches.load(this.jobs.savedSearches());
  }
}

interface InterestedRow {
  entry: InterestedListItemView;
  job: JobPostingView | null;
}

/** JobPosting interested list: postings the seeker applied to ("Apply Now") and bookmarked filters. */
@Component({
  selector: 'app-seeker-interested',
  imports: [DatePipe, RouterLink, SalaryPipe, LocationPipe, ContractTypePipe],
  template: `
    <div class="bg-light rounded p-4">
        <h5 class="mb-3">Interested Jobs & Filters</h5>
        <p class="small text-muted">Jobs you applied to with "Apply Now" and filters you bookmarked.</p>
        @for (e of rows(); track e.entry.interestedListEntryId) {
            <div class="d-flex justify-content-between align-items-center border-bottom py-3">
                <div>
                    @if (e.entry.referenceType === 'Posting') {
                        @if (e.job; as job) {
                            <a [routerLink]="['/jobs', job.jobPostingId]" class="fw-bold">{{ job.title.en || job.title.ar }}</a>
                            <small class="d-block text-muted">{{ job.location | location }} &middot; {{ job.contractType | contractType }} &middot; {{ job.salary | salary }}</small>
                        } @else {
                            <a [routerLink]="['/jobs', e.entry.postingId]" class="fw-bold">Job {{ e.entry.postingId }}</a>
                        }
                    } @else {
                        <span class="fw-bold"><i class="fa fa-filter text-primary me-2"></i>{{ describe(e.entry.criteria) }}</span>
                    }
                    <small class="d-block text-muted">Added {{ e.entry.createdAtUtc | date: 'dd MMM, yyyy' }}</small>
                </div>
                <button class="btn btn-sm btn-light text-danger" (click)="remove(e.entry)"><i class="fa fa-trash"></i></button>
            </div>
        } @empty {
            <p class="text-muted mb-0">{{ loading() ? 'Loading...' : 'Your interested list is empty.' }}</p>
        }
        @if (state.message()) { <small [class.text-danger]="!state.ok()" [class.text-success]="state.ok()">{{ state.message() }}</small> }
    </div>
  `,
})
export class SeekerInterested implements OnInit {
  private readonly jobs = inject(JobsApi);

  protected readonly describe = describeCriteria;
  protected readonly loading = signal(true);
  protected readonly state = new ActionState();
  protected readonly rows = signal<InterestedRow[]>([]);

  ngOnInit(): void {
    this.reload();
  }

  protected remove(entry: InterestedListItemView): void {
    this.state.run(this.jobs.deleteInterested(entry.interestedListEntryId), 'Removed.', () => this.reload());
  }

  private reload(): void {
    this.loading.set(true);
    this.jobs.interested().subscribe({
      next: list => {
        const lookups = list.map(entry =>
          entry.referenceType === 'Posting' && entry.postingId ? this.jobs.get(entry.postingId).pipe(catchError(() => of(null))) : of(null),
        );
        (lookups.length ? forkJoin(lookups) : of([] as (JobPostingView | null)[])).subscribe(jobs => {
          this.rows.set(list.map((entry, i) => ({ entry, job: jobs[i] ?? null })));
          this.loading.set(false);
        });
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
      },
    });
  }
}

/** HelpContent GET /news/feed - personalised for job seekers. */
@Component({
  selector: 'app-seeker-news-feed',
  imports: [DatePipe, RouterLink],
  template: `
    <div class="bg-light rounded p-4">
        <h5 class="mb-3">My News Feed</h5>
        @for (n of items(); track n.newsArticleId) {
            <div class="border-bottom py-2">
                <a [routerLink]="['/news', n.newsArticleId]" class="fw-bold">{{ n.title.en || n.title.ar }}</a>
                <small class="d-block text-muted">{{ n.kind }} &middot; {{ n.publishedAtUtc | date: 'dd MMM, yyyy' }}
                    @if (n.categoryNames.length) { &middot; {{ n.categoryNames.join(', ') }} }</small>
            </div>
        } @empty {
            <p class="text-muted mb-0">{{ loading() ? 'Loading...' : 'No news for you yet.' }}</p>
        }
    </div>
  `,
})
export class SeekerNewsFeed implements OnInit {
  private readonly content = inject(ContentApi);
  protected readonly items = signal<NewsListItemView[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.content.newsFeed().subscribe({
      next: feed => {
        this.items.set(Array.isArray(feed) ? feed : (feed?.items ?? []));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
