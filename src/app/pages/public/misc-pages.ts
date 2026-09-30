import { Component, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContentApi } from '../../core/api/content.api';
import { DocsApi } from '../../core/api/docs.api';
import { IdentityApi } from '../../core/api/identity.api';
import { NotificationApi } from '../../core/api/notification.api';
import { ProfileApi } from '../../core/api/profile.api';
import { CompanyPageView } from '../../core/models/api.models';
import { SharedProfileView } from '../../core/models/platform.models';
import { ActionState, Loader } from '../../shared/action-state';
import { JsonView } from '../../shared/json-view';
import { PageHeader } from '../../layout/page-header';

/** HelpContent GET /companies/{employerAccountId}/page - public company profile with open jobs. */
@Component({
  selector: 'app-company-page',
  imports: [PageHeader, RouterLink, DatePipe],
  template: `
    <app-page-header [title]="page.value()?.name || 'Company'" crumb="Company" section="Jobs" sectionLink="/jobs" />

    <div class="container-xxl py-5 wow fadeInUp" data-wow-delay="0.1s">
        <div class="container">
            @if (page.value(); as c) {
                <div class="row gy-5 gx-4">
                    <div class="col-lg-8">
                        <div class="d-flex align-items-center mb-5">
                            <img class="flex-shrink-0 img-fluid border rounded" [src]="c.logoUrl || 'img/com-logo-1.jpg'" alt="" style="width: 80px; height: 80px;">
                            <div class="text-start ps-4">
                                <h3 class="mb-2">{{ c.name }} @if (c.verified) { <i class="fa fa-check-circle text-primary fs-5" [title]="c.badge || 'Verified employer'"></i> }</h3>
                                @if (c.industry) { <span class="text-truncate me-3"><i class="fa fa-industry text-primary me-2"></i>{{ c.industry }}</span> }
                                @if (c.companySize) { <span class="text-truncate me-3"><i class="fa fa-users text-primary me-2"></i>{{ c.companySize }}</span> }
                                @if (c.website) { <span class="text-truncate"><i class="fa fa-globe text-primary me-2"></i><a [href]="c.website" target="_blank" rel="noopener">{{ c.website }}</a></span> }
                            </div>
                        </div>
                        <h4 class="mb-3">About Us</h4>
                        <p style="white-space: pre-line;">{{ c.background.en || c.background.ar || 'No description yet.' }}</p>
                        @if (c.highlights.length) {
                            <h4 class="mb-3">Highlights</h4>
                            <ul class="list-unstyled">
                                @for (h of c.highlights; track h) { <li><i class="fa fa-angle-right text-primary me-2"></i>{{ h }}</li> }
                            </ul>
                        }
                    </div>
                    <div class="col-lg-4">
                        <div class="bg-light rounded p-5">
                            <h4 class="mb-4">Open Jobs</h4>
                            @for (j of c.openPostings; track j.jobPostingId) {
                                <p class="mb-3"><i class="fa fa-angle-right text-primary me-2"></i><a [routerLink]="['/jobs', j.jobPostingId]">{{ j.title }}</a>
                                    <small class="d-block text-muted ms-3">{{ j.city || j.governorate || '' }} &middot; until {{ j.deadlineUtc | date: 'dd MMM, yyyy' }}</small></p>
                            } @empty {
                                <p class="m-0">{{ c.openPostingsDegraded ? 'Open jobs are temporarily unavailable.' : 'No open jobs right now.' }}</p>
                            }
                        </div>
                    </div>
                </div>
            } @else {
                <p class="text-center">{{ page.loading() ? 'Loading...' : page.error() }}</p>
            }
        </div>
    </div>
  `,
})
export class CompanyPage {
  readonly id = input.required<string>();
  private readonly content = inject(ContentApi);
  protected readonly page = new Loader<CompanyPageView>();

  constructor() {
    effect(() => this.page.load(this.content.companyPage(this.id())));
  }
}

