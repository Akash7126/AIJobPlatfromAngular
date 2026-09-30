import { AfterViewInit, Component, ElementRef, OnDestroy, inject, viewChild } from '@angular/core';
import { TESTIMONIAL_CAROUSEL_OPTIONS, TemplateEffects } from '../core/services/template-effects';

interface Testimonial {
  quote: string;
  name: string;
  profession: string;
  image: string;
}

/** "Our Clients Say!!!" owl carousel. */
@Component({
  selector: 'app-testimonials',
  template: `
    <!-- Testimonial Start -->
    <div class="container-xxl py-5 wow fadeInUp" data-wow-delay="0.1s">
        <div class="container">
            <h1 class="text-center mb-5">Our Clients Say!!!</h1>
            <div #carousel class="owl-carousel testimonial-carousel">
                @for (t of testimonials; track t.image) {
                    <div class="testimonial-item bg-light rounded p-4">
                        <i class="fa fa-quote-left fa-2x text-primary mb-3"></i>
                        <p>{{ t.quote }}</p>
                        <div class="d-flex align-items-center">
                            <img class="img-fluid flex-shrink-0 rounded" [src]="t.image" alt="" style="width: 50px; height: 50px;">
                            <div class="ps-3">
                                <h5 class="mb-1">{{ t.name }}</h5>
                                <small>{{ t.profession }}</small>
                            </div>
                        </div>
                    </div>
                }
            </div>
        </div>
    </div>
    <!-- Testimonial End -->
  `,
})
export class Testimonials implements AfterViewInit, OnDestroy {
  private readonly effects = inject(TemplateEffects);
  private readonly carousel = viewChild.required<ElementRef<HTMLElement>>('carousel');

  protected readonly testimonials: Testimonial[] = [
    { quote: 'The AI matching found me a role that fit my skills in under two weeks. The whole process was simple.', name: 'Sarah Ahmed', profession: 'Software Engineer', image: 'img/testimonial-1.jpg' },
    { quote: 'We filled three positions with strong candidates from the talent pool. Posting a job takes minutes.', name: 'Omar Khalid', profession: 'HR Manager', image: 'img/testimonial-2.jpg' },
    { quote: 'Saved searches and alerts meant I never missed a relevant opening. Highly recommended.', name: 'Lina Hassan', profession: 'Marketing Specialist', image: 'img/testimonial-3.jpg' },
    { quote: 'A clean, fast portal. Our company page brought in far more applicants than before.', name: 'Yousef Nasser', profession: 'Startup Founder', image: 'img/testimonial-4.jpg' },
  ];

  ngAfterViewInit(): void {
    this.effects.initCarousel(this.carousel().nativeElement, TESTIMONIAL_CAROUSEL_OPTIONS);
  }

  ngOnDestroy(): void {
    this.effects.destroyCarousel(this.carousel().nativeElement);
  }
}
