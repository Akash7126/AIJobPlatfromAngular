import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** The dark "page-header" banner with breadcrumb used at the top of every inner page of the template. */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  template: `
    <!-- Header Start -->
    <div class="container-xxl py-5 bg-dark page-header mb-5">
        <div class="container my-5 pt-5 pb-4">
            <h1 class="display-3 text-white mb-3 animated slideInDown">{{ title() }}</h1>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb text-uppercase">
                    <li class="breadcrumb-item"><a routerLink="/">Home</a></li>
                    <li class="breadcrumb-item"><a [routerLink]="sectionLink()">{{ section() }}</a></li>
                    <li class="breadcrumb-item text-white active" aria-current="page">{{ crumb() ?? title() }}</li>
                </ol>
            </nav>
        </div>
    </div>
    <!-- Header End -->
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly crumb = input<string>();
  readonly section = input('Pages');
  readonly sectionLink = input('/');
}
