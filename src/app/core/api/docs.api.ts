import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, seg } from './api-client';

/** ExternalIntegration public surface: API versions and interface documentation. */
@Injectable({ providedIn: 'root' })
export class DocsApi {
  private readonly api = inject(ApiClient);

  versions(): Observable<unknown> {
    return this.api.get('external', 'api/v1/api-versions');
  }

  docs(version: string): Observable<unknown> {
    return this.api.get('external', `api/v1/docs/${seg(version)}`);
  }

  interfaces(version: string): Observable<unknown> {
    return this.api.get('external', `api/v1/docs/${seg(version)}/interfaces`);
  }

  /** PlatformAdministration liveness endpoint. */
  health(): Observable<unknown> {
    return this.api.get('admin', 'api/v1/health');
  }
}
