import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ActorType,
  AuthenticationResultDto,
  RegisterEmployerRequest,
  RegisterJobSeekerRequest,
  RegisteredAccountDto,
} from '../models/api.models';
import { ConsentRequest, ConsentStatusDto, MfaEnrollmentDto, RegisterPartnerRequest } from '../models/platform.models';
import { ApiClient, seg } from './api-client';

export interface LoginBody {
  username: string;
  password?: string | null;
  mechanism: 'password' | 'email-verification' | 'mfa';
  actorType?: ActorType | null;
  mfaCode?: string | null;
  emailCode?: string | null;
}

/** AccountIdentity service: /api/v1/auth, /api/v1/accounts, /api/v1/consents, /api/v1/api-credentials. (Admin routes live in the admin console.) */
@Injectable({ providedIn: 'root' })
export class IdentityApi {
  private readonly api = inject(ApiClient);

  login(body: LoginBody): Observable<AuthenticationResultDto> {
    return this.api.post('identity', 'api/v1/auth/login', body);
  }

  mfaEnroll(mfaToken: string): Observable<MfaEnrollmentDto> {
    return this.api.post('identity', 'api/v1/auth/mfa/enroll', { mfaToken });
  }

  mfaVerify(mfaToken: string, code: string): Observable<AuthenticationResultDto> {
    return this.api.post('identity', 'api/v1/auth/mfa/verify', { mfaToken, code });
  }

  refresh(refreshToken: string): Observable<AuthenticationResultDto> {
    return this.api.post('identity', 'api/v1/auth/refresh', { refreshToken });
  }

  logout(): Observable<void> {
    return this.api.post('identity', 'api/v1/auth/logout');
  }

  verifyEmail(accountId: string, token: string): Observable<void> {
    return this.api.post('identity', 'api/v1/auth/email-verification', { accountId, token });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.api.post('identity', 'api/v1/auth/password', { currentPassword, newPassword });
  }

  registerJobSeeker(body: RegisterJobSeekerRequest): Observable<RegisteredAccountDto> {
    return this.api.post('identity', 'api/v1/accounts/job-seekers', body, { idempotent: true });
  }

  registerEmployer(body: RegisterEmployerRequest): Observable<RegisteredAccountDto> {
    return this.api.post('identity', 'api/v1/accounts/employers', body, { idempotent: true });
  }

  registerPartner(body: RegisterPartnerRequest): Observable<RegisteredAccountDto> {
    return this.api.post('identity', 'api/v1/accounts/external-job-sites', body, { idempotent: true });
  }

  resendActivationCode(accountId: string): Observable<void> {
    return this.api.post('identity', `api/v1/accounts/${seg(accountId)}/activation-code`);
  }

  activate(accountId: string, code: string): Observable<void> {
    return this.api.post('identity', `api/v1/accounts/${seg(accountId)}/activate`, { code });
  }

  recordConsent(body: ConsentRequest): Observable<unknown> {
    return this.api.post('identity', 'api/v1/consents', body);
  }

  currentConsent(guestId: string | null): Observable<ConsentStatusDto> {
    return this.api.get('identity', 'api/v1/consents/current', { guestId });
  }
}
