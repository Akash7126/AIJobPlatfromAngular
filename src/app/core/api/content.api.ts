import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CompanyPageView, NewsListItemView, PagedResult } from '../models/api.models';
import {
  CompanyPageEditRequest,
  HelpCenterTopicView,
  HelpContentView,
  HelpRole,
  HelpSearchResultView,
  NewsArticleView,
  TutorialView,
} from '../models/platform.models';
import { ApiClient, seg } from './api-client';

/** HelpContent service: help center, news, tutorials and company pages. */
@Injectable({ providedIn: 'root' })
export class ContentApi {
  private readonly api = inject(ApiClient);

  // Help
  helpCenter(role: HelpRole | null): Observable<HelpCenterTopicView[]> {
    return this.api.get('help', 'api/v1/help', { role });
  }

  helpSearch(q: string, role: HelpRole | null, page = 1, pageSize = 20): Observable<PagedResult<HelpSearchResultView>> {
    return this.api.get('help', 'api/v1/help/search', { q, role, page, pageSize });
  }

  helpForPage(pageKey: string): Observable<HelpContentView[] | HelpContentView> {
    return this.api.get('help', 'api/v1/help/context', { pageKey });
  }

  help(id: string): Observable<HelpContentView> {
    return this.api.get('help', `api/v1/help/${seg(id)}`);
  }

  helpFeedback(id: string, rating: 'Helpful' | 'NotHelpful', comment: string | null): Observable<unknown> {
    return this.api.post('help', `api/v1/help/${seg(id)}/feedback`, { rating, comment });
  }

  // News
  news(category: string | null, page = 1, pageSize = 9): Observable<PagedResult<NewsListItemView>> {
    return this.api.get('help', 'api/v1/news', { category, page, pageSize });
  }

  newsArchive(q: string | null, page = 1, pageSize = 9): Observable<PagedResult<NewsListItemView>> {
    return this.api.get('help', 'api/v1/news/archive', { q, page, pageSize });
  }

  newsFeed(): Observable<NewsListItemView[] | PagedResult<NewsListItemView>> {
    return this.api.get('help', 'api/v1/news/feed');
  }

  article(id: string): Observable<NewsArticleView> {
    return this.api.get('help', `api/v1/news/${seg(id)}`);
  }

  // Tutorials
  tutorial(id: string): Observable<TutorialView> {
    return this.api.get('help', `api/v1/tutorials/${seg(id)}`);
  }

  completeTutorial(id: string): Observable<unknown> {
    return this.api.post('help', `api/v1/tutorials/${seg(id)}/complete`);
  }

  // Company pages
  companyPage(employerAccountId: string): Observable<CompanyPageView> {
    return this.api.get('help', `api/v1/companies/${seg(employerAccountId)}/page`);
  }

  editMyCompanyPage(body: CompanyPageEditRequest): Observable<CompanyPageView> {
    return this.api.put('help', 'api/v1/companies/me/page', body);
  }
}
