import { Component, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ContentApi } from '../../core/api/content.api';
import { NewsListItemView, PagedResult } from '../../core/models/api.models';
import { NewsArticleView } from '../../core/models/platform.models';
import { Loader } from '../../shared/action-state';
import { PageHeader } from '../../layout/page-header';

/** HelpContent GET /news (latest) and /news/archive (search). */
@Component({
  selector: 'app-news-list',
  imports: [PageHeader, RouterLink, DatePipe, FormsModule],
  template: `
    <app-page-header title="News" />

    <div class="container-xxl py-5">
        <div class="container">
            <h1 class="text-center mb-5 wow fadeInUp" data-wow-delay="0.1s">Latest News & Announcements</h1>
            <form class="row g-2 justify-content-center mb-5" (ngSubmit)="search()">
                <div class="col-md-6"><input class="form-control" name="q" placeholder="Search the news archive" [(ngModel)]="query"></div>
                <div class="col-md-2"><button class="btn btn-primary w-100" type="submit">Search</button></div>
            </form>
            <div class="row g-4">
                @for (n of result.value()?.items ?? []; track n.newsArticleId; let i = $index) {
                    <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
                        <div class="testimonial-item bg-light rounded p-4 h-100 d-flex flex-column">
                            <i class="fa fa-2x text-primary mb-3" [class.fa-newspaper]="n.kind === 'Article'" [class.fa-bullhorn]="n.kind !== 'Article'"></i>
                            <h5 class="mb-2"><a [routerLink]="['/news', n.newsArticleId]" class="text-dark">{{ n.title.en || n.title.ar }}</a></h5>
                            <small class="text-muted mb-3">{{ n.publishedAtUtc | date: 'dd MMM, yyyy' }} &middot; {{ n.kind }}</small>
                            @if (n.categoryNames.length) { <p class="small mb-3">{{ n.categoryNames.join(', ') }}</p> }
                            <a class="btn btn-primary mt-auto align-self-start" [routerLink]="['/news', n.newsArticleId]">Read More</a>
                        </div>
                    </div>
                } @empty {
                    <p class="text-center text-muted">{{ result.loading() ? 'Loading...' : result.error() ?? 'No news found.' }}</p>
                }
            </div>
            @if ((result.value()?.totalPages ?? 0) > 1) {
                <nav class="d-flex justify-content-center mt-5">
                    <ul class="pagination">
                        <li class="page-item" [class.disabled]="page() === 1"><a class="page-link" href="#" (click)="$event.preventDefault(); goTo(page() - 1)">&laquo;</a></li>
                        <li class="page-item active"><span class="page-link">{{ page() }} / {{ result.value()?.totalPages }}</span></li>
                        <li class="page-item" [class.disabled]="page() === result.value()?.totalPages"><a class="page-link" href="#" (click)="$event.preventDefault(); goTo(page() + 1)">&raquo;</a></li>
                    </ul>
                </nav>
            }
        </div>
    </div>
  `,
})
export class NewsList {
  readonly q = input<string>();
  readonly category = input<string>();

  private readonly content = inject(ContentApi);
  private readonly router = inject(Router);

  protected readonly result = new Loader<PagedResult<NewsListItemView>>();
  protected readonly page = signal(1);
  protected query = '';

  constructor() {
    effect(() => {
      const q = this.q();
      const page = this.page();
      this.query = q ?? '';
      this.result.load(q ? this.content.newsArchive(q, page) : this.content.news(this.category() ?? null, page));
    });
  }

  protected search(): void {
    this.page.set(1);
    this.router.navigate(['/news'], { queryParams: { q: this.query.trim() || null } });
  }

  protected goTo(page: number): void {
    this.page.set(page);
  }
}

/** HelpContent GET /news/{id}. */
@Component({
  selector: 'app-news-article',
  imports: [PageHeader, RouterLink, DatePipe],
  template: `
    <app-page-header title="News" [crumb]="article.value()?.title?.en || 'Article'" section="News" sectionLink="/news" />

    <div class="container-xxl py-5 wow fadeInUp" data-wow-delay="0.1s">
        <div class="container">
            @if (article.value(); as a) {
                <div class="row gy-5 gx-4">
                    <div class="col-lg-8">
                        <h1 class="mb-3">{{ a.title.en || a.title.ar }}</h1>
                        <p class="text-muted mb-4"><i class="far fa-calendar-alt text-primary me-2"></i>{{ (a.publishedAtUtc ?? a.createdAtUtc) | date: 'dd MMM, yyyy' }} &middot; {{ a.kind }}</p>
                        @for (m of a.media; track m.mediaId) {
                            @if (m.type === 'Image') {
                                <img class="img-fluid rounded mb-4" [src]="m.url" [alt]="m.altText ?? ''">
                            } @else {
                                <p><a [href]="m.url" target="_blank" rel="noopener">{{ m.altText || m.url }}</a></p>
                            }
                        }
                        <div style="white-space: pre-line;">{{ a.body.en || a.body.ar }}</div>
                        @if (a.body.ar && a.body.en) {
                            <hr class="my-5">
                            <h4 dir="rtl">{{ a.title.ar }}</h4>
                            <div dir="rtl" style="white-space: pre-line;">{{ a.body.ar }}</div>
                        }
                    </div>
                    <div class="col-lg-4">
                        <div class="bg-light rounded p-5">
                            <h4 class="mb-4">Tags</h4>
                            @for (t of a.tags; track t) { <span class="badge bg-primary me-2 mb-2">{{ t }}</span> } @empty { <p class="m-0">No tags.</p> }
                            <a class="btn btn-primary w-100 mt-4" routerLink="/news">All News</a>
                        </div>
                    </div>
                </div>
            } @else {
                <p class="text-center">{{ article.loading() ? 'Loading...' : article.error() }}</p>
            }
        </div>
    </div>
  `,
})
export class NewsArticle {
  readonly id = input.required<string>();
  private readonly content = inject(ContentApi);
  protected readonly article = new Loader<NewsArticleView>();

  constructor() {
    effect(() => this.article.load(this.content.article(this.id())));
  }
}
