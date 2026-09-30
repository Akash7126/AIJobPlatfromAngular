# AIJobPortalAngular

Angular front end for all 13 JobPlatform microservices (`F:\AIJobPortal`), built on the **JobEntry** template design (`jobentry-1.0.0`). The template's CSS, images and jQuery plugins live in `public/` and load the same way as in the original HTML.

## Run

1. Start the services you need. Their base URLs are in `src/environments/environment.ts`:

   | Service | URL |
   |---|---|
   | AccountIdentity | `http://localhost:5100` (every service validates tokens against its JWKS on this port) |
   | GovernmentIntegration | `:5101` |
   | ExternalIntegration | `:5102` |
   | JobSeekerProfile | `:5104` |
   | EmployerOnboarding | `:5105` |
   | HelpContent | `:5106` |
   | AuditLogging | `:5107` |
   | PlatformAdministration | `:5108` |
   | JobPosting | `:5109` |
   | AiMatching | `:5110` |
   | CandidateSourcing | `:5111` |
   | Reporting | `:5112` |
   | Notification | `:5113` |

2. Run `npm start` and open http://localhost:4200. In Development every service allows this origin through CORS.

## Where each API is used

| Area | Routes | Services |
|---|---|---|
| Template pages | `/`, `/jobs`, `/jobs/:id`, `/category`, `/about`, `/contact`, `/testimonial`, `**` | JobPosting, HelpContent (company on job detail) |
| Public content | `/news`, `/news/:id`, `/help`, `/help/:id`, `/tutorials/:id`, `/companies/:id`, `/shared/:token`, `/unsubscribe/:token`, `/verify-email`, `/api-docs` | HelpContent, JobSeekerProfile, Notification, AccountIdentity, ExternalIntegration |
| Sign-in | `/login` (password, email code, MFA enrol and verify), `/register` (job seeker, employer, partner, activation), cookie banner | AccountIdentity |
| Job seeker | `/account/profile`, `documents`, `preferences`, `matches`, `saved-searches`, `interested`, `news-feed`, `privacy`, `/favorites` | JobSeekerProfile, AiMatching, JobPosting, HelpContent |
| Employer | `/account/overview`, `company`, `candidates`, `talent-pool`, `jobs/:id`, `/post-job`, `/my-jobs` | JobPosting, EmployerOnboarding, GovernmentIntegration, AuditLogging, AiMatching, CandidateSourcing, HelpContent, JobSeekerProfile |
| Everyone signed in | `/account/notifications`, `notification-settings`, `security`, navbar bell | Notification, AccountIdentity |
| Partner console | `/partner/:section` | AccountIdentity (API credentials, OAuth), ExternalIntegration, AuditLogging |
| Admin console | `/admin/:section` | Admin endpoints of all 13 services |

The partner and admin consoles are built from endpoint definitions in `src/app/pages/consoles/*-endpoints.ts`. Each definition becomes a form that sends the request and shows the response as a table. To add an endpoint, add one entry to that list.

Not called from the browser: `internal/v1/*` (service-to-service only, needs an InternalService token) and `api/v1/webhooks/*` (called by the SMS and email providers).

## Notes

- **Category codes:** the 8 home-page category tiles map to codes in `src/app/core/models/categories.ts`. Set these codes to match your taxonomy.
- **Apply Now:** the API has no job-application endpoint, so "Apply Now" adds the job to the interested list. If a job has a `jobLink`, "Apply Now" opens that link instead.
- **Contact form:** the API has no contact endpoint, so the contact form opens the visitor's mail app.
- **Mobile numbers:** they must be Bangladeshi numbers (`+8801XXXXXXXXX`). The register form converts `01XXXXXXXXX` to this format.
- **Admin MFA:** Administrator endpoints require a session signed in with MFA. The login page handles MFA enrolment and verification.
