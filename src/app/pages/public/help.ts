import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ContentApi } from '../../core/api/content.api';
import { PagedResult } from '../../core/models/api.models';
import { HelpCenterTopicView, HelpContentView, HelpRole, HelpSearchResultView, TutorialView } from '../../core/models/platform.models';
import { AuthService } from '../../core/services/auth.service';
import { ActionState, Loader } from '../../shared/action-state';
import { PageHeader } from '../../layout/page-header';

const ROLE_LABELS: Record<HelpRole, string> = {
  JobSeeker: 'Job Seekers',
  Employer: 'Employers',
  ExternalJobSite: 'Job Site Partners',
  Guest: 'Visitors',
  Administrator: 'Administrators',
};

/** HelpContent GET /help (center, by role) and /help/search. */
@Component({
  selector: 'app-help-center',
  imports: [PageHeader, RouterLink, FormsModule],
  template: `
    <app-page-header title="Help Center" />

    <div class="container-xxl py-5">
        <div class="container">
            <h1 class="text-center mb-5 wow fadeInUp" data-wow-delay="0.1s">How Can We Help?</h1>
            <div class="container-fluid bg-primary mb-5 rounded" style="padding: 35px;">
                <form class="row g-2" (ngSubmit)="search()">
                    <div class="col-md-7"><input class="form-control border-0" name="q" placeholder="Search FAQs, guides and regulations" [(ngModel)]="query"></div>
                    <div class="col-md-3">
                        <select class="form-select border-0" name="role" [(ngModel)]="roleFilter">
                            <option [ngValue]="null">Everyone</option>
                            @for (r of roles; track r) { <option [value]="r">{{ roleLabel(r) }}</option> }
                        </select>
                    </div>
                    <div class="col-md-2"><button class="btn btn-dark border-0 w-100" type="submit">Search</button></div>
                </form>
            </div>

            @if (q()) {
                <h4 class="mb-4">Results for "{{ q() }}"</h4>
                @for (r of results.value()?.items ?? []; track r.helpContentId) {
                    <div class="job-item p-4 mb-3">
                        <h5 class="mb-1"><a [routerLink]="['/help', r.helpContentId]">{{ r.title.en || r.title.ar }}</a></h5>
                        <small class="text-muted">{{ r.kind }}@if (r.topicName) { &middot; {{ r.topicName }} }</small>
                    </div>
                } @empty {
                    <p class="text-muted">{{ results.loading() ? 'Searching...' : results.error() ?? 'Nothing found.' }}</p>
                }
            } @else {
                <div class="row g-4">
                    @for (topic of center.value() ?? []; track topic.topicId ?? $index) {
                        <div class="col-lg-4 col-md-6">
                            <div class="bg-light rounded p-4 h-100">
                                <h5 class="mb-3"><i class="fa fa-folder-open text-primary me-2"></i>{{ topic.topicName || 'General' }}</h5>
                                <ul class="list-unstyled mb-0">
                                    @for (item of topic.items; track item.helpContentId) {
                                        <li class="mb-2"><i class="fa fa-angle-right text-primary me-2"></i><a [routerLink]="['/help', item.helpContentId]">{{ item.title.en || item.title.ar }}</a></li>
                                    }
                                </ul>
                            </div>
                        </div>
                    } @empty {
                        <p class="text-center text-muted">{{ center.loading() ? 'Loading...' : center.error() ?? 'No help content yet.' }}</p>
                    }
                </div>
            }
        </div>
    </div>
  `,
})
export class HelpCenter {
  readonly q = input<string>();
  readonly role = input<string>();

  private readonly content = inject(ContentApi);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly roles = Object.keys(ROLE_LABELS) as HelpRole[];
  protected readonly center = new Loader<HelpCenterTopicView[]>();
  protected readonly results = new Loader<PagedResult<HelpSearchResultView>>();
  protected query = '';
  protected roleFilter: HelpRole | null = null;

  constructor() {
    effect(() => {
      const role = (this.role() as HelpRole | undefined) ?? (this.auth.actorType() as HelpRole | null) ?? null;
      const q = this.q();
      this.roleFilter = role;
      this.query = q ?? '';
      if (q) {
        this.results.load(this.content.helpSearch(q, role));
      } else {
        this.center.load(this.content.helpCenter(role));
      }
    });
  }

  protected roleLabel(r: HelpRole): string {
    return ROLE_LABELS[r];
  }

  protected search(): void {
    this.router.navigate(['/help'], { queryParams: { q: this.query.trim() || null, role: this.roleFilter } });
  }
}

