import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileApi } from '../../../core/api/profile.api';
import { PrivacySettingView, ShareLinkView } from '../../../core/models/platform.models';
import { ActionState } from '../../../shared/action-state';

/** JobSeekerProfile privacy: visibility, share link (+ QR), deactivation and deletion requests. */
@Component({
  selector: 'app-seeker-privacy',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="bg-light rounded p-4 mb-4">
        <h5 class="mb-3">Profile Visibility</h5>
        @if (privacy(); as p) {
            <p class="small text-muted">Current: <strong>{{ p.visibility }}</strong> &middot; Deletion: {{ p.deletionState }}
               @if (p.deactivationRequestedAtUtc) { &middot; Deactivation requested {{ p.deactivationRequestedAtUtc | date: 'dd MMM, yyyy' }} }</p>
        }
        <div class="form-check form-switch mb-2">
            <input class="form-check-input" type="checkbox" id="isPublic" [(ngModel)]="isPublic">
            <label class="form-check-label" for="isPublic">Employers can find my profile</label>
        </div>
        <div class="form-check form-switch mb-3">
            <input class="form-check-input" type="checkbox" id="sharing" [(ngModel)]="sharing">
            <label class="form-check-label" for="sharing">Allow my public share link to work</label>
        </div>
        <button class="btn btn-primary px-4" [disabled]="state.busy()" (click)="saveVisibility()">Save</button>
        @if (state.message()) { <small class="ms-3" [class.text-danger]="!state.ok()" [class.text-success]="state.ok()">{{ state.message() }}</small> }
    </div>

    <div class="bg-light rounded p-4 mb-4">
        <h5 class="mb-3">Share My Profile</h5>
        @if (link(); as l) {
            <div class="row g-3 align-items-center">
                <div class="col-md-8">
                    <p class="mb-1 small text-muted">Anyone with this link can view your public profile:</p>
                    <div class="input-group">
                        <input class="form-control" readonly [value]="publicUrl(l)">
                        <button class="btn btn-outline-primary" (click)="copy(publicUrl(l))">Copy</button>
                    </div>
                    <small class="text-muted">{{ l.isActive ? 'Active' : 'Inactive' }} &middot; created {{ l.createdAtUtc | date: 'dd MMM, yyyy' }}</small>
                </div>
                <div class="col-md-4 text-center">
                    <img [src]="qrUrl(l)" alt="QR code for your profile link" class="img-fluid border rounded bg-white p-2" style="max-width: 160px;">
                </div>
            </div>
        } @else {
            <p class="text-muted">You don't have a share link yet.</p>
        }
        <button class="btn btn-primary px-4 mt-3" [disabled]="linkState.busy()" (click)="createLink()">{{ link() ? 'Create New Link' : 'Create Share Link' }}</button>
        @if (linkState.message()) { <small class="ms-3" [class.text-danger]="!linkState.ok()" [class.text-success]="linkState.ok()">{{ linkState.message() }}</small> }
    </div>

    <div class="bg-light rounded p-4 border border-danger">
        <h5 class="mb-3 text-danger">Deactivate Or Delete</h5>
        <div class="mb-3">
            <input class="form-control mb-2" placeholder="Reason (optional)" [(ngModel)]="reason">
            <button class="btn btn-outline-danger" [disabled]="dangerState.busy()" (click)="deactivate()">Request Deactivation</button>
        </div>
        <button class="btn btn-danger" [disabled]="dangerState.busy()" (click)="deleteAccount()">Request Permanent Deletion</button>
        @if (dangerState.message()) { <small class="ms-3" [class.text-danger]="!dangerState.ok()" [class.text-success]="dangerState.ok()">{{ dangerState.message() }}</small> }
    </div>
  `,
})
export class SeekerPrivacy implements OnInit {
  private readonly profiles = inject(ProfileApi);

  protected readonly privacy = signal<PrivacySettingView | null>(null);
  protected readonly link = signal<ShareLinkView | null>(null);
  protected readonly state = new ActionState();
  protected readonly linkState = new ActionState();
  protected readonly dangerState = new ActionState();
  protected isPublic = false;
  protected sharing = false;
  protected reason = '';

  ngOnInit(): void {
    this.loadPrivacy();
    this.profiles.shareLink().subscribe({ next: l => this.link.set(l), error: () => this.link.set(null) });
  }

  /** This app's shared-profile page for the token. */
  protected publicUrl(l: ShareLinkView): string {
    return `${location.origin}/shared/${l.token}`;
  }

  protected qrUrl(l: ShareLinkView): string {
    return this.profiles.sharedQrUrl(l.token);
  }

  protected copy(text: string): void {
    navigator.clipboard?.writeText(text);
    this.linkState.ok.set(true);
    this.linkState.message.set('Link copied.');
  }

  protected saveVisibility(): void {
    this.state.run(this.profiles.setVisibility(this.isPublic, this.sharing), 'Visibility saved.', () => this.loadPrivacy());
  }

  protected createLink(): void {
    this.linkState.run(this.profiles.createShareLink(), 'Share link created.', l => this.link.set(l));
  }

  protected deactivate(): void {
    if (confirm('Request deactivation of your account?')) {
      this.dangerState.run(this.profiles.requestDeactivation(this.reason || null), 'Deactivation requested.', () => this.loadPrivacy());
    }
  }

  protected deleteAccount(): void {
    if (confirm('This will permanently delete your profile and data. Continue?')) {
      this.dangerState.run(this.profiles.requestDeletion(), 'Deletion requested.', () => this.loadPrivacy());
    }
  }

  private loadPrivacy(): void {
    this.profiles.privacy().subscribe({
      next: p => {
        this.isPublic = p.visibility === 'Public';
        this.sharing = p.publicSharingActive;
        this.privacy.set(p);
      },
      error: () => this.privacy.set(null),
    });
  }
}
