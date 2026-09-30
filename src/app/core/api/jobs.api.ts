import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  JobPostingSummaryView,
  JobPostingView,
  JobSearchCriteria,
  PagedResult,
  PostingMutationResult,
  PostingRequest,
} from '../models/api.models';
import {
  FavoriteListView,
  InterestedListItemView,
  InterestedRequest,
  PostingSchemaView,
  SavedSearchRequest,
  SavedSearchView,
  UpdatePostingRequest,
} from '../models/platform.models';
import { ApiClient, Query, seg } from './api-client';

/** JobPosting service: postings, search, recommendations, favourites, saved searches and the interested list. */
@Injectable({ providedIn: 'root' })
export class JobsApi {
  private readonly api = inject(ApiClient);

  // Postings (employer)
  create(body: PostingRequest): Observable<PostingMutationResult> {
    return this.api.post('jobs', 'api/v1/jobs', body, { idempotent: true });
  }

  update(id: string, body: UpdatePostingRequest, ifMatch?: string | null): Observable<PostingMutationResult> {
    return this.api.put('jobs', `api/v1/jobs/${seg(id)}`, body, { ifMatch });
  }

  renew(id: string, newDeadlineUtc: string): Observable<PostingMutationResult> {
    return this.api.post('jobs', `api/v1/jobs/${seg(id)}/renew`, { newDeadlineUtc });
  }

  changeStatus(id: string, status: string): Observable<void> {
    return this.api.post('jobs', `api/v1/jobs/${seg(id)}/status`, { status });
  }

  mine(status: string | null, page = 1, pageSize = 20): Observable<PagedResult<JobPostingSummaryView>> {
    return this.api.get('jobs', 'api/v1/jobs/mine', { status, page, pageSize });
  }

  schema(): Observable<PostingSchemaView> {
    return this.api.get('jobs', 'api/v1/taxonomy/posting-schema');
  }

  // Search (guest / job seeker)
  search(criteria: JobSearchCriteria): Observable<PagedResult<JobPostingSummaryView>> {
    return this.api.get('jobs', 'api/v1/jobs/search', criteria as Query);
  }

  get(id: string): Observable<JobPostingView> {
    return this.api.get('jobs', `api/v1/jobs/${seg(id)}`);
  }

  recommended(page = 1, pageSize = 20): Observable<PagedResult<JobPostingSummaryView>> {
    return this.api.get('jobs', 'api/v1/jobs/recommended', { page, pageSize });
  }

  // Favourites
  toggleFavorite(jobId: string): Observable<boolean> {
    return this.api.put<{ favorited: boolean }>('jobs', `api/v1/favorites/${seg(jobId)}`).pipe(map(r => r.favorited));
  }

  favorites(): Observable<FavoriteListView> {
    return this.api.get('jobs', 'api/v1/favorites');
  }

  // Saved searches
  saveSearch(body: SavedSearchRequest): Observable<SavedSearchView> {
    return this.api.post('jobs', 'api/v1/saved-searches', body);
  }

  savedSearches(): Observable<SavedSearchView[]> {
    return this.api.get('jobs', 'api/v1/saved-searches');
  }

  setSavedSearchNotify(id: string, notifyOnMatch: boolean): Observable<void> {
    return this.api.patch('jobs', `api/v1/saved-searches/${seg(id)}`, { notifyOnMatch });
  }

  deleteSavedSearch(id: string): Observable<void> {
    return this.api.delete('jobs', `api/v1/saved-searches/${seg(id)}`);
  }

  // Interested list
  addInterested(body: InterestedRequest): Observable<unknown> {
    return this.api.post('jobs', 'api/v1/interested', body);
  }

  interested(): Observable<InterestedListItemView[]> {
    return this.api.get('jobs', 'api/v1/interested');
  }

  deleteInterested(id: string): Observable<void> {
    return this.api.delete('jobs', `api/v1/interested/${seg(id)}`);
  }
}
