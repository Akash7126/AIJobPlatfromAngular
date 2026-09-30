import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Observable, tap } from 'rxjs';
import { ProfileApi } from '../../../core/api/profile.api';
import { FullProfileView, ProfileCompletionView } from '../../../core/models/platform.models';
import { ActionState, Loader } from '../../../shared/action-state';
import { EditableList, ListColumn } from '../../../shared/editable-list';

const GENDERS = ['Male', 'Female', 'Other', 'PreferNotToSay'];

/**
 * JobSeekerProfile: POST /profiles (first time), GET /profiles/me + /completion, and the PUT per section
 * (level1, education, experience, skills, training, certificates, level3).
 */
@Component({
  selector: 'app-seeker-profile',
  imports: [FormsModule, EditableList],
  templateUrl: './seeker-profile.html',
})
export class SeekerProfile implements OnInit {
  private readonly api = inject(ProfileApi);

  protected readonly genders = GENDERS;
  protected readonly profile = new Loader<FullProfileView>();
  protected readonly completion = signal<ProfileCompletionView | null>(null);

  protected readonly basic = { fullName: '', email: '', mobileNumber: '', gender: 'Male' };
  protected readonly about = { statement: '', bio: '' };
  protected yearsOfExperience: number | null = null;

  // One ActionState per independently-saved section.
  protected readonly basicState = new ActionState();
  protected readonly aboutState = new ActionState();
  protected readonly sectionState: Record<string, ActionState> = {
    education: new ActionState(),
    experience: new ActionState(),
    skills: new ActionState(),
    training: new ActionState(),
    certificates: new ActionState(),
    links: new ActionState(),
  };

  protected readonly educationCols: ListColumn[] = [
    { key: 'degree', label: 'Degree' },
    { key: 'institution', label: 'Institution' },
    { key: 'from', label: 'From', type: 'date' },
    { key: 'to', label: 'To', type: 'date' },
  ];
  protected readonly experienceCols: ListColumn[] = [
    { key: 'company', label: 'Company' },
    { key: 'role', label: 'Role' },
    { key: 'from', label: 'From', type: 'date' },
    { key: 'to', label: 'To', type: 'date' },
  ];
  protected readonly skillCols: ListColumn[] = [
    { key: 'name', label: 'Skill' },
    { key: 'kind', label: 'Kind', type: 'select', options: ['Primary', 'Secondary'] },
    { key: 'class', label: 'Class', type: 'select', options: ['Hard', 'Soft'] },
  ];
  protected readonly trainingCols: ListColumn[] = [
    { key: 'name', label: 'Training' },
    { key: 'provider', label: 'Provider' },
    { key: 'completedOn', label: 'Completed', type: 'date' },
  ];
  protected readonly certificateCols: ListColumn[] = [
    { key: 'name', label: 'Certificate' },
    { key: 'issuer', label: 'Issuer' },
    { key: 'issuedOn', label: 'Issued', type: 'date' },
  ];
  protected readonly linkCols: ListColumn[] = [
    { key: 'network', label: 'Network', type: 'select', options: ['LinkedIn', 'GitHub', 'Twitter', 'Facebook', 'Website', 'Other'] },
    { key: 'url', label: 'URL' },
  ];

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    this.profile.load(
      this.api.mine().pipe(
        tap(p => {
          Object.assign(this.basic, { fullName: p.fullName, email: p.email, mobileNumber: p.mobileNumber, gender: p.gender || 'Male' });
          Object.assign(this.about, { statement: p.statement ?? '', bio: p.bio ?? '' });
          this.yearsOfExperience = p.yearsOfExperience;
        }),
      ),
    );
    this.api.completion().subscribe({ next: c => this.completion.set(c), error: () => this.completion.set(null) });
  }

  protected createProfile(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.basicState.run(this.api.create({ ...this.basic }), 'Your profile has been created.', () => this.reload());
  }

  protected saveBasic(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.basicState.run(this.api.updateLevel1({ ...this.basic }), 'Basic information saved.', () => this.refreshCompletion());
  }

  protected saveAbout(): void {
    const links = (this.profile.value()?.socialLinks ?? []).map(({ network, url }) => ({ network, url }));
    this.aboutState.run(this.api.updateLevel3(links, this.about.statement || null, this.about.bio || null), 'Saved.', () => this.refreshCompletion());
  }

  protected saveSection(section: string, rows: Record<string, string | null>[]): void {
    const state = this.sectionState[section];
    let request: Observable<unknown>;
    switch (section) {
      case 'education':
        request = this.api.updateEducation(rows.map(r => ({ degree: r['degree'] ?? '', institution: r['institution'] ?? '', from: r['from'], to: r['to'] })));
        break;
      case 'experience':
        request = this.api.updateExperience(
          rows.map(r => ({ company: r['company'] ?? '', role: r['role'] ?? '', from: r['from'], to: r['to'] })),
          this.yearsOfExperience,
        );
        break;
      case 'skills':
        request = this.api.updateSkills(rows.map(r => ({ name: r['name'] ?? '', kind: r['kind'] ?? 'Primary', class: r['class'] ?? 'Hard' })));
        break;
      case 'training':
        request = this.api.updateTraining(rows.map(r => ({ name: r['name'] ?? '', provider: r['provider'], completedOn: r['completedOn'] })));
        break;
      case 'certificates':
        request = this.api.updateCertificates(rows.map(r => ({ name: r['name'] ?? '', issuer: r['issuer'], issuedOn: r['issuedOn'] })));
        break;
      default:
        request = this.api.updateLevel3(
          rows.map(r => ({ network: r['network'] ?? 'Other', url: r['url'] ?? '' })),
          this.about.statement || null,
          this.about.bio || null,
        );
    }
    state.run(request, 'Saved.', () => this.refreshCompletion());
  }

  private refreshCompletion(): void {
    this.api.completion().subscribe({ next: c => this.completion.set(c), error: () => undefined });
  }
}