/** JobSeekerProfile GET /shared/{token} (+ /qr) - a job seeker's public profile. */
@Component({
  selector: 'app-shared-profile',
  imports: [PageHeader, DatePipe],
  template: `
    <app-page-header title="Candidate Profile" section="Pages" />

    <div class="container-xxl py-5">
        <div class="container">
            @if (profile.value(); as p) {
                <div class="row gy-5 gx-4">
                    <div class="col-lg-8">
                        <div class="d-flex align-items-center mb-5">
                            <div class="flex-shrink-0 border rounded bg-light d-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
                                <i class="fa fa-user fa-2x text-primary"></i>
                            </div>
                            <div class="ps-4"><h3 class="mb-1">{{ p.fullName }}</h3>@if (p.statement) { <p class="mb-0">{{ p.statement }}</p> }</div>
                        </div>
                        @if (p.bio) { <h4 class="mb-3">About</h4><p style="white-space: pre-line;" class="mb-5">{{ p.bio }}</p> }
                        @if (p.experience.length) {
                            <h4 class="mb-3">Experience</h4>
                            <ul class="list-unstyled mb-5">
                                @for (e of p.experience; track $index) {
                                    <li class="mb-2"><i class="fa fa-angle-right text-primary me-2"></i><strong>{{ e.role }}</strong> at {{ e.company }}
                                        <small class="text-muted">{{ e.from | date: 'MMM yyyy' }} - {{ e.to ? (e.to | date: 'MMM yyyy') : 'present' }}</small></li>
                                }
                            </ul>
                        }
                        @if (p.education.length) {
                            <h4 class="mb-3">Education</h4>
                            <ul class="list-unstyled">
                                @for (e of p.education; track $index) {
                                    <li class="mb-2"><i class="fa fa-angle-right text-primary me-2"></i><strong>{{ e.degree }}</strong>, {{ e.institution }}
                                        <small class="text-muted">{{ e.from | date: 'yyyy' }} - {{ e.to | date: 'yyyy' }}</small></li>
                                }
                            </ul>
                        }
                    </div>
                    <div class="col-lg-4">
                        <div class="bg-light rounded p-5 mb-4">
                            <h4 class="mb-4">Skills</h4>
                            @for (s of p.skills; track $index) { <span class="badge bg-primary me-2 mb-2">{{ s.name }}</span> } @empty { <p class="m-0">No skills listed.</p> }
                        </div>
                        <div class="bg-light rounded p-5 text-center">
                            <h4 class="mb-4">Scan To Share</h4>
                            <img [src]="qrUrl()" alt="QR code of this profile" class="img-fluid bg-white border rounded p-2" style="max-width: 180px;">
                        </div>
                    </div>
                </div>
            } @else {
                <p class="text-center">{{ profile.loading() ? 'Loading...' : 'This profile link is not available.' }}</p>
            }
        </div>
    </div>
  `,
})
export class SharedProfile {
  readonly token = input.required<string>();
  private readonly profiles = inject(ProfileApi);
  protected readonly profile = new Loader<SharedProfileView>();
  protected readonly qrUrl = signal('');

  constructor() {
    effect(() => {
      this.qrUrl.set(this.profiles.sharedQrUrl(this.token()));
      this.profile.load(this.profiles.shared(this.token()));
    });
  }
}

/** Notification GET/POST /unsubscribe/{token} - one-click email unsubscribe. */
@Component({
  selector: 'app-unsubscribe',
  imports: [PageHeader, RouterLink],
  template: `
    <app-page-header title="Unsubscribe" />
    <div class="container-xxl py-5">
        <div class="container text-center">
            <div class="row justify-content-center"><div class="col-lg-6">
                <i class="fa fa-envelope-open-text display-1 text-primary mb-4"></i>
                @if (done()) {
                    <h1 class="mb-4">You're Unsubscribed</h1>
                    <p class="mb-4">You will no longer receive "{{ category() }}" emails. You can change this any time in your notification settings.</p>
                } @else if (category()) {
                    <h1 class="mb-4">Unsubscribe?</h1>
                    <p class="mb-4">Stop receiving "{{ category() }}" emails from us.</p>
                    <button class="btn btn-primary py-3 px-5" [disabled]="state.busy()" (click)="confirm()">Unsubscribe</button>
                } @else {
                    <p class="mb-4">{{ state.message() ?? 'Checking your link...' }}</p>
                }
                <a class="btn btn-light py-3 px-5 ms-2" routerLink="/">Go Back To Home</a>
            </div></div>
        </div>
    </div>
  `,
})
export class Unsubscribe {
  readonly token = input.required<string>();
  private readonly api = inject(NotificationApi);
  protected readonly category = signal<string | null>(null);
  protected readonly done = signal(false);
  protected readonly state = new ActionState();

