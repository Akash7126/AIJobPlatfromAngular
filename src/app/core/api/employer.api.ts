import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CompanyMediaView,
  EmployerDashboardDto,
  EmployerRegistrationView,
  EmployerVerificationView,
  JobStatusHistoryDto,
  Level2Request,
} from '../models/platform.models';
import { ApiClient, seg } from './api-client';

/** EmployerOnboarding (registration, media), GovernmentIntegration (verification) and AuditLogging (dashboard, history) for the signed-in employer. */
@Injectable({ providedIn: 'root' })
export class EmployerApi {
  private readonly api = inject(ApiClient);

  // EmployerOnboarding
  registration(): Observable<EmployerRegistrationView> {
    return this.api.get('employer', 'api/v1/employers/me/registration');
  }

  submitLevel2(body: Level2Request): Observable<EmployerRegistrationView> {
    return this.api.put('employer', 'api/v1/employers/me/registration/level2', body);
  }

  media(): Observable<CompanyMediaView[]> {
    return this.api.get('employer', 'api/v1/employers/me/media');
  }

  attachMedia(file: File, kind: string): Observable<CompanyMediaView> {
    return this.api.upload('employer', 'api/v1/employers/me/media', file, { kind });
  }

  removeMedia(id: string): Observable<void> {
    return this.api.delete('employer', `api/v1/employers/me/media/${seg(id)}`);
  }

  setPrimaryLogo(id: string): Observable<void> {
    return this.api.put('employer', `api/v1/employers/me/media/${seg(id)}/primary`);
  }

  // GovernmentIntegration
  submitVerification(registrationNumber: string, vatNumber: string, mobileNumber: string): Observable<EmployerVerificationView> {
    return this.api.post('government', 'api/v1/employer-verifications', { registrationNumber, vatNumber, mobileNumber });
  }

  verification(id: string): Observable<EmployerVerificationView> {
    return this.api.get('government', `api/v1/employer-verifications/${seg(id)}`);
  }

  // AuditLogging
  dashboard(): Observable<EmployerDashboardDto> {
    return this.api.get('audit', 'api/v1/employers/me/dashboard');
  }

  statusHistory(jobPostingId: string): Observable<JobStatusHistoryDto[]> {
    return this.api.get('audit', `api/v1/jobs/${seg(jobPostingId)}/status-history`);
  }

  candidateInsight(candidateId: string, jobPostingId: string): Observable<unknown> {
    return this.api.get('audit', `api/v1/employers/me/candidates/${seg(candidateId)}/insight`, { jobPostingId });
  }
}
