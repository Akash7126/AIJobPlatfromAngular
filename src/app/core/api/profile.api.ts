import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CertificateItem,
  CreateProfileRequest,
  DocumentView,
  EducationItem,
  ExperienceItem,
  FullProfileView,
  JobPreferenceRequest,
  JobPreferenceView,
  PrivacySettingView,
  ProfileCompletionView,
  ResumeView,
  ShareLinkView,
  SharedProfileView,
  SkillItem,
  SocialLink,
  TrainingItem,
} from '../models/platform.models';
import { ApiClient, seg } from './api-client';

/** JobSeekerProfile service: profile sections, privacy, documents, resume and share links. */
@Injectable({ providedIn: 'root' })
export class ProfileApi {
  private readonly api = inject(ApiClient);

  create(body: CreateProfileRequest): Observable<FullProfileView> {
    return this.api.post('profile', 'api/v1/profiles', body);
  }

  mine(): Observable<FullProfileView> {
    return this.api.get('profile', 'api/v1/profiles/me');
  }

  completion(): Observable<ProfileCompletionView> {
    return this.api.get('profile', 'api/v1/profiles/me/completion');
  }

  updateLevel1(body: CreateProfileRequest): Observable<unknown> {
    return this.api.put('profile', 'api/v1/profiles/me/level1', body);
  }

  updateEducation(items: EducationItem[]): Observable<unknown> {
    return this.api.put('profile', 'api/v1/profiles/me/education', items.map(({ degree, institution, from, to }) => ({ degree, institution, from, to })));
  }

  updateExperience(entries: ExperienceItem[], yearsOfExperience: number | null): Observable<unknown> {
    return this.api.put('profile', 'api/v1/profiles/me/experience', {
      entries: entries.map(({ company, role, from, to }) => ({ company, role, from, to })),
      yearsOfExperience,
    });
  }

  updateSkills(items: SkillItem[]): Observable<unknown> {
    return this.api.put('profile', 'api/v1/profiles/me/skills', items.map(({ name, kind, class: cls }) => ({ name, kind, class: cls })));
  }

  updateTraining(items: TrainingItem[]): Observable<unknown> {
    return this.api.put('profile', 'api/v1/profiles/me/training', items.map(({ name, provider, completedOn }) => ({ name, provider, completedOn })));
  }

  updateCertificates(items: CertificateItem[]): Observable<unknown> {
    return this.api.put('profile', 'api/v1/profiles/me/certificates', items.map(({ name, issuer, issuedOn }) => ({ name, issuer, issuedOn })));
  }

  updateLevel3(socialLinks: SocialLink[], statement: string | null, bio: string | null): Observable<unknown> {
    return this.api.put('profile', 'api/v1/profiles/me/level3', { socialLinks, statement, bio });
  }

  jobPreference(): Observable<JobPreferenceView> {
    return this.api.get('profile', 'api/v1/profiles/me/job-preference');
  }

  setJobPreference(body: JobPreferenceRequest): Observable<void> {
    return this.api.put('profile', 'api/v1/profiles/me/job-preference', body);
  }

  privacy(): Observable<PrivacySettingView> {
    return this.api.get('profile', 'api/v1/profiles/me/privacy');
  }

  setVisibility(isPublic: boolean, publicSharingActive: boolean): Observable<void> {
    return this.api.put('profile', 'api/v1/profiles/me/privacy/visibility', { public: isPublic, publicSharingActive });
  }

  requestDeactivation(reason: string | null): Observable<void> {
    return this.api.post('profile', 'api/v1/profiles/me/privacy/deactivation', { reason });
  }

  requestDeletion(): Observable<void> {
    return this.api.post('profile', 'api/v1/profiles/me/privacy/deletion', { confirm: true });
  }

  // Documents & resume
  documents(): Observable<DocumentView[]> {
    return this.api.get('profile', 'api/v1/profiles/me/documents');
  }

  attachDocument(file: File, documentType: string): Observable<DocumentView> {
    return this.api.upload('profile', 'api/v1/profiles/me/documents', file, { documentType });
  }

  removeDocument(id: string): Observable<void> {
    return this.api.delete('profile', `api/v1/profiles/me/documents/${seg(id)}`);
  }

  uploadResume(file: File): Observable<ResumeView> {
    return this.api.upload('profile', 'api/v1/profiles/me/resume', file);
  }

  resume(): Observable<ResumeView> {
    return this.api.get('profile', 'api/v1/profiles/me/resume');
  }

  /** Employer company documents. */
  attachCompanyDocument(companyId: string, file: File, documentType: string): Observable<DocumentView> {
    return this.api.upload('profile', `api/v1/companies/${seg(companyId)}/documents`, file, { documentType });
  }

  // Share link (owner) and public shared view
  createShareLink(): Observable<ShareLinkView> {
    return this.api.post('profile', 'api/v1/profiles/me/share-link');
  }

  shareLink(): Observable<ShareLinkView> {
    return this.api.get('profile', 'api/v1/profiles/me/share-link');
  }

  shared(token: string): Observable<SharedProfileView> {
    return this.api.get('profile', `shared/${seg(token)}`);
  }

  sharedQrUrl(token: string): string {
    return this.api.url('profile', `shared/${seg(token)}/qr`);
  }
}
