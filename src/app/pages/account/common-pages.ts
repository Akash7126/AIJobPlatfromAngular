import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { IdentityApi } from '../../core/api/identity.api';
import { NotificationApi, NotificationChannel } from '../../core/api/notification.api';
import { InAppNotificationDto, InAppPage, NotificationPreferencesDto } from '../../core/models/platform.models';
import { NotificationCenter } from '../../core/services/notification-center';
import { ActionState, Loader } from '../../shared/action-state';

/** Notification service in-app inbox: list (filter by status), mark read, act, delete. */
@Component({
  selector: 'app-notifications',
  imports: [DatePipe, FormsModule],
  template: `
    <div class="bg-light rounded p-4">
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
            <h5 class="mb-0">Notifications @if (page.value(); as p) { <span class="badge bg-primary ms-2">{{ p.unread }} unread</span> }</h5>
            <select class="form-select form-select-sm w-auto" [(ngModel)]="status" (change)="load(1)">
                <option value="">All</option>
                <option value="Unread">Unread</option>
                <option value="Read">Read</option>
            </select>
        </div>
        @for (n of page.value()?.items?.items ?? []; track n.id) {
            <div class="d-flex border-bottom py-3" [class.fw-bold]="!n.readAtUtc">
                <div class="bg-white border rounded d-flex flex-shrink-0 align-items-center justify-content-center me-3" style="width: 45px; height: 45px;"
                     [style.color]="n.colour || null" [title]="n.iconTextAlternative">
                    <i class="fa" [class]="iconClass(n)"></i>
                </div>
                <div class="flex-grow-1">
                    <div>{{ n.title }}</div>
                    <small class="d-block fw-normal">{{ n.body }}</small>
                    <small class="text-muted fw-normal">{{ n.createdAtUtc | date: 'dd MMM, yyyy HH:mm' }}</small>
                </div>
                <div class="d-flex flex-column gap-1 ms-2">
                    @if (n.actionUrl) { <button class="btn btn-sm btn-primary" (click)="act(n)">Open</button> }
                    @if (!n.readAtUtc) { <button class="btn btn-sm btn-outline-primary" (click)="markRead(n)">Mark read</button> }
                    <button class="btn btn-sm btn-light text-danger" (click)="remove(n)"><i class="fa fa-trash"></i></button>
                </div>
            </div>
        } @empty {
            <p class="text-muted mb-0">{{ page.loading() ? 'Loading...' : page.error() ?? 'You have no notifications.' }}</p>
        }
        @if ((page.value()?.items?.totalPages ?? 0) > 1) {
            <nav class="d-flex justify-content-center mt-3">
                <ul class="pagination mb-0">
                    <li class="page-item" [class.disabled]="current === 1"><a class="page-link" href="#" (click)="$event.preventDefault(); load(current - 1)">&laquo;</a></li>
                    <li class="page-item active"><span class="page-link">{{ current }} / {{ page.value()?.items?.totalPages }}</span></li>
                    <li class="page-item" [class.disabled]="current === page.value()?.items?.totalPages"><a class="page-link" href="#" (click)="$event.preventDefault(); load(current + 1)">&raquo;</a></li>
                </ul>
            </nav>
        }
    </div>
  `,
})
export class Notifications implements OnInit {
  private readonly api = inject(NotificationApi);
  private readonly center = inject(NotificationCenter);
  private readonly router = inject(Router);

  protected readonly page = new Loader<InAppPage>();
  protected status = '';
  protected current = 1;

  ngOnInit(): void {
    this.load(1);
  }

  protected load(page: number): void {
    this.current = page;
    this.page.load(this.api.list(this.status || null, page, 20));
  }

  protected iconClass(n: InAppNotificationDto): string {
    return n.icon?.startsWith('fa-') ? n.icon : 'fa-bell';
  }

  protected markRead(n: InAppNotificationDto): void {
    this.api.markRead(n.id).subscribe(() => this.refresh());
  }

  protected remove(n: InAppNotificationDto): void {
    this.api.remove(n.id).subscribe(() => this.refresh());
  }

  protected act(n: InAppNotificationDto): void {
    this.api.takeAction(n.id).subscribe(result => {
      const url = result?.actionUrl ?? n.actionUrl;
      this.center.refresh();
      if (url?.startsWith('/')) {
        this.router.navigateByUrl(url);
      } else if (url) {
        window.open(url, '_blank', 'noopener');
      }
    });
  }

  private refresh(): void {
    this.load(this.current);
    this.center.refresh();
  }
}

