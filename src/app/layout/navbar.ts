import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { NotificationCenter } from '../core/services/notification-center';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  protected readonly notifications = inject(NotificationCenter);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  private readonly startsWith = (...prefixes: string[]) => computed(() => prefixes.some(p => this.url().startsWith(p)));

  protected readonly isJobsActive = this.startsWith('/jobs', '/category', '/favorites', '/my-jobs', '/post-job', '/companies');
  protected readonly isPagesActive = this.startsWith('/news', '/help', '/api-docs', '/testimonial', '/tutorials', '/404');
  protected readonly isAccountActive = this.startsWith('/account', '/login', '/register', '/admin', '/partner');
}
