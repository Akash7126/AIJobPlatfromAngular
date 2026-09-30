import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PageHeader } from '../../layout/page-header';

interface NavItem {
  link: string;
  label: string;
  icon: string;
}

const SEEKER_NAV: NavItem[] = [
  { link: 'profile', label: 'My Profile', icon: 'fa-user' },
  { link: 'documents', label: 'Resume & Documents', icon: 'fa-file-alt' },
  { link: 'preferences', label: 'Job Preferences', icon: 'fa-sliders-h' },
  { link: 'matches', label: 'AI Job Matches', icon: 'fa-magic' },
  { link: 'saved-searches', label: 'Saved Searches', icon: 'fa-search' },
  { link: 'interested', label: 'Interested Jobs', icon: 'fa-bookmark' },
  { link: '/favorites', label: 'Favorite Jobs', icon: 'fa-heart' },
  { link: 'news-feed', label: 'My News Feed', icon: 'fa-newspaper' },
  { link: 'privacy', label: 'Privacy & Sharing', icon: 'fa-user-lock' },
];

const EMPLOYER_NAV: NavItem[] = [
  { link: 'overview', label: 'Dashboard', icon: 'fa-tachometer-alt' },
  { link: 'company', label: 'Company Profile', icon: 'fa-building' },
  { link: '/my-jobs', label: 'My Job Postings', icon: 'fa-briefcase' },
  { link: '/post-job', label: 'Post A Job', icon: 'fa-plus' },
  { link: 'candidates', label: 'Find Candidates', icon: 'fa-user-friends' },
  { link: 'talent-pool', label: 'Talent Pool', icon: 'fa-users' },
];

const COMMON_NAV: NavItem[] = [
  { link: 'notifications', label: 'Notifications', icon: 'fa-bell' },
  { link: 'notification-settings', label: 'Notification Settings', icon: 'fa-cog' },
  { link: 'security', label: 'Password & Security', icon: 'fa-shield-alt' },
];

/** /account/* - job seeker or employer area with a sidebar in the template's light-card style. */
@Component({
  selector: 'app-account-shell',
  imports: [PageHeader, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <app-page-header [title]="title()" section="Account" sectionLink="/account" />

    <div class="container-xxl py-5">
        <div class="container">
            <div class="row g-4">
                <div class="col-lg-3">
                    <div class="bg-light rounded p-4">
                        <div class="d-flex align-items-center mb-4">
                            <div class="bg-white border rounded d-flex flex-shrink-0 align-items-center justify-content-center me-3" style="width: 45px; height: 45px;">
                                <i class="fa fa-user text-primary"></i>
                            </div>
                            <div class="text-truncate">
                                <h6 class="mb-0 text-truncate">{{ auth.username() }}</h6>
                                <small class="text-muted">{{ roleLabel() }}</small>
                            </div>
                        </div>
                        <div class="list-group list-group-flush">
                            @for (item of nav(); track item.link) {
                                <a class="list-group-item list-group-item-action bg-transparent border-0 px-0 py-2"
                                   [routerLink]="item.link" routerLinkActive="text-primary fw-bold">
                                    <i class="fa fa-fw text-primary me-2" [class]="item.icon"></i>{{ item.label }}
                                </a>
                            }
                            <a class="list-group-item list-group-item-action bg-transparent border-0 px-0 py-2" href="#" (click)="$event.preventDefault(); auth.logout()">
                                <i class="fa fa-fw fa-sign-out-alt text-primary me-2"></i>Logout
                            </a>
                        </div>
                    </div>
                </div>
                <div class="col-lg-9">
                    <router-outlet />
                </div>
            </div>
        </div>
    </div>
  `,
})
export class AccountShell {
  protected readonly auth = inject(AuthService);

  protected readonly nav = computed(() => [...(this.auth.isEmployer() ? EMPLOYER_NAV : this.auth.isJobSeeker() ? SEEKER_NAV : []), ...COMMON_NAV]);
  protected readonly title = computed(() => (this.auth.isEmployer() ? 'Employer Dashboard' : 'My Account'));
  protected readonly roleLabel = computed(() => {
    switch (this.auth.actorType()) {
      case 'Employer':
        return 'Employer';
      case 'JobSeeker':
        return 'Job Seeker';
      case 'ExternalJobSite':
        return 'Job Site Partner';
      case 'Administrator':
        return 'Administrator';
      default:
        return '';
    }
  });
}