/** Notification preferences per channel (email / in-app / SMS). */
@Component({
  selector: 'app-notification-settings',
  imports: [FormsModule, KeyValuePipe],
  template: `
    @for (channel of channels; track channel.key) {
        <div class="bg-light rounded p-4 mb-4">
            <h5 class="mb-3"><i class="fa text-primary me-2" [class]="channel.icon"></i>{{ channel.label }}</h5>
            @if (prefs()[channel.key]; as p) {
                @if (channel.key !== 'sms') {
                    <div class="row">
                        @for (c of p.categories | keyvalue; track c.key) {
                            <div class="col-md-6">
                                <div class="form-check form-switch mb-2">
                                    <input class="form-check-input" type="checkbox" [id]="channel.key + c.key" [(ngModel)]="p.categories[c.key]"
                                           [disabled]="p.mandatory.includes(c.key)">
                                    <label class="form-check-label" [for]="channel.key + c.key">{{ c.key }} @if (p.mandatory.includes(c.key)) { <small class="text-muted">(required)</small> }</label>
                                </div>
                            </div>
                        } @empty { <p class="text-muted small">No categories.</p> }
                    </div>
                    @if (channel.key === 'email') {
                        <div class="mb-3" style="max-width: 260px;">
                            <label class="form-label small mb-1" for="emailMode">Delivery</label>
                            <select id="emailMode" class="form-select form-select-sm" [(ngModel)]="p.mode">
                                <option [ngValue]="null">Default</option>
                                <option value="Immediate">Immediate</option>
                                <option value="Digest">Daily digest</option>
                            </select>
                        </div>
                    }
                } @else {
                    <p class="small text-muted">Current number: {{ p.mobileMasked || 'none' }}</p>
                    <div class="row g-2 align-items-center mb-3">
                        <div class="col-md-6"><input class="form-control" placeholder="Mobile number" [(ngModel)]="smsMobile"></div>
                        <div class="col-md-6">
                            <div class="form-check form-switch mb-0">
                                <input class="form-check-input" type="checkbox" id="smsOptIn" [(ngModel)]="smsOptIn">
                                <label class="form-check-label" for="smsOptIn">Receive SMS notifications</label>
                            </div>
                        </div>
                    </div>
                }
                @if (p.unsubscribed.length) { <p class="small text-muted">Unsubscribed: {{ p.unsubscribed.join(', ') }}</p> }
                <button class="btn btn-primary px-4" [disabled]="state[channel.key].busy()" (click)="save(channel.key)">Save</button>
                @if (state[channel.key].message()) {
                    <small class="ms-3" [class.text-danger]="!state[channel.key].ok()" [class.text-success]="state[channel.key].ok()">{{ state[channel.key].message() }}</small>
                }
            } @else {
                <p class="text-muted mb-0">Loading...</p>
            }
        </div>
    }
  `,
})
export class NotificationSettings implements OnInit {
  private readonly api = inject(NotificationApi);

  protected readonly channels: { key: NotificationChannel; label: string; icon: string }[] = [
    { key: 'email', label: 'Email', icon: 'fa-envelope' },
    { key: 'in-app', label: 'In-App', icon: 'fa-bell' },
    { key: 'sms', label: 'SMS', icon: 'fa-sms' },
  ];
  protected readonly prefs = signal<Partial<Record<NotificationChannel, NotificationPreferencesDto>>>({});
  protected readonly state: Record<NotificationChannel, ActionState> = {
    email: new ActionState(),
    'in-app': new ActionState(),
    sms: new ActionState(),
  };
  protected smsMobile = '';
  protected smsOptIn = false;

  ngOnInit(): void {
    for (const c of this.channels) {
      this.api.preferences(c.key).subscribe({
        next: p => {
          if (c.key === 'sms') {
            this.smsOptIn = !!p.smsOptedIn;
          }
          this.prefs.update(all => ({ ...all, [c.key]: { ...p, categories: { ...(p.categories ?? {}) } } }));
        },
        error: () => this.prefs.update(all => ({ ...all, [c.key]: { categories: {}, mandatory: [], mode: null, smsOptedIn: null, mobileMasked: null, unsubscribed: [] } })),
      });
    }
  }

  protected save(channel: NotificationChannel): void {
    const p = this.prefs()[channel]!;
    const request =
      channel === 'email'
        ? this.api.setEmailPreferences(p.categories, p.mode)
        : channel === 'in-app'
          ? this.api.setInAppPreferences(p.categories)
          : this.api.setSmsPreferences(this.smsMobile || null, this.smsOptIn);
    this.state[channel].run(request, 'Saved.');
  }
}

/** AccountIdentity: change password. */
@Component({
  selector: 'app-security',
  imports: [FormsModule],
  template: `
    <div class="bg-light rounded p-4">
        <h5 class="mb-3">Change Password</h5>
        @if (state.message()) { <div class="alert" [class.alert-success]="state.ok()" [class.alert-danger]="!state.ok()">{{ state.message() }}</div> }
        <form #f="ngForm" (ngSubmit)="save(f)" novalidate style="max-width: 480px;">
            <div class="row g-3">
                <div class="col-12"><div class="form-floating">
                    <input type="password" class="form-control" id="current" name="current" placeholder="Current" required [(ngModel)]="current" autocomplete="current-password">
                    <label for="current">Current Password</label></div></div>
                <div class="col-12"><div class="form-floating">
                    <input type="password" class="form-control" id="next" name="next" placeholder="New" required minlength="8" [(ngModel)]="next" autocomplete="new-password">
                    <label for="next">New Password (min. 8 characters)</label></div></div>
                <div class="col-12"><button class="btn btn-primary w-100 py-3" type="submit" [disabled]="state.busy()">Update Password</button></div>
            </div>
        </form>
    </div>
  `,
})
export class Security {
  private readonly identity = inject(IdentityApi);
  protected readonly state = new ActionState();
  protected current = '';
  protected next = '';

  protected save(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.state.run(this.identity.changePassword(this.current, this.next), 'Your password has been updated.', () => form.resetForm());
  }
}
