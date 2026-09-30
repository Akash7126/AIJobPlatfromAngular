import { Component, inject, input, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IdentityApi } from '../../core/api/identity.api';
import { ActorType, AuthenticationResultDto } from '../../core/models/api.models';
import { MfaEnrollmentDto } from '../../core/models/platform.models';
import { apiErrorMessage } from '../../core/services/api-error';
import { AuthService } from '../../core/services/auth.service';
import { PageHeader } from '../../layout/page-header';

type Step = 'credentials' | 'emailCode' | 'mfa';

/** POST /auth/login (password or email code), then /auth/mfa/enroll and /auth/mfa/verify when the account requires MFA. */
@Component({
  selector: 'app-login',
  imports: [PageHeader, FormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  readonly returnUrl = input<string>();
  readonly activated = input<string>();

  private readonly auth = inject(AuthService);
  private readonly identity = inject(IdentityApi);
  private readonly router = inject(Router);

  protected readonly step = signal<Step>('credentials');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly enrollment = signal<MfaEnrollmentDto | null>(null);

  protected mechanism: 'password' | 'email-verification' = 'password';
  protected actorType: ActorType = 'JobSeeker';
  protected username = '';
  protected password = '';
  protected emailCode = '';
  protected mfaCode = '';
  private mfaToken = '';

  protected readonly actorTypes: { value: ActorType; label: string }[] = [
    { value: 'JobSeeker', label: 'Job Seeker' },
    { value: 'Employer', label: 'Employer' },
    { value: 'ExternalJobSite', label: 'External Job Site (Partner)' },
    { value: 'Administrator', label: 'Administrator' },
  ];

  protected submitCredentials(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.call(
      this.auth.login({
        username: this.username.trim(),
        password: this.mechanism === 'password' ? this.password : null,
        mechanism: this.mechanism,
        actorType: this.actorType,
      }),
    );
  }

  protected submitEmailCode(): void {
    this.call(
      this.auth.login({ username: this.username.trim(), mechanism: 'email-verification', actorType: this.actorType, emailCode: this.emailCode.trim() }),
    );
  }

  protected submitMfa(): void {
    this.call(this.auth.verifyMfa(this.mfaToken, this.mfaCode.trim(), this.username.trim()));
  }

  protected back(): void {
    this.step.set('credentials');
    this.error.set(null);
    this.enrollment.set(null);
  }

  private call(request: ReturnType<AuthService['login']>): void {
    this.busy.set(true);
    this.error.set(null);
    request.subscribe({
      next: result => {
        this.busy.set(false);
        this.handle(result);
      },
      error: err => {
        this.busy.set(false);
        this.error.set(apiErrorMessage(err, 'Invalid credentials.'));
      },
    });
  }

  private handle(result: AuthenticationResultDto): void {
    switch (result.status) {
      case 'Authenticated':
        this.router.navigateByUrl(result.mustChangePassword ? '/account/security' : this.returnUrl() || this.homeFor());
        return;
      case 'EmailCodeSent':
        this.step.set('emailCode');
        return;
      case 'MfaRequired':
        this.mfaToken = result.mfaToken ?? '';
        this.step.set('mfa');
        return;
      case 'MfaEnrollmentRequired':
        this.mfaToken = result.mfaToken ?? '';
        this.step.set('mfa');
        this.identity.mfaEnroll(this.mfaToken).subscribe({
          next: enrollment => this.enrollment.set(enrollment),
          error: err => this.error.set(apiErrorMessage(err, 'Could not start MFA enrolment.')),
        });
        return;
      default:
        this.error.set(`Login could not be completed (${result.status}).`);
    }
  }

  private homeFor(): string {
    if (this.auth.isAdmin()) {
      return '/admin';
    }
    if (this.auth.isPartner()) {
      return '/partner';
    }
    return '/account';
  }
}
