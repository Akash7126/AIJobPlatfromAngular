import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../layout/page-header';
import { AboutSection } from '../shared/about-section';
import { CategoryGrid } from '../shared/category-grid';
import { Testimonials } from '../shared/testimonials';

/* Template pages that are pure composition of shared sections. */

@Component({
  selector: 'app-about',
  imports: [PageHeader, AboutSection],
  template: `
    <app-page-header title="About Us" crumb="About" />
    <app-about-section [showButton]="false" />
  `,
})
export class About {}

@Component({
  selector: 'app-category',
  imports: [PageHeader, CategoryGrid],
  template: `
    <app-page-header title="Category" />
    <app-category-grid />
  `,
})
export class Category {}

@Component({
  selector: 'app-testimonial',
  imports: [PageHeader, Testimonials],
  template: `
    <app-page-header title="Testimonial" />
    <app-testimonials />
  `,
})
export class Testimonial {}

@Component({
  selector: 'app-not-found',
  imports: [PageHeader, RouterLink],
  template: `
    <app-page-header title="404 Error" />

    <!-- 404 Start -->
    <div class="container-xxl py-5 wow fadeInUp" data-wow-delay="0.1s">
        <div class="container text-center">
            <div class="row justify-content-center">
                <div class="col-lg-6">
                    <i class="bi bi-exclamation-triangle display-1 text-primary"></i>
                    <h1 class="display-1">404</h1>
                    <h1 class="mb-4">Page Not Found</h1>
                    <p class="mb-4">We’re sorry, the page you have looked for does not exist in our website! Maybe go to our home page or try to use a search?</p>
                    <a class="btn btn-primary py-3 px-5" routerLink="/">Go Back To Home</a>
                </div>
            </div>
        </div>
    </div>
    <!-- 404 End -->
  `,
})
export class NotFound {}
