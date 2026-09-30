import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContentApi } from '../../../core/api/content.api';
import { EmployerApi } from '../../../core/api/employer.api';
import { ProfileApi } from '../../../core/api/profile.api';
import { CompanyMediaView, CompanySize, EmployerRegistrationView, EmployerVerificationView, Level2Request } from '../../../core/models/platform.models';
import { AuthService } from '../../../core/services/auth.service';
import { ActionState, Loader } from '../../../shared/action-state';
import { JsonView } from '../../../shared/json-view';

const VERIFICATION_KEY = 'jobentry.verificationId';

/**
 * Company profile: level-2 registration (EmployerOnboarding), media & logo (EmployerOnboarding), public company page (HelpContent),
 * government verification (GovernmentIntegration) and company documents (JobSeekerProfile /companies/{id}/documents).
 */
@Component({
  selector: 'app-employer-company',
  imports: [FormsModule, DatePipe, DecimalPipe, RouterLink, JsonView],
  templateUrl: './employer-company.html',
})
export class EmployerCompany implements OnInit {
  private readonly employer = inject(EmployerApi);
  private readonly content = inject(ContentApi);
  private readonly profiles = inject(ProfileApi);
  protected readonly auth = inject(AuthService);

  protected readonly sizes: CompanySize[] = ['Micro', 'Small', 'Medium', 'Large'];
  protected readonly mediaKinds = ['Logo', 'Image', 'RegistrationDocument', 'Other'];

  protected readonly registration = new Loader<EmployerRegistrationView>();
  protected readonly media = new Loader<CompanyMediaView[]>();
  protected readonly verification = signal<EmployerVerificationView | null>(null);

  protected readonly level2State = new ActionState();
  protected readonly mediaState = new ActionState();
  protected readonly pageState = new ActionState();
  protected readonly verifyState = new ActionState();
  protected readonly docState = new ActionState();

  protected level2: Level2Request = {
    companyName: '',
    companyId: '',
    registrationNumber: '',
    website: '',
    industry: '',
    size: 'Small',
    governorate: '',
    city: '',
    street: null,
    description: '',
  };
  protected page = { backgroundEn: '', backgroundAr: '', highlights: '' };
  protected verify = { registrationNumber: '', vatNumber: '', mobileNumber: '' };
  protected mediaFile: File | null = null;
  protected mediaKind = 'Logo';
  protected docFile: File | null = null;
  protected docType = 'CommercialRegistration';

  ngOnInit(): void {
    this.loadRegistration();
    this.media.load(this.employer.media());
    const accountId = this.auth.accountId();
    if (accountId) {
      this.content.companyPage(accountId).subscribe({
        next: p => (this.page = { backgroundEn: p.background.en ?? '', backgroundAr: p.background.ar ?? '', highlights: p.highlights.join('\n') }),
        error: () => undefined,
      });
    }
    const verificationId = localStorage.getItem(VERIFICATION_KEY);
    if (verificationId) {
      this.employer.verification(verificationId).subscribe({ next: v => this.verification.set(v), error: () => undefined });
    }
  }

  protected saveLevel2(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.level2State.run(this.employer.submitLevel2({ ...this.level2, street: this.level2.street || null }), 'Company details submitted for approval.', r =>
      this.registration.value.set(r),
    );
  }

  protected uploadMedia(): void {
    if (this.mediaFile) {
      this.mediaState.run(this.employer.attachMedia(this.mediaFile, this.mediaKind), 'Uploaded.', () => this.media.load(this.employer.media()));
    }
  }

  protected setPrimary(m: CompanyMediaView): void {
    this.mediaState.run(this.employer.setPrimaryLogo(m.companyMediaId), 'Primary logo updated.', () => this.media.load(this.employer.media()));
  }

  protected removeMedia(m: CompanyMediaView): void {
    if (confirm(`Remove ${m.fileName}?`)) {
      this.mediaState.run(this.employer.removeMedia(m.companyMediaId), 'Removed.', () => this.media.load(this.employer.media()));
    }
  }

  protected savePage(): void {
    this.pageState.run(
      this.content.editMyCompanyPage({
        backgroundEn: this.page.backgroundEn || null,
        backgroundAr: this.page.backgroundAr || null,
        highlights: this.page.highlights
          .split('\n')
          .map(h => h.trim())
          .filter(h => h),
      }),
      'Company page saved.',
    );
  }

  protected submitVerification(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.verifyState.run(
      this.employer.submitVerification(this.verify.registrationNumber, this.verify.vatNumber, this.verify.mobileNumber),
      v => `Verification ${v.state}.`,
      v => {
        localStorage.setItem(VERIFICATION_KEY, v.employerVerificationId);
        this.verification.set(v);
      },
    );
  }

  protected refreshVerification(): void {
    const v = this.verification();
    if (v) {
      this.verifyState.run(this.employer.verification(v.employerVerificationId), 'Status refreshed.', fresh => this.verification.set(fresh));
    }
  }

  protected uploadDocument(): void {
    const companyId = this.auth.accountId();
    if (this.docFile && companyId) {
      this.docState.run(this.profiles.attachCompanyDocument(companyId, this.docFile, this.docType), d => `${d.fileName} attached.`);
    }
  }

  private loadRegistration(): void {
    this.employer.registration().subscribe({
      next: r => {
        this.registration.value.set(r);
        if (r.identity) {
          Object.assign(this.level2, { companyName: r.identity.name, companyId: r.identity.companyId, registrationNumber: r.identity.registrationNumber });
          this.verify.registrationNumber ||= r.identity.registrationNumber;
        }
        if (r.level2) {
          Object.assign(this.level2, { ...r.level2, size: r.level2.size as CompanySize });
        }
      },
      error: err => this.registration.error.set(String(err?.message ?? '')),
    });
  }
}
