import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { RegisteredAccountDto } from '../../core/models/api.models';
import { apiErrorMessage } from '../../core/services/api-error';
import { IdentityApi } from '../../core/api/identity.api';
import { PageHeader } from '../../layout/page-header';

type Kind = 'seeker' | 'employer' | 'partner';

/** The API accepts Bangladeshi mobiles as +8801XXXXXXXXX; also accept 01XXXXXXXXX / 8801XXXXXXXXX with spaces or dashes. */
function normalizeMobile(value: string): string {
  const digits = value.replace(/[\s()-]/g, '');
  if (/^01\d{9}$/.test(digits)) {
    return `+88${digits}`;
  }
  if (/^8801\d{9}$/.test(digits)) {
    return `+${digits}`;
  }
  return digits;
}

/** POST /accounts/job-seekers | /accounts/employers | /accounts/external-job-sites, then POST /accounts/{id}/activate with the code that was sent. */
@Component({
  selector: 'app-register',
  imports: [PageHeader, FormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  private readonly auth = inject(IdentityApi);
  private readonly router = inject(Router);

  protected readonly kind = signal<Kind>('seeker');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly info = signal<string | null>(null);
  protected readonly registered = signal<RegisteredAccountDto | null>(null);

  protected readonly seeker = { fullName: '', mobile: '', email: '', password: '', preferredLanguage: 'en' };
  protected readonly employer = { companyName: '', email: '', mobile: '', companyId: '', registrationNumber: '', password: '' };
  protected readonly partner = { organisationName: '', contactEmail: '', mobile: '', identity: '', password: '' };
  protected code = '';

  protected select(kind: Kind): void {
    this.kind.set(kind);
    this.error.set(null);
  }

  protected submit(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    const request: Observable<RegisteredAccountDto> =
      this.kind() === 'seeker'
        ? this.auth.registerJobSeeker({ ...this.seeker, mobile: normalizeMobile(this.seeker.mobile), email: this.seeker.email.trim() || null })
        : this.kind() === 'employer'
          ? this.auth.registerEmployer({ ...this.employer, mobile: normalizeMobile(this.employer.mobile), level: 1 })
          : this.auth.registerPartner({ ...this.partner, mobile: normalizeMobile(this.partner.mobile) });

    this.run(request, account => {
      this.registered.set(account);
      this.info.set('Your account has been created. Enter the activation code we sent you to activate it.');
    });
  }

  protected activate(form: NgForm): void {
    const account = this.registered();
    if (!account || form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.run(this.auth.activate(account.accountId, this.code.trim()), () =>
      this.router.navigate(['/login'], { queryParams: { activated: true } }),
    );
  }

  protected resend(): void {
    const account = this.registered();
    if (account) {
      this.run(this.auth.resendActivationCode(account.accountId), () => this.info.set('A new activation code has been sent.'));
    }
  }

  private run<T>(request: Observable<T>, onSuccess: (value: T) => void): void {
    this.busy.set(true);
    this.error.set(null);
    request.subscribe({
      next: value => {
        this.busy.set(false);
        onSuccess(value);
      },
      error: err => {
        this.busy.set(false);
        this.error.set(apiErrorMessage(err));
      },
    });
  }
}
