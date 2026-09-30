import { Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { PageHeader } from '../../layout/page-header';

@Component({
  selector: 'app-contact',
  imports: [PageHeader, FormsModule],
  templateUrl: './contact.html',
})
export class Contact {
  protected readonly sent = signal(false);
  protected readonly model = { name: '', email: '', subject: '', message: '' };

  // The platform API has no contact-message endpoint, so the form opens the visitor's mail client.
  protected send(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    const body = `${this.model.message}\n\n${this.model.name} <${this.model.email}>`;
    window.location.href = `mailto:info@example.com?subject=${encodeURIComponent(this.model.subject)}&body=${encodeURIComponent(body)}`;
    this.sent.set(true);
    form.resetForm();
  }
}
