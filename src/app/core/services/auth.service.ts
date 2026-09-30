import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, map, of, shareReplay, tap } from 'rxjs';
import { IdentityApi, LoginBody } from '../api/identity.api';
import { ActorType, AuthenticationResultDto, TokenPairDto } from '../models/api.models';

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  actorType: ActorType | null;
  accountId: string | null;
  username: string;
  mfa: boolean;
}

const STORAGE_KEY = 'jobentry.session';

/** Keeps the signed-in session (tokens from AccountIdentity) and exposes who the user is. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly identity = inject(IdentityApi);
  private readonly router = inject(Router);

  private readonly session = signal<StoredSession | null>(this.readSession());
  private refreshInFlight: Observable<string | null> | null = null;

  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly actorType = computed(() => this.session()?.actorType ?? null);
  readonly accountId = computed(() => this.session()?.accountId ?? null);
  readonly username = computed(() => this.session()?.username ?? '');
  readonly isJobSeeker = computed(() => this.actorType() === 'JobSeeker');
  readonly isEmployer = computed(() => this.actorType() === 'Employer');
  readonly isPartner = computed(() => this.actorType() === 'ExternalJobSite');
  readonly isAdmin = computed(() => this.actorType() === 'Administrator');
  /** Administrator endpoints require an MFA-verified session (amr=mfa). */
  readonly mfaVerified = computed(() => this.session()?.mfa ?? false);

  get accessToken(): string | null {
    return this.session()?.accessToken ?? null;
  }

  /** One login step; stores the session when the API returns tokens. Other statuses (MfaRequired, EmailCodeSent...) are for the caller to continue. */
  login(body: LoginBody): Observable<AuthenticationResultDto> {
    return this.identity.login(body).pipe(tap(result => this.acceptResult(result, body.username)));
  }

  verifyMfa(mfaToken: string, code: string, username: string): Observable<AuthenticationResultDto> {
    return this.identity.mfaVerify(mfaToken, code).pipe(tap(result => this.acceptResult(result, username)));
  }

  /** Exchanges the refresh token for a new pair; concurrent callers share one request. Emits the new access token, or null on failure. */
  refresh(): Observable<string | null> {
    const current = this.session();
    if (!current) {
      return of(null);
    }
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.identity.refresh(current.refreshToken).pipe(
        map(result => {
          if (!result.tokens) {
            return null;
          }
          this.storeTokens(result.tokens, current.username);
          return result.tokens.accessToken;
        }),
        finalize(() => (this.refreshInFlight = null)),
        shareReplay(1),
      );
    }
    return this.refreshInFlight;
  }

  logout(): void {
    if (this.session()) {
      this.identity.logout().subscribe({ error: () => undefined });
    }
    this.clearSession();
    this.router.navigateByUrl('/');
  }

  clearSession(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
  }

  private acceptResult(result: AuthenticationResultDto, username: string): void {
    if (result.tokens) {
      this.storeTokens(result.tokens, username);
    }
  }

  private storeTokens(tokens: TokenPairDto, username: string): void {
    const claims = this.readClaims(tokens.accessToken);
    const amr = claims['amr'];
    const session: StoredSession = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAtUtc: tokens.expiresAtUtc,
      actorType: (claims['actor_type'] as ActorType) ?? null,
      accountId: (claims['sub'] as string) ?? null,
      username,
      mfa: Array.isArray(amr) ? amr.includes('mfa') : amr === 'mfa',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.session.set(session);
  }

  /** JWT payload: actor_type (AppClaimTypes.ActorType), sub, amr. */
  private readClaims(jwt: string): Record<string, unknown> {
    try {
      const payload = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(payload))));
    } catch {
      return {};
    }
  }

  private readSession(): StoredSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  }
}
