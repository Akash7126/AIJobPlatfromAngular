import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { NotificationApi } from '../api/notification.api';
import { AuthService } from './auth.service';

const POLL_MS = 60_000;

/** Unread in-app notification count for the navbar bell; polls while signed in. */
@Injectable({ providedIn: 'root' })
export class NotificationCenter {
  private readonly api = inject(NotificationApi);
  private readonly auth = inject(AuthService);

  readonly unread = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      this.stop();
      if (this.auth.isLoggedIn()) {
        this.refresh();
        this.timer = setInterval(() => this.refresh(), POLL_MS);
      } else {
        this.unread.set(0);
      }
    });
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  refresh(): void {
    this.api.list('Unread', 1, 1).subscribe({
      next: page => this.unread.set(page.unread ?? 0),
      error: () => this.unread.set(0),
    });
  }

  private stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
