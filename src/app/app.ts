import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { TemplateEffects } from './core/services/template-effects';
import { CookieConsent } from './layout/cookie-consent';
import { Footer } from './layout/footer';
import { Navbar } from './layout/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, CookieConsent],
  templateUrl: './app.html',
})
export class App implements AfterViewInit {
  private readonly effects = inject(TemplateEffects);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.effects.collapseNavbar());
  }

  ngAfterViewInit(): void {
    this.effects.hideSpinner();
    this.effects.startWow();
    this.effects.bindScrollEffects();
  }

  protected scrollToTop(): void {
    this.effects.scrollToTop();
  }
}
