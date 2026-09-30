import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ContractType, WorkFormat } from '../../core/models/api.models';
import { CONTRACT_TYPES, JOB_CATEGORIES, categoryName } from '../../core/models/categories';
import { apiErrorMessage } from '../../core/services/api-error';
import { JobsApi } from '../../core/api/jobs.api';
import { PageHeader } from '../../layout/page-header';

const splitList = (value: string): string[] =>
  value
    .split(',')
    .map(v => v.trim())
    .filter(v => v.length > 0);

/** POST /jobs (Employer). Categories come from GET /taxonomy/posting-schema when available. */
@Component({
  selector: 'app-post-job',
  imports: [PageHeader, FormsModule],
  templateUrl: './post-job.html',
})
export class PostJob implements OnInit {
  private readonly jobs = inject(JobsApi);
  private readonly router = inject(Router);

  protected readonly contractTypes = CONTRACT_TYPES;
  protected readonly workFormats: WorkFormat[] = ['Physical', 'Online', 'Hybrid'];
  protected readonly educationLevels = ['None', 'Primary', 'Secondary', 'Diploma', 'Bachelor', 'Master', 'Doctorate'];
  protected readonly categories = signal(JOB_CATEGORIES.map(c => ({ code: c.code, name: c.name })));
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly model = {
    titleEn: '',
    titleAr: '',
    summaryEn: '',
    summaryAr: '',
    skills: '',
    categoryCode: '',
    contractType: 'FullTime' as ContractType,
    workFormat: 'Physical' as WorkFormat,
    educationLevel: '',
    governorate: '',
    city: '',
    salaryMin: null as number | null,
    salaryMax: null as number | null,
    salaryCurrency: 'USD',
    minExperienceYears: null as number | null,
    maxExperienceYears: null as number | null,
    languages: '',
    deadline: '',
    autoClose: true,
    jobLink: '',
  };

  ngOnInit(): void {
    this.jobs.schema().subscribe({
      next: schema => {
        if (schema.categoryCodes?.length) {
          this.categories.set(schema.categoryCodes.map(code => ({ code, name: categoryName(code) })));
        }
      },
      error: () => undefined,
    });
  }

  protected submit(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    const m = this.model;
    this.busy.set(true);
    this.error.set(null);
    this.jobs
      .create({
        titleEn: m.titleEn.trim(),
        titleAr: m.titleAr.trim() || m.titleEn.trim(),
        summaryEn: m.summaryEn.trim(),
        summaryAr: m.summaryAr.trim() || m.summaryEn.trim(),
        skills: splitList(m.skills),
        categoryCode: m.categoryCode,
        contractType: m.contractType,
        educationLevel: m.educationLevel || null,
        requiredTraining: null,
        workFormat: m.workFormat,
        governorate: m.governorate.trim() || null,
        city: m.city.trim() || null,
        salaryMin: m.salaryMin,
        salaryMax: m.salaryMax,
        salaryCurrency: m.salaryMin != null || m.salaryMax != null ? m.salaryCurrency : null,
        minExperienceYears: m.minExperienceYears,
        maxExperienceYears: m.maxExperienceYears,
        requiredLanguages: splitList(m.languages),
        deadlineUtc: new Date(`${m.deadline}T23:59:59`).toISOString(),
        autoClose: m.autoClose,
        jobLink: m.jobLink.trim() || null,
        otherFields: null,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.router.navigate(['/my-jobs']);
        },
        error: err => {
          this.busy.set(false);
          this.error.set(apiErrorMessage(err, 'Could not create the job posting.'));
        },
      });
  }
}