  constructor() {
    effect(() => this.state.run(this.api.unsubscribeInfo(this.token()), () => null, r => this.category.set(r.category)));
  }

  protected confirm(): void {
    this.state.run(this.api.unsubscribe(this.token()), () => null, r => {
      this.category.set(r.category ?? this.category());
      this.done.set(true);
    });
  }
}

/** AccountIdentity POST /auth/email-verification - the link sent by email (?accountId=&token=). */
@Component({
  selector: 'app-verify-email',
  imports: [PageHeader, RouterLink],
  template: `
    <app-page-header title="Email Verification" />
    <div class="container-xxl py-5">
        <div class="container text-center">
            <div class="row justify-content-center"><div class="col-lg-6">
                <i class="fa display-1 text-primary mb-4" [class.fa-check-circle]="state.ok() && state.message()" [class.fa-envelope]="!state.message()"
                   [class.fa-exclamation-triangle]="!state.ok()"></i>
                <h1 class="mb-4">{{ state.busy() ? 'Verifying...' : state.ok() ? 'Email Verified' : 'Verification Failed' }}</h1>
                <p class="mb-4">{{ state.message() }}</p>
                <a class="btn btn-primary py-3 px-5" routerLink="/login">Go To Login</a>
            </div></div>
        </div>
    </div>
  `,
})
export class VerifyEmail {
  readonly accountId = input<string>();
  readonly token = input<string>();
  private readonly identity = inject(IdentityApi);
  protected readonly state = new ActionState();

  constructor() {
    effect(() => {
      const id = this.accountId();
      const token = this.token();
      if (id && token) {
        this.state.run(this.identity.verifyEmail(id, token), 'Your email address has been verified.');
      } else {
        this.state.ok.set(false);
        this.state.message.set('This verification link is incomplete.');
      }
    });
  }
}

/** ExternalIntegration GET /api-versions and /docs/{version}: public API documentation for job-site partners. */
@Component({
  selector: 'app-api-docs',
  imports: [PageHeader, RouterLink, FormsModule, JsonView],
  template: `
    <app-page-header title="API Documentation" section="Partners" sectionLink="/partner" />
    <div class="container-xxl py-5">
        <div class="container">
            <div class="row g-4">
                <div class="col-lg-4">
                    <div class="bg-light rounded p-4">
                        <h5 class="mb-3">API Versions</h5>
                        <app-json-view [value]="versions.value()" [emptyText]="versions.loading() ? 'Loading...' : (versions.error() ?? 'No versions published.')" />
                        <div class="input-group mt-3">
                            <input class="form-control" placeholder="Version, e.g. v1" [(ngModel)]="version">
                            <button class="btn btn-primary" (click)="loadDocs()">Open</button>
                        </div>
                        <p class="small text-muted mt-3 mb-0">Integrating a job site? <a routerLink="/register">Register as a partner</a>, then use the <a routerLink="/partner">Partner Console</a>.</p>
                    </div>
                </div>
                <div class="col-lg-8">
                    <div class="bg-light rounded p-4">
                        <h5 class="mb-3">Documentation {{ version }}</h5>
                        <app-json-view [value]="docs.value()" [emptyText]="docs.loading() ? 'Loading...' : (docs.error() ?? 'Choose a version.')" />
                    </div>
                </div>
            </div>
        </div>
    </div>
  `,
})
export class ApiDocs {
  private readonly api = inject(DocsApi);
  protected readonly versions = new Loader<unknown>();
  protected readonly docs = new Loader<unknown>();
  protected version = 'v1';

  constructor() {
    this.versions.load(this.api.versions());
    this.loadDocs();
  }

  protected loadDocs(): void {
    if (this.version.trim()) {
      this.docs.load(this.api.docs(this.version.trim()));
    }
  }
}
