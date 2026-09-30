import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about-section',
  imports: [RouterLink],
  template: `
    <!-- About Start -->
    <div class="container-xxl py-5">
        <div class="container">
            <div class="row g-5 align-items-center">
                <div class="col-lg-6 wow fadeIn" data-wow-delay="0.1s">
                    <div class="row g-0 about-bg rounded overflow-hidden">
                        <div class="col-6 text-start">
                            <img class="img-fluid w-100" src="img/about-1.jpg" alt="">
                        </div>
                        <div class="col-6 text-start">
                            <img class="img-fluid" src="img/about-2.jpg" alt="" style="width: 85%; margin-top: 15%;">
                        </div>
                        <div class="col-6 text-end">
                            <img class="img-fluid" src="img/about-3.jpg" alt="" style="width: 85%;">
                        </div>
                        <div class="col-6 text-end">
                            <img class="img-fluid w-100" src="img/about-4.jpg" alt="">
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 wow fadeIn" data-wow-delay="0.5s">
                    <h1 class="mb-4">We Help To Get The Best Job And Find A Talent</h1>
                    <p class="mb-4">Our AI-powered job portal connects job seekers with the right employers. Build your profile once, get matched with jobs that fit your skills and let employers find the talent they need.</p>
                    <p><i class="fa fa-check text-primary me-3"></i>AI matching between job seekers and postings</p>
                    <p><i class="fa fa-check text-primary me-3"></i>Verified employers and trusted job postings</p>
                    <p><i class="fa fa-check text-primary me-3"></i>Save searches and favorite jobs in one place</p>
                    @if (showButton()) {
                        <a class="btn btn-primary py-3 px-5 mt-3" routerLink="/about">Read More</a>
                    } @else {
                        <a class="btn btn-primary py-3 px-5 mt-3" routerLink="/register">Join Now</a>
                    }
                </div>
            </div>
        </div>
    </div>
    <!-- About End -->
  `,
})
export class AboutSection {
  /** On the home page the section links to /about ("Read More"); on the about page itself it links to registration. */
  readonly showButton = input(true);
}
