import { Component, inject, input } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { PageHeader } from '../../layout/page-header';
import { ConsoleShell } from '../../shared/console-shell';
import { ADMIN_SECTIONS } from './admin-endpoints';
import { PARTNER_SECTIONS } from './partner-endpoints';

/** /admin/:section - every Administrator endpoint across the 13 services. */
@Component({
  selector: 'app-admin-console',
  imports: [PageHeader, ConsoleShell],
  template: `
    <app-page-header title="Admin Console" section="Admin" sectionLink="/admin" />
    @if (!auth.mfaVerified()) {
        <div class="container"><div class="alert alert-warning">
            Administrator endpoints require a session verified with multi-factor authentication. Sign in again and complete the MFA step if requests are refused.
        </div></div>
    }
    <app-console-shell heading="Administration" base="/admin" [sections]="sections" [section]="section()" />
  `,
})
export class AdminConsole {
  readonly section = input<string>();
  protected readonly auth = inject(AuthService);
  protected readonly sections = ADMIN_SECTIONS;
}

/** /partner/:section - the external job site (partner) integration console. */
@Component({
  selector: 'app-partner-console',
  imports: [PageHeader, ConsoleShell],
  template: `
    <app-page-header title="Partner Console" section="Partner" sectionLink="/partner" />
    <app-console-shell heading="Integration" base="/partner" [sections]="sections" [section]="section()" />
  `,
})
export class PartnerConsole {
  readonly section = input<string>();
  protected readonly sections = PARTNER_SECTIONS;
}
