import { Component, effect, inject, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { EmployerApi } from '../../../core/api/employer.api';
import { JobsApi } from '../../../core/api/jobs.api';
import { MatchingApi, SourcingApi } from '../../../core/api/matching.api';
import { ContractType, JobPostingView, PagedResult, WorkFormat } from '../../../core/models/api.models';
import { CONTRACT_TYPES } from '../../../core/models/categories';
import { JobStatusHistoryDto, ShortlistDto, ThresholdView } from '../../../core/models/platform.models';
import { ActionState, Loader } from '../../../shared/action-state';
import { JsonView } from '../../../shared/json-view';

type Tab = 'edit' | 'candidates' | 'shortlist' | 'history';
type CandidateSource = 'ai-matches' | 'ai-recommendations' | 'sourcing-recommendations' | 'sourcing-ranking';

const lines = (v: string): string[] =>
  v
    .split(',')
    .map(s => s.trim())
    .filter(s => s);

/**
 * /account/jobs/:id - one posting: edit (PUT /jobs/{id}), renew, status history (AuditLogging), candidate matches and
 * recommendations (AiMatching + CandidateSourcing), qualification threshold and AI shortlists.
 */
@Component({
  selector: 'app-employer-job',
  imports: [FormsModule, DatePipe, DecimalPipe, RouterLink, JsonView],
  templateUrl: './employer-job.html',
})
export class EmployerJob {
  readonly id = input.required<string>();

  private readonly jobs = inject(JobsApi);
  private readonly employer = inject(EmployerApi);
  private readonly matching = inject(MatchingApi);
  private readonly sourcing = inject(SourcingApi);

  protected readonly contractTypes = CONTRACT_TYPES;
  protected readonly workFormats: WorkFormat[] = ['Physical', 'Online', 'Hybrid'];
  protected readonly tab = signal<Tab>('edit');
  protected readonly job = new Loader<JobPostingView>();
  protected readonly history = new Loader<JobStatusHistoryDto[]>();
  protected readonly candidates = new Loader<PagedResult<Record<string, unknown>>>();
  protected readonly threshold = signal<ThresholdView | null>(null);
  protected readonly shortlist = signal<ShortlistDto | null>(null);

  protected readonly saveState = new ActionState();
  protected readonly renewState = new ActionState();
  protected readonly thresholdState = new ActionState();
  protected readonly shortlistState = new ActionState();
  protected readonly poolState = new ActionState();

  protected candidateSource: CandidateSource = 'ai-matches';
  protected thresholdPercent: number | null = null;
  protected shortlistSize: number | null = 10;
  protected shortlistLookup = '';
  protected renewDeadline = '';
  private etag: string | null = null;

  protected form = {
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
    salaryCurrency: '',
    minExperienceYears: null as number | null,
    maxExperienceYears: null as number | null,
    languages: '',
    deadline: '',
    autoClose: true,
    jobLink: '',
    visibilityScope: 'Public' as 'Public' | 'Private' | 'Targeted',
    targetJobSeekerIds: '',
  };

  constructor() {
    effect(() => this.load(this.id()));
  }

  protected select(tab: Tab): void {
    this.tab.set(tab);
    if (tab === 'history' && !this.history.value()) {
      this.history.load(this.employer.statusHistory(this.id()));
    }
    if (tab === 'candidates' && !this.candidates.value()) {
      this.loadCandidates();
      this.sourcing.threshold(this.id()).subscribe({
        next: t => {
          this.threshold.set(t);
          this.thresholdPercent = t.percent;
        },
        error: () => undefined,
      });
    }
  }

  protected save(): void {
    const f = this.form;
    const request = this.jobs.update(
      this.id(),
      {
        titleEn: f.titleEn,
        titleAr: f.titleAr || f.titleEn,
        summaryEn: f.summaryEn,
        summaryAr: f.summaryAr || f.summaryEn,
        skills: lines(f.skills),
        categoryCode: f.categoryCode,
        contractType: f.contractType,
        educationLevel: f.educationLevel || null,
        requiredTraining: this.job.value()?.requiredTraining ?? null,
        workFormat: f.workFormat,
        governorate: f.governorate || null,
        city: f.city || null,
        salaryMin: f.salaryMin,
        salaryMax: f.salaryMax,
        salaryCurrency: f.salaryCurrency || null,
        minExperienceYears: f.minExperienceYears,
        maxExperienceYears: f.maxExperienceYears,
        requiredLanguages: lines(f.languages),
        deadlineUtc: new Date(`${f.deadline}T23:59:59`).toISOString(),
        autoClose: f.autoClose,
        jobLink: f.jobLink || null,
        otherFields: this.job.value()?.otherFields ?? null,
        visibilityScope: f.visibilityScope,
        targetJobSeekerIds: f.visibilityScope === 'Targeted' ? lines(f.targetJobSeekerIds) : null,
      },
      this.etag,
    );
    this.saveState.run(request, r => (r.overwritten ? 'Saved (someone else had edited it; your version replaced theirs).' : 'Saved.'), () => this.load(this.id()));
  }

  protected renew(): void {
    if (this.renewDeadline) {
      this.renewState.run(this.jobs.renew(this.id(), new Date(`${this.renewDeadline}T23:59:59`).toISOString()), 'Posting renewed.', () => this.load(this.id()));
    }
  }

  protected loadCandidates(): void {
    const id = this.id();
    const rows = <T>(o: Observable<PagedResult<T>>) => o as unknown as Observable<PagedResult<Record<string, unknown>>>;
    const requests: Record<CandidateSource, () => Observable<PagedResult<Record<string, unknown>>>> = {
      'ai-matches': () => rows(this.matching.candidates(id)),
      'ai-recommendations': () => rows(this.matching.candidateRecommendations(id)),
      'sourcing-recommendations': () => rows(this.sourcing.recommendations(id)),
      'sourcing-ranking': () => rows(this.sourcing.ranking(id)),
    };
    this.candidates.load(requests[this.candidateSource]());
  }

  protected candidateId(row: Record<string, unknown>): string {
    return String(row['profileId'] ?? row['candidateProfileId'] ?? '');
  }

  protected addToPool(row: Record<string, unknown>): void {
    this.poolState.run(this.sourcing.addToTalentPool(this.candidateId(row), this.id(), null), 'Added to your talent pool.');
  }

  protected saveThreshold(): void {
    if (this.thresholdPercent != null) {
      this.thresholdState.run(this.sourcing.setThreshold(this.id(), this.thresholdPercent), 'Threshold saved.', t => this.threshold.set(t));
    }
  }

  protected requestShortlist(): void {
    this.shortlistState.run(this.matching.requestShortlist(this.id(), this.shortlistSize), s => `Shortlist ${s.status}.`, s => this.shortlist.set(s));
  }

  protected fetchShortlist(id: string): void {
    if (id) {
      this.shortlistState.run(this.matching.shortlist(this.id(), id), s => `Shortlist ${s.status}.`, s => this.shortlist.set(s));
    }
  }

  private load(id: string): void {
    this.job.load(this.jobs.get(id).pipe(tap(j => this.fill(j))));
  }

  private fill(j: JobPostingView): void {
    this.etag = j.rowVersion ? `"${j.rowVersion}"` : null;
    this.form = {
      titleEn: j.title.en,
      titleAr: j.title.ar,
      summaryEn: j.summary.en,
      summaryAr: j.summary.ar,
      skills: j.skills.join(', '),
      categoryCode: j.categoryCode,
      contractType: j.contractType,
      workFormat: j.workFormat,
      educationLevel: j.educationLevel ?? '',
      governorate: j.location?.governorate ?? '',
      city: j.location?.city ?? '',
      salaryMin: j.salary?.min ?? null,
      salaryMax: j.salary?.max ?? null,
      salaryCurrency: j.salary?.currency ?? '',
      minExperienceYears: j.minExperienceYears,
      maxExperienceYears: j.maxExperienceYears,
      languages: j.requiredLanguages.join(', '),
      deadline: j.deadlineUtc.slice(0, 10),
      autoClose: j.autoClose,
      jobLink: j.jobLink ?? '',
      visibilityScope: j.visibility?.scope ?? 'Public',
      targetJobSeekerIds: (j.visibility?.targetJobSeekerIds ?? []).join(', '),
    };
  }
}
