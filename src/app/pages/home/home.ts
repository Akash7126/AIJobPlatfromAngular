import { AfterViewInit, Component, ElementRef, OnDestroy, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HEADER_CAROUSEL_OPTIONS, TemplateEffects } from '../../core/services/template-effects';
import { AboutSection } from '../../shared/about-section';
import { CategoryGrid } from '../../shared/category-grid';
import { JobListing } from '../../shared/job-listing';
import { SearchBar } from '../../shared/search-bar';
import { Testimonials } from '../../shared/testimonials';

@Component({
  selector: 'app-home',
  imports: [RouterLink, SearchBar, CategoryGrid, AboutSection, JobListing, Testimonials],
  templateUrl: './home.html',
})
export class Home implements AfterViewInit, OnDestroy {
  private readonly effects = inject(TemplateEffects);
  private readonly carousel = viewChild.required<ElementRef<HTMLElement>>('carousel');

  protected readonly slides = [
    { image: 'img/carousel-1.jpg', title: 'Find The Perfect Job That You Deserved' },
    { image: 'img/carousel-2.jpg', title: 'Find The Best Startup Job That Fit You' },
  ];

  ngAfterViewInit(): void {
    this.effects.initCarousel(this.carousel().nativeElement, HEADER_CAROUSEL_OPTIONS);
  }

  ngOnDestroy(): void {
    this.effects.destroyCarousel(this.carousel().nativeElement);
  }
}
