import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobsApi } from '../../../core/api/jobs.api';
import { SourcingApi } from '../../../core/api/matching.api';
import { JobPostingSummaryView, PagedResult } from '../../../core/models/api.models';
import { CandidateInsightView, CandidateSearchResultItemView, TalentPoolEntryView } from '../../../core/models/platform.models';
import { ActionState, Loader } from '../../../shared/action-state';

const splitList = (v: string): string[] =>
  v
    .split(',')
    .map(s => s.trim())
    .filter(s => s);

/** The employer's postings, for "which job is this candidate for?" pickers. */
function loadMyJobs(jobs: JobsApi, target: ReturnType<typeof signal<JobPostingSummaryView[]>>): void {
  jobs.mine(null, 1, 100).subscribe({ next: r => target.set(r.items), error: () => target.set([]) });
}

/** CandidateSourcing: POST /candidates/search, GET /candidates/{id} and /insight, POST /talent-pool. */
@Component({
  selector: 'app-employer-candidates',
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="bg-light rounded p-4 mb-4">
        <h5 class="mb-3">Search Candidates</h5>
        <div class="row g-2">
            <div class="col-md-6"><input class="form-control" placeholder="Skills (comma separated)" [(ngModel)]="criteria.skills"></div>
            <div class="col-md-3">
                <select class="form-select" [(ngModel)]="criteria.educationLevel">
                    <option [ngValue]="null">Any education</option>
                    @for (e of educationLevels; track e) { <option [value]="e">{{ e }}</option> }
                </select>
            </div>
            <div class="col-md-3"><input class="form-control" placeholder="Location code" [(ngModel)]="criteria.locationCode"></div>
            <div class="col-md-3"><input class="form-control" type="number" placeholder="Min experience (yrs)" [(ngModel)]="criteria.minExperienceYears"></div>
            <div class="col-md-3"><input class="form-control" type="number" placeholder="Max experience (yrs)" [(ngModel)]="criteria.maxExperienceYears"></div>
            <div class="col-md-3"><input class="form-control" type="number" placeholder="Salary from" [(ngModel)]="criteria.salaryMin"></div>
            <div class="col-md-3"><input class="form-control" type="number" placeholder="Salary to" [(ngModel)]="criteria.salaryMax"></div>
            <div class="col-md-4"><input class="form-control" placeholder="Availability (e.g. Immediate)" [(ngModel)]="criteria.availability"></div>
            <div class="col-md-2"><button class="btn btn-primary w-100" (click)="search(1)">Search</button></div>
        </div>
    </div>

    @if (results.error()) { <div class="alert alert-danger">{{ results.error() }}</div> }
    @for (c of results.value()?.items ?? []; track c.candidateProfileId) {
        <div class="job-item p-4 mb-3">
            <div class="row g-3 align-items-center">
                <div class="col-md-8 d-flex align-items-center">
                    <div class="flex-shrink-0 border rounded bg-light d-flex align-items-center justify-content-center" style="width: 64px; height: 64px;">
                        <i class="fa fa-user fa-2x text-primary"></i>
                    </div>
                    <div class="text-start ps-4">
                        <h6 class="mb-2">Candidate {{ c.candidateProfileId.slice(0, 8) }}</h6>
                        <span class="text-truncate me-3"><i class="fa fa-graduation-cap text-primary me-2"></i>{{ c.educationLevel || '—' }}</span>
                        <span class="text-truncate me-3"><i class="fa fa-briefcase text-primary me-2"></i>{{ c.yearsOfExperience ?? 0 }} yrs</span>
                        <span class="text-truncate me-3"><i class="fa fa-map-marker-alt text-primary me-2"></i>{{ c.locationCode || '—' }}</span>
                        <div class="small mt-2">{{ c.skills.join(', ') }}</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <select class="form-select form-select-sm mb-2" [(ngModel)]="jobFor[c.candidateProfileId]">
                        <option [ngValue]="undefined">Select a job...</option>
                        @for (j of myJobs(); track j.jobPostingId) { <option [value]="j.jobPostingId">{{ j.title.en || j.title.ar }}</option> }
                    </select>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary flex-fill" [disabled]="!jobFor[c.candidateProfileId]" (click)="loadInsight(c)">Insight</button>
                        <button class="btn btn-sm btn-primary flex-fill" [disabled]="!jobFor[c.candidateProfileId]" (click)="addToPool(c)">Add to pool</button>
                    </div>
                </div>
            </div>
            @if (insight()?.candidateProfileId === c.candidateProfileId) {
                <div class="bg-light rounded p-3 mt-3">
                    <p class="mb-1"><strong>Overall score:</strong> {{ insight()!.overallScore | number: '1.0-0' }}%</p>
                    @if (insight()!.strengths.length) { <p class="mb-1"><strong>Strengths:</strong> {{ insight()!.strengths.join(', ') }}</p> }
                    @if (insight()!.gaps.length) { <p class="mb-1"><strong>Gaps:</strong> {{ insight()!.gaps.join(', ') }}</p> }
                    <p class="mb-1"><strong>Availability:</strong> {{ insight()!.availability || '—' }} &middot;
                       <strong>Expected salary:</strong> {{ insight()!.expectedSalaryMin ?? '—' }} - {{ insight()!.expectedSalaryMax ?? '—' }}</p>
                    @if (insight()!.withheldFields.length) { <small class="text-muted">Hidden by the candidate's privacy settings: {{ insight()!.withheldFields.join(', ') }}</small> }
                </div>
            }
        </div>
    } @empty {
        @if (results.value()) { <p class="text-center text-muted">No candidates match these criteria.</p> }
    }
    @if (state.message()) { <p class="text-center small" [class.text-danger]="!state.ok()" [class.text-success]="state.ok()">{{ state.message() }}</p> }
    @if ((results.value()?.totalPages ?? 0) > 1) {
        <nav class="d-flex justify-content-center">
            <ul class="pagination">
                <li class="page-item" [class.disabled]="page === 1"><a class="page-link" href="#" (click)="$event.preventDefault(); search(page - 1)">&laquo;</a></li>
                <li class="page-item active"><span class="page-link">{{ page }} / {{ results.value()?.totalPages }}</span></li>
                <li class="page-item" [class.disabled]="page === results.value()?.totalPages"><a class="page-link" href="#" (click)="$event.preventDefault(); search(page + 1)">&raquo;</a></li>
            </ul>
        </nav>
    }
  `,
})
export class EmployerCandidates implements OnInit {
  private readonly sourcing = inject(SourcingApi);
  private readonly jobs = inject(JobsApi);

  protected readonly educationLevels = ['None', 'Primary', 'Secondary', 'Diploma', 'Bachelor', 'Master', 'Doctorate'];
  protected readonly results = new Loader<PagedResult<CandidateSearchResultItemView>>();
  protected readonly insight = signal<CandidateInsightView | null>(null);
  protected readonly myJobs = signal<JobPostingSummaryView[]>([]);
  protected readonly state = new ActionState();
  protected jobFor: Record<string, string | undefined> = {};
  protected page = 1;
  protected criteria = {
    skills: '',
    educationLevel: null as string | null,
    minExperienceYears: null as number | null,
    maxExperienceYears: null as number | null,
    locationCode: null as string | null,
    salaryMin: null as number | null,
    salaryMax: null as number | null,
    availability: null as string | null,
  };

  ngOnInit(): void {
    loadMyJobs(this.jobs, this.myJobs);
  }

  protected search(page: number): void {
    this.page = page;
    const skills = splitList(this.criteria.skills);
    this.results.load(this.sourcing.search({ ...this.criteria, skills: skills.length ? skills : null, page, pageSize: 10 }));
  }

  protected loadInsight(c: CandidateSearchResultItemView): void {
    const jobId = this.jobFor[c.candidateProfileId];
    if (jobId) {
      this.state.run(this.sourcing.insight(c.candidateProfileId, jobId), () => null, i => this.insight.set(i));
    }
  }

  protected addToPool(c: CandidateSearchResultItemView): void {
    const jobId = this.jobFor[c.candidateProfileId];
    if (jobId) {
      const note = prompt('Note (optional)') ?? null;
      this.state.run(this.sourcing.addToTalentPool(c.candidateProfileId, jobId, note || null), 'Added to your talent pool.');
    }
  }
}

/** CandidateSourcing GET/DELETE /talent-pool. */
@Component({
  selector: 'app-employer-talent-pool',
  imports: [DatePipe],
  template: `
    <div class="bg-light rounded p-4">
        <h5 class="mb-3">Talent Pool</h5>
        @for (e of pool.value() ?? []; track e.talentPoolEntryId) {
            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                <div>
                    <strong>Candidate {{ e.candidateProfileId.slice(0, 8) }}</strong>
                    <small class="text-muted ms-2">for {{ jobTitle(e.jobPostingId) }}</small>
                    @if (e.note) { <small class="d-block">{{ e.note }}</small> }
                    <small class="d-block text-muted">Added {{ e.addedAtUtc | date: 'dd MMM, yyyy' }}</small>
                </div>
                <button class="btn btn-sm btn-light text-danger" (click)="remove(e)"><i class="fa fa-trash"></i></button>
            </div>
        } @empty {
            <p class="text-muted mb-0">{{ pool.loading() ? 'Loading...' : pool.error() ?? 'Your talent pool is empty. Add candidates from Find Candidates.' }}</p>
        }
    </div>
  `,
})
export class EmployerTalentPool implements OnInit {
  private readonly sourcing = inject(SourcingApi);
  private readonly jobs = inject(JobsApi);

  protected readonly pool = new Loader<TalentPoolEntryView[]>();
  protected readonly myJobs = signal<JobPostingSummaryView[]>([]);

  ngOnInit(): void {
    this.pool.load(this.sourcing.talentPool());
    loadMyJobs(this.jobs, this.myJobs);
  }

  protected jobTitle(id: string): string {
    const job = this.myJobs().find(j => j.jobPostingId === id);
    return job ? job.title.en || job.title.ar : id.slice(0, 8);
  }

  protected remove(e: TalentPoolEntryView): void {
    if (confirm('Remove this candidate from your talent pool?')) {
      this.sourcing.removeFromTalentPool(e.talentPoolEntryId).subscribe(() => this.pool.load(this.sourcing.talentPool()));
    }
  }
}
