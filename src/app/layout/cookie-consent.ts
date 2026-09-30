import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IdentityApi } from '../core/api/identity.api';
import { ConsentStatusDto } from '../core/models/platform.models';

const GUEST_KEY = 'jobentry.guestId';

/**
 * Cookie consent bar driven by AccountIdentity: GET /consents/current says whether the banner is required (and gives its text and the
 * current policy version); POST /consents records the choice for this browser's guest id.
 */
@Component({
  selector: 'app-cookie-consent',
  imports: [FormsModule],
  template: `
    @if (status(); as s) {
        <div class="position-fixed bottom-0 start-0 end-0 bg-dark text-white-50 p-4 shadow-lg" style="z-index: 1050;">
            <div class="container">
                <div class="row g-3 align-items-center">
                    <div class="col-lg-6">
                        <h6 class="text-white mb-1">We value your privacy</h6>
                        <small>{{ s.bannerText.en || s.bannerText.ar }}</small>
                    </div>
                    <div class="col-lg-6">
                        @if (customise()) {
                            <div class="d-flex flex-wrap gap-3 mb-2">
                                <div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="cAnalytics" [(ngModel)]="analytics"><label class="form-check-label" for="cAnalytics">Analytics</label></div>
                                <div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="cPrefs" [(ngModel)]="preferences"><label class="form-check-label" for="cPrefs">Preferences</label></div>
                                <div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="cMarketing" [(ngModel)]="marketing"><label class="form-check-label" for="cMarketing">Marketing</label></div>
                            </div>
                            <button class="btn btn-primary me-2" (click)="save(analytics, preferences, marketing)">Save Choices</button>
                        } @else {
                            <div class="d-flex flex-wrap gap-2 justify-content-lg-end">
                                <button class="btn btn-outline-light" (click)="customise.set(true)">Customise</button>
                                <button class="btn btn-outline-light" (click)="save(false, false, false)">Essential Only</button>
                                <button class="btn btn-primary" (click)="save(true, true, true)">Accept All</button>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    }
  `,
})
export class CookieConsent implements OnInit {
  private readonly identity = inject(IdentityApi);

  /** Set only while the banner must be shown. */
  protected readonly status = signal<ConsentStatusDto | null>(null);
  protected readonly customise = signal(false);
  protected analytics = false;
  protected preferences = true;
  protected marketing = false;

  ngOnInit(): void {
    this.identity.currentConsent(this.read(GUEST_KEY)).subscribe({
      next: s => this.status.set(s.bannerRequired ? s : null),
      error: () => this.status.set(null),
    });
  }

  protected save(analytics: boolean, preferences: boolean, marketing: boolean): void {
    const status = this.status();
    if (!status) {
      return;
    }
    let guestId = status.guestId ?? this.read(GUEST_KEY);
    if (!guestId) {
      guestId = crypto.randomUUID();
      this.write(GUEST_KEY, guestId);
    }
    this.status.set(null);
    this.identity
      .recordConsent({
        guestId,
        policyVersion: status.currentPolicyVersion,
        analytics,
        preferences,
        marketing,
        locale: navigator.language?.startsWith('ar') ? 'ar' : 'en',
      })
      .subscribe({ error: () => undefined });
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable: the server asks again next visit */
    }
  }
}