/** HelpContent GET /help/{id} + POST /help/{id}/feedback. */
@Component({
  selector: 'app-help-article',
  imports: [PageHeader, RouterLink, FormsModule],
  template: `
    <app-page-header title="Help Center" [crumb]="article.value()?.title?.en || 'Article'" section="Help" sectionLink="/help" />

    <div class="container-xxl py-5">
        <div class="container">
            @if (article.value(); as a) {
                <div class="row gy-5 gx-4">
                    <div class="col-lg-8">
                        <span class="badge bg-secondary mb-3">{{ a.kind }}</span>
                        <h1 class="mb-4">{{ a.title.en || a.title.ar }}</h1>
                        <div style="white-space: pre-line;" class="mb-4">{{ a.body.en || a.body.ar }}</div>
                        @for (m of a.media; track m.mediaId) {
                            @if (m.type === 'Video') {
                                <video class="w-100 rounded mb-4" controls [src]="m.url" [attr.aria-label]="m.textAlternative"></video>
                            } @else {
                                <p><a [href]="m.url" target="_blank" rel="noopener"><i class="fa fa-external-link-alt me-2"></i>{{ m.textAlternative || 'Open interactive guide' }}</a></p>
                            }
                        }
                        @if (a.body.ar && a.body.en) {
                            <hr class="my-5">
                            <h4 dir="rtl">{{ a.title.ar }}</h4>
                            <div dir="rtl" style="white-space: pre-line;">{{ a.body.ar }}</div>
                        }
                    </div>
                    <div class="col-lg-4">
                        <div class="bg-light rounded p-5">
                            <h4 class="mb-4">Was this helpful?</h4>
                            @if (auth.isLoggedIn()) {
                                <div class="d-flex gap-2 mb-3">
                                    <button class="btn flex-fill" [class.btn-primary]="rating === 'Helpful'" [class.btn-outline-primary]="rating !== 'Helpful'" (click)="rating = 'Helpful'"><i class="far fa-thumbs-up me-2"></i>Yes</button>
                                    <button class="btn flex-fill" [class.btn-dark]="rating === 'NotHelpful'" [class.btn-outline-dark]="rating !== 'NotHelpful'" (click)="rating = 'NotHelpful'"><i class="far fa-thumbs-down me-2"></i>No</button>
                                </div>
                                <textarea class="form-control mb-3" rows="3" placeholder="Comment (optional)" [(ngModel)]="comment"></textarea>
                                <button class="btn btn-primary w-100" [disabled]="!rating || state.busy()" (click)="send()">Send Feedback</button>
                                @if (state.message()) { <small class="d-block mt-2" [class.text-danger]="!state.ok()" [class.text-success]="state.ok()">{{ state.message() }}</small> }
                            } @else {
                                <p class="m-0"><a routerLink="/login" [queryParams]="{ returnUrl: '/help/' + a.helpContentId }">Log in</a> to rate this article.</p>
                            }
                            <a class="btn btn-light w-100 mt-4" routerLink="/help">Back to Help Center</a>
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
export class HelpArticle {
  readonly id = input.required<string>();
  private readonly content = inject(ContentApi);
  protected readonly auth = inject(AuthService);

  protected readonly article = new Loader<HelpContentView>();
  protected readonly state = new ActionState();
  protected rating: 'Helpful' | 'NotHelpful' | null = null;
  protected comment = '';

  constructor() {
    effect(() => this.article.load(this.content.help(this.id())));
  }

  protected send(): void {
    if (this.rating) {
      this.state.run(this.content.helpFeedback(this.id(), this.rating, this.comment || null), 'Thank you for your feedback!');
    }
  }
}

/** HelpContent GET /tutorials/{id} + POST /tutorials/{id}/complete. */
@Component({
  selector: 'app-tutorial',
  imports: [PageHeader, RouterLink],
  template: `
    <app-page-header title="Tutorial" [crumb]="tutorial.value()?.title?.en || 'Tutorial'" section="Help" sectionLink="/help" />
    <div class="container-xxl py-5">
        <div class="container">
            @if (tutorial.value(); as t) {
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <h1 class="mb-4">{{ t.title.en || t.title.ar }}</h1>
                        <div style="white-space: pre-line;" class="mb-5">{{ t.body.en || t.body.ar }}</div>
                        @if (done()) {
                            <div class="alert alert-success"><i class="fa fa-check me-2"></i>Tutorial completed.</div>
                        } @else {
                            <button class="btn btn-primary py-3 px-5" [disabled]="state.busy()" (click)="complete()">Mark As Completed</button>
                        }
                        @if (state.message() && !state.ok()) { <p class="text-danger mt-2">{{ state.message() }}</p> }
                        <a class="btn btn-light py-3 px-5 ms-2" routerLink="/help">Help Center</a>
                    </div>
                </div>
            } @else {
                <p class="text-center">{{ tutorial.loading() ? 'Loading...' : tutorial.error() }}</p>
            }
        </div>
    </div>
  `,
})
export class Tutorial {
  readonly id = input.required<string>();
  private readonly content = inject(ContentApi);
  protected readonly tutorial = new Loader<TutorialView>();
  protected readonly state = new ActionState();
  private readonly completedNow = signal(false);
  protected readonly done = computed(() => this.completedNow() || !!this.tutorial.value()?.completed);

  constructor() {
    effect(() => this.tutorial.load(this.content.tutorial(this.id())));
  }

  protected complete(): void {
    this.state.run(this.content.completeTutorial(this.id()), 'Completed.', () => this.completedNow.set(true));
  }
}
