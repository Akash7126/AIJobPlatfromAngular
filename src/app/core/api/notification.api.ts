import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InAppPage, NotificationPreferencesDto } from '../models/platform.models';
import { ApiClient, seg } from './api-client';

export type NotificationChannel = 'email' | 'in-app' | 'sms';

/** Notification service: in-app inbox, channel preferences and one-click unsubscribe. */
@Injectable({ providedIn: 'root' })
export class NotificationApi {
  private readonly api = inject(ApiClient);

  list(status: string | null, page = 1, pageSize = 20): Observable<InAppPage> {
    return this.api.get('notification', 'api/v1/notifications', { status, page, pageSize });
  }

  markRead(id: string): Observable<unknown> {
    return this.api.post('notification', `api/v1/notifications/${seg(id)}/read`);
  }

  remove(id: string): Observable<void> {
    return this.api.delete('notification', `api/v1/notifications/${seg(id)}`);
  }

  takeAction(id: string): Observable<{ actionUrl: string | null }> {
    return this.api.post('notification', `api/v1/notifications/${seg(id)}/action`);
  }

  preferences(channel: NotificationChannel): Observable<NotificationPreferencesDto> {
    return this.api.get('notification', `api/v1/notification-preferences/${seg(channel)}`);
  }

  setEmailPreferences(categories: Record<string, boolean>, mode: string | null): Observable<unknown> {
    return this.api.put('notification', 'api/v1/notification-preferences/email', { categories, mode });
  }

  setInAppPreferences(categories: Record<string, boolean>): Observable<unknown> {
    return this.api.put('notification', 'api/v1/notification-preferences/in-app', { categories });
  }

  setSmsPreferences(mobile: string | null, optIn: boolean): Observable<unknown> {
    return this.api.put('notification', 'api/v1/notification-preferences/sms', { mobile, optIn });
  }

  unsubscribeInfo(token: string): Observable<{ category: string }> {
    return this.api.get('notification', `api/v1/unsubscribe/${seg(token)}`);
  }

  unsubscribe(token: string): Observable<{ category: string }> {
    return this.api.post('notification', `api/v1/unsubscribe/${seg(token)}`);
  }
}
