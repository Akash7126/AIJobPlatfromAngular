import { Component, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfileApi } from '../../../core/api/profile.api';
import { CONTRACT_TYPES } from '../../../core/models/categories';
import { ActionState } from '../../../shared/action-state';
import { splitList } from './criteria';

/** GET/PUT /profiles/me/job-preference. */
@Component({
  selector: 'app-seeker-preferences',
  imports: [FormsModule],
  template: `
    <div class="bg-light rounded p-4">
        <h5 class="mb-3">Job Preferences</h5>
        <p class="small text-muted">Used by the AI matching and to personalise your recommendations.</p>
        <div class="row g-3">
            <div class="col-12">
                <label class="form-label small mb-1">Job types</label>
                <div class="d-flex flex-wrap gap-3">
                    @for (t of contractTypes; track t.value) {
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" [id]="'jt' + t.value" [checked]="jobTypes().includes(t.value)" (change)="toggle(jobTypes, t.value)">
                            <label class="form-check-label" [for]="'jt' + t.value">{{ t.label }}</label>
                        </div>
                    }
                </div>
            </div>
            <div class="col-12">
                <label class="form-label small mb-1">Work arrangements</label>
                <div class="d-flex flex-wrap gap-3">
                    @for (w of arrangements; track w) {
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" [id]="'wa' + w" [checked]="workArrangements().includes(w)" (change)="toggle(workArrangements, w)">
                            <label class="form-check-label" [for]="'wa' + w">{{ w }}</label>
                        </div>
                    }
                </div>
            </div>
            <div class="col-md-6"><div class="form-floating">
                <input class="form-control" id="industries" placeholder="Industries" [(ngModel)]="industries">
                <label for="industries">Industries (comma separated)</label></div></div>
            <div class="col-md-6"><div class="form-floating">
                <input class="form-control" id="locations" placeholder="Locations" [(ngModel)]="locations">
                <label for="locations">Preferred locations (comma separated)</label></div></div>
            <div class="col-md-4"><div class="form-floating">
                <input class="form-control" type="number" id="smin" placeholder="Min" [(ngModel)]="salaryMin">
                <label for="smin">Expected salary from</label></div></div>
            <div class="col-md-4"><div class="form-floating">
                <input class="form-control" type="number" id="smax" placeholder="Max" [(ngModel)]="salaryMax">
                <label for="smax">Expected salary to</label></div></div>
            <div class="col-md-4"><div class="form-floating">
                <input class="form-control" id="cur" placeholder="USD" maxlength="3" [(ngModel)]="currency">
                <label for="cur">Currency</label></div></div>
            <div class="col-12 d-flex align-items-center gap-3">
                <button class="btn btn-primary px-4" [disabled]="state.busy()" (click)="save()">Save Preferences</button>
                @if (state.message()) { <small [class.text-danger]="!state.ok()" [class.text-success]="state.ok()">{{ state.message() }}</small> }
            </div>
        </div>
    </div>
  `,
})
export class SeekerPreferences implements OnInit {
  private readonly profiles = inject(ProfileApi);

  protected readonly contractTypes = CONTRACT_TYPES;
  protected readonly arrangements = ['Physical', 'Online', 'Hybrid'];
  protected readonly state = new ActionState();
  protected readonly jobTypes = signal<string[]>([]);
  protected readonly workArrangements = signal<string[]>([]);
  protected industries = '';
  protected locations = '';
  protected salaryMin: number | null = null;
  protected salaryMax: number | null = null;
  protected currency = 'USD';

  ngOnInit(): void {
    this.profiles.jobPreference().subscribe({
      next: p => {
        this.industries = p.industries.join(', ');
        this.locations = p.locations.join(', ');
        this.salaryMin = p.salaryExpectation?.min ?? null;
        this.salaryMax = p.salaryExpectation?.max ?? null;
        this.currency = p.salaryExpectation?.currency ?? 'USD';
        this.jobTypes.set(p.jobTypes);
        this.workArrangements.set(p.workArrangements);
      },
      error: () => undefined,
    });
  }

  protected toggle(list: WritableSignal<string[]>, value: string): void {
    list.update(items => (items.includes(value) ? items.filter(x => x !== value) : [...items, value]));
  }

  protected save(): void {
    this.state.run(
      this.profiles.setJobPreference({
        jobTypes: this.jobTypes(),
        industries: splitList(this.industries),
        locations: splitList(this.locations),
        salaryMin: this.salaryMin,
        salaryMax: this.salaryMax,
        salaryCurrency: this.salaryMin != null || this.salaryMax != null ? this.currency : null,
        workArrangements: this.workArrangements(),
      }),
      'Preferences saved.',
    );
  }
}
