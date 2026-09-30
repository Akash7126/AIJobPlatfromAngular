import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult } from '../models/api.models';
import {
  CandidateInsightView,
  CandidateRankingItemView,
  CandidateRecommendationItemView,
  CandidateSearchRequest,
  CandidateSearchResultItemView,
  JobRecommendationDto,
  MatchScoreDetailDto,
  MatchedCandidateDto,
  MatchedJobDto,
  ParsedProfileDataDto,
  ShortlistDto,
  TalentPoolEntryView,
  ThresholdView,
} from '../models/platform.models';
import { ApiClient, seg } from './api-client';

/** AiMatching service: job-seeker matches and recommendations, employer candidate matches and shortlists, parsed resume data. */
@Injectable({ providedIn: 'root' })
export class MatchingApi {
  private readonly api = inject(ApiClient);

  // Job seeker
  jobMatches(minScore: number | null, page = 1, pageSize = 20): Observable<PagedResult<MatchedJobDto>> {
    return this.api.get('matching', 'api/v1/matches/jobs', { minScore, page, pageSize });
  }

  jobScore(jobPostingId: string): Observable<MatchScoreDetailDto> {
    return this.api.get('matching', `api/v1/matches/jobs/${seg(jobPostingId)}`);
  }

  jobRecommendations(): Observable<JobRecommendationDto> {
    return this.api.get('matching', 'api/v1/recommendations/jobs');
  }

  parsedData(): Observable<ParsedProfileDataDto> {
    return this.api.get('matching', 'api/v1/profiles/me/parsed-data');
  }

  correctParsedField(field: string, value: string): Observable<unknown> {
    return this.api.put('matching', `api/v1/profiles/me/parsed-data/${seg(field)}`, { value });
  }

  // Employer
  candidates(jobPostingId: string, page = 1, pageSize = 20): Observable<PagedResult<MatchedCandidateDto>> {
    return this.api.get('matching', `api/v1/employers/jobs/${seg(jobPostingId)}/candidates`, { page, pageSize });
  }

  candidateRecommendations(jobPostingId: string, page = 1, pageSize = 20): Observable<PagedResult<MatchedCandidateDto>> {
    return this.api.get('matching', `api/v1/employers/jobs/${seg(jobPostingId)}/candidate-recommendations`, { page, pageSize });
  }

  requestShortlist(jobPostingId: string, size: number | null): Observable<ShortlistDto> {
    return this.api.post('matching', `api/v1/employers/jobs/${seg(jobPostingId)}/shortlists`, { size });
  }

  shortlist(jobPostingId: string, shortlistId: string): Observable<ShortlistDto> {
    return this.api.get('matching', `api/v1/employers/jobs/${seg(jobPostingId)}/shortlists/${seg(shortlistId)}`);
  }
}

/** CandidateSourcing service (employer): candidate search, insights, recommendations, ranking, talent pool and qualification threshold. */
@Injectable({ providedIn: 'root' })
export class SourcingApi {
  private readonly api = inject(ApiClient);
  private readonly base = 'api/v1/employers/me';

  search(body: CandidateSearchRequest): Observable<PagedResult<CandidateSearchResultItemView>> {
    return this.api.post('sourcing', `${this.base}/candidates/search`, body);
  }

  candidate(candidateId: string): Observable<CandidateSearchResultItemView> {
    return this.api.get('sourcing', `${this.base}/candidates/${seg(candidateId)}`);
  }

  insight(candidateId: string, jobPostingId: string): Observable<CandidateInsightView> {
    return this.api.get('sourcing', `${this.base}/candidates/${seg(candidateId)}/insight`, { jobPostingId });
  }

  recommendations(jobPostingId: string, page = 1, pageSize = 20): Observable<PagedResult<CandidateRecommendationItemView>> {
    return this.api.get('sourcing', `${this.base}/jobs/${seg(jobPostingId)}/candidate-recommendations`, { page, pageSize });
  }

  ranking(jobPostingId: string, page = 1, pageSize = 20): Observable<PagedResult<CandidateRankingItemView>> {
    return this.api.get('sourcing', `${this.base}/jobs/${seg(jobPostingId)}/candidate-ranking`, { page, pageSize });
  }

  addToTalentPool(candidateProfileId: string, jobPostingId: string, note: string | null): Observable<unknown> {
    return this.api.post('sourcing', `${this.base}/talent-pool`, { candidateProfileId, jobPostingId, note });
  }

  talentPool(): Observable<TalentPoolEntryView[]> {
    return this.api.get('sourcing', `${this.base}/talent-pool`);
  }

  removeFromTalentPool(id: string): Observable<void> {
    return this.api.delete('sourcing', `${this.base}/talent-pool/${seg(id)}`);
  }

  threshold(jobPostingId: string): Observable<ThresholdView> {
    return this.api.get('sourcing', `${this.base}/jobs/${seg(jobPostingId)}/qualification-threshold`);
  }

  setThreshold(jobPostingId: string, percent: number): Observable<ThresholdView> {
    return this.api.put('sourcing', `${this.base}/jobs/${seg(jobPostingId)}/qualification-threshold`, { percent });
  }
}
