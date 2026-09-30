import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchingApi } from '../../../core/api/matching.api';
import { ProfileApi } from '../../../core/api/profile.api';
import { DocumentView, ParsedProfileDataDto, ResumeView } from '../../../core/models/platform.models';
import { ActionState, Loader } from '../../../shared/action-state';

/** Resume upload (JobSeekerProfile), AI-parsed resume fields with corrections (AiMatching), and other documents. */
@Component({
  selector: 'app-seeker-documents',
  imports: [DatePipe, DecimalPipe, FormsModule],
  template: `
    <div class="bg-light rounded p-4 mb-4">
        <h5 class="mb-3">Resume</h5>
        @if (resume.value(); as r) {
            <p class="mb-2"><i class="fa fa-file-pdf text-primary me-2"></i><strong>{{ r.fileName }}</strong>
               <small class="text-muted ms-2">{{ r.format }} &middot; {{ r.sizeBytes / 1024 | number: '1.0-0' }} KB &middot; {{ r.uploadedAtUtc | date: 'dd MMM, yyyy' }}</small></p>
        } @else if (!resume.loading()) {
            <p class="text-muted">No resume uploaded yet.</p>
        }
        <div class="d-flex flex-wrap gap-2 align-items-center">
            <input type="file" class="form-control bg-white w-auto" accept=".pdf,.doc,.docx" (change)="resumeFile = $any($event.target).files?.[0] ?? null">
            <button class="btn btn-primary" [disabled]="!resumeFile || resumeState.busy()" (click)="uploadResume()">Upload Resume</button>
            @if (resumeState.message()) { <small [class.text-danger]="!resumeState.ok()" [class.text-success]="resumeState.ok()">{{ resumeState.message() }}</small> }
        </div>
    </div>

    <div class="bg-light rounded p-4 mb-4">
        <h5 class="mb-3">Data Extracted From Your Resume (AI)</h5>
        @if (parsed.value(); as pd) {
            <p class="small text-muted">Status: {{ pd.status }}. Fields below {{ pd.lowConfidenceThresholdPercent }}% confidence need your review.</p>
            <div class="table-responsive">
                <table class="table table-sm align-middle">
                    <thead><tr><th>Field</th><th>Value</th><th>Confidence</th><th></th></tr></thead>
                    <tbody>
                        @for (f of pd.fields; track f.name) {
                            <tr [class.table-warning]="f.needsReview">
                                <td class="small">{{ f.name }}</td>
                                <td><input class="form-control form-control-sm" [(ngModel)]="corrections[f.name]"></td>
                                <td class="small">{{ f.confidence | number: '1.0-0' }}%</td>
                                <td><button class="btn btn-sm btn-outline-primary" (click)="correct(f.name)">Correct</button></td>
                            </tr>
                        }
                    </tbody>
                </table>
            </div>
            @if (parsedState.message()) { <small [class.text-danger]="!parsedState.ok()" [class.text-success]="parsedState.ok()">{{ parsedState.message() }}</small> }
        } @else {
            <p class="text-muted mb-0">Upload a resume to see the extracted data.</p>
        }
    </div>

    <div class="bg-light rounded p-4 mb-4">
        <h5 class="mb-3">Other Documents</h5>
        @for (d of documents.value() ?? []; track d.documentId) {
            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                <span><i class="fa fa-file-alt text-primary me-2"></i>{{ d.fileName }} <small class="text-muted">({{ d.documentType }}, {{ d.uploadedAtUtc | date: 'dd MMM, yyyy' }})</small></span>
                <button class="btn btn-sm btn-light text-danger" (click)="removeDocument(d)"><i class="fa fa-trash"></i></button>
            </div>
        } @empty {
            <p class="text-muted">No documents yet.</p>
        }
        <div class="row g-2 mt-2 align-items-center">
            <div class="col-md-5"><input type="file" class="form-control bg-white" (change)="docFile = $any($event.target).files?.[0] ?? null"></div>
            <div class="col-md-4"><input class="form-control" placeholder="Document type (e.g. Certificate)" [(ngModel)]="docType"></div>
            <div class="col-md-3"><button class="btn btn-primary w-100" [disabled]="!docFile || !docType || docState.busy()" (click)="attachDocument()">Attach</button></div>
        </div>
        @if (docState.message()) { <small [class.text-danger]="!docState.ok()" [class.text-success]="docState.ok()">{{ docState.message() }}</small> }
    </div>
  `,
})
export class SeekerDocuments implements OnInit {
  private readonly profiles = inject(ProfileApi);
  private readonly matching = inject(MatchingApi);

  protected readonly resume = new Loader<ResumeView>();
  protected readonly documents = new Loader<DocumentView[]>();
  protected readonly parsed = new Loader<ParsedProfileDataDto>();
  protected readonly resumeState = new ActionState();
  protected readonly docState = new ActionState();
  protected readonly parsedState = new ActionState();

  protected resumeFile: File | null = null;
  protected docFile: File | null = null;
  protected docType = '';
  protected corrections: Record<string, string> = {};

  ngOnInit(): void {
    this.resume.load(this.profiles.resume());
    this.documents.load(this.profiles.documents());
    this.loadParsed();
  }

  protected uploadResume(): void {
    if (this.resumeFile) {
      this.resumeState.run(this.profiles.uploadResume(this.resumeFile), 'Resume uploaded. It will be analysed shortly.', r => {
        this.resume.value.set(r);
        this.loadParsed();
      });
    }
  }

  protected attachDocument(): void {
    if (this.docFile) {
      this.docState.run(this.profiles.attachDocument(this.docFile, this.docType), 'Document attached.', () =>
        this.documents.load(this.profiles.documents()),
      );
    }
  }

  protected removeDocument(d: DocumentView): void {
    if (confirm(`Remove ${d.fileName}?`)) {
      this.docState.run(this.profiles.removeDocument(d.documentId), 'Removed.', () => this.documents.load(this.profiles.documents()));
    }
  }

  protected correct(field: string): void {
    this.parsedState.run(this.matching.correctParsedField(field, this.corrections[field] ?? ''), `${field} corrected.`, () => this.loadParsed());
  }

  private loadParsed(): void {
    this.matching.parsedData().subscribe({
      next: pd => {
        this.corrections = Object.fromEntries(pd.fields.map(f => [f.name, f.value]));
        this.parsed.value.set(pd);
      },
      error: () => this.parsed.value.set(null),
    });
  }
}
