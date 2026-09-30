import { Injectable } from '@angular/core';

/* The JobEntry template's jQuery plugins, loaded globally from index.html. */
declare const $: any;
declare const WOW: any;

export const HEADER_CAROUSEL_OPTIONS = {
  autoplay: true,
  smartSpeed: 1500,
  items: 1,
  dots: true,
  loop: true,
  nav: true,
  navText: ['<i class="bi bi-chevron-left"></i>', '<i class="bi bi-chevron-right"></i>'],
};

export const TESTIMONIAL_CAROUSEL_OPTIONS = {
  autoplay: true,
  smartSpeed: 1000,
  center: true,
  margin: 24,
  dots: true,
  loop: true,
  nav: false,
  responsive: { 0: { items: 1 }, 768: { items: 2 }, 992: { items: 3 } },
};

/**
 * Angular port of the template's js/main.js: spinner, WOW animations, sticky navbar, back-to-top and the owl carousels.
 * Everything is guarded so the app still works if a CDN script fails to load.
 */
@Injectable({ providedIn: 'root' })
export class TemplateEffects {
  private wowStarted = false;
  private scrollBound = false;

  private get jq(): any {
    return typeof $ === 'function' ? $ : null;
  }

  /** WOW runs in live mode, so .wow elements rendered later by Angular are picked up automatically. */
  startWow(): void {
    if (this.wowStarted || typeof WOW !== 'function') {
      return;
    }
    new WOW({ live: true }).init();
    this.wowStarted = true;
  }

  hideSpinner(): void {
    setTimeout(() => document.getElementById('spinner')?.classList.remove('show'), 1);
  }

  bindScrollEffects(): void {
    const jq = this.jq;
    if (!jq || this.scrollBound) {
      return;
    }
    this.scrollBound = true;
    jq(window).on('scroll', function (this: Window) {
      const scrolled = jq(this).scrollTop() > 300;
      jq('.sticky-top').css('top', scrolled ? '0px' : '-100px');
      if (scrolled) {
        jq('.back-to-top').fadeIn('slow');
      } else {
        jq('.back-to-top').fadeOut('slow');
      }
    });
  }

  scrollToTop(): void {
    const jq = this.jq;
    if (jq?.easing?.easeInOutExpo) {
      jq('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  initCarousel(element: HTMLElement, options: object): void {
    const jq = this.jq;
    if (jq?.fn?.owlCarousel) {
      jq(element).owlCarousel(options);
    }
  }

  destroyCarousel(element: HTMLElement): void {
    const jq = this.jq;
    if (jq?.fn?.owlCarousel) {
      jq(element).trigger('destroy.owl.carousel');
    }
  }

  /** Closes the mobile navbar after a route change. */
  collapseNavbar(): void {
    const jq = this.jq;
    if (jq) {
      jq('#navbarCollapse.show').removeClass('show');
    }
  }
}
