import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';

const seeker = { actorType: 'JobSeeker' };
const employer = { actorType: 'Employer' };

export const routes: Routes = [
  // Template pages
  { path: '', title: 'JobEntry - Home', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'about', title: 'JobEntry - About', loadComponent: () => import('./pages/simple-pages').then(m => m.About) },
  { path: 'category', title: 'JobEntry - Category', loadComponent: () => import('./pages/simple-pages').then(m => m.Category) },
  { path: 'testimonial', title: 'JobEntry - Testimonial', loadComponent: () => import('./pages/simple-pages').then(m => m.Testimonial) },
  { path: 'contact', title: 'JobEntry - Contact', loadComponent: () => import('./pages/contact/contact').then(m => m.Contact) },
  { path: 'jobs', title: 'JobEntry - Job List', loadComponent: () => import('./pages/job-list/job-list').then(m => m.JobList) },
  { path: 'jobs/:id', title: 'JobEntry - Job Detail', loadComponent: () => import('./pages/job-detail/job-detail').then(m => m.JobDetail) },

  // Public content (HelpContent, JobSeekerProfile, Notification, ExternalIntegration)
  { path: 'news', title: 'JobEntry - News', loadComponent: () => import('./pages/public/news').then(m => m.NewsList) },
  { path: 'news/:id', title: 'JobEntry - News', loadComponent: () => import('./pages/public/news').then(m => m.NewsArticle) },
  { path: 'help', title: 'JobEntry - Help Center', loadComponent: () => import('./pages/public/help').then(m => m.HelpCenter) },
  { path: 'help/:id', title: 'JobEntry - Help', loadComponent: () => import('./pages/public/help').then(m => m.HelpArticle) },
  {
    path: 'tutorials/:id',
    title: 'JobEntry - Tutorial',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/public/help').then(m => m.Tutorial),
  },
  { path: 'companies/:id', title: 'JobEntry - Company', loadComponent: () => import('./pages/public/misc-pages').then(m => m.CompanyPage) },
  { path: 'shared/:token', title: 'JobEntry - Candidate Profile', loadComponent: () => import('./pages/public/misc-pages').then(m => m.SharedProfile) },
  { path: 'unsubscribe/:token', title: 'JobEntry - Unsubscribe', loadComponent: () => import('./pages/public/misc-pages').then(m => m.Unsubscribe) },
  { path: 'verify-email', title: 'JobEntry - Verify Email', loadComponent: () => import('./pages/public/misc-pages').then(m => m.VerifyEmail) },
  { path: 'api-docs', title: 'JobEntry - API Documentation', loadComponent: () => import('./pages/public/misc-pages').then(m => m.ApiDocs) },

  // Authentication
  { path: 'login', title: 'JobEntry - Login', loadComponent: () => import('./pages/auth/login').then(m => m.Login) },
  { path: 'register', title: 'JobEntry - Register', loadComponent: () => import('./pages/auth/register').then(m => m.Register) },

  // Job seeker & employer pages outside the dashboard
  {
    path: 'favorites',
    title: 'JobEntry - Favorite Jobs',
    canActivate: [authGuard],
    data: seeker,
    loadComponent: () => import('./pages/favorites/favorites').then(m => m.Favorites),
  },
  {
    path: 'post-job',
    title: 'JobEntry - Post A Job',
    canActivate: [authGuard],
    data: employer,
    loadComponent: () => import('./pages/employer/post-job').then(m => m.PostJob),
  },
  {
    path: 'my-jobs',
    title: 'JobEntry - My Job Postings',
    canActivate: [authGuard],
    data: employer,
    loadComponent: () => import('./pages/employer/my-jobs').then(m => m.MyJobs),
  },

  // Signed-in dashboard
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/account/account-shell').then(m => m.AccountShell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: () => {
          const auth = inject(AuthService);
          return auth.isEmployer() ? 'overview' : auth.isJobSeeker() ? 'profile' : 'notifications';
        },
      },
      // Job seeker
      { path: 'profile', title: 'JobEntry - My Profile', canActivate: [authGuard], data: seeker, loadComponent: () => import('./pages/account/seeker/seeker-profile').then(m => m.SeekerProfile) },
      { path: 'documents', title: 'JobEntry - Resume & Documents', canActivate: [authGuard], data: seeker, loadComponent: () => import('./pages/account/seeker/seeker-documents').then(m => m.SeekerDocuments) },
      { path: 'preferences', title: 'JobEntry - Job Preferences', canActivate: [authGuard], data: seeker, loadComponent: () => import('./pages/account/seeker/seeker-preferences').then(m => m.SeekerPreferences) },
      { path: 'matches', title: 'JobEntry - AI Job Matches', canActivate: [authGuard], data: seeker, loadComponent: () => import('./pages/account/seeker/seeker-matches').then(m => m.SeekerMatches) },
      { path: 'saved-searches', title: 'JobEntry - Saved Searches', canActivate: [authGuard], data: seeker, loadComponent: () => import('./pages/account/seeker/seeker-lists').then(m => m.SeekerSavedSearches) },
      { path: 'interested', title: 'JobEntry - Interested Jobs', canActivate: [authGuard], data: seeker, loadComponent: () => import('./pages/account/seeker/seeker-lists').then(m => m.SeekerInterested) },
      { path: 'news-feed', title: 'JobEntry - My News Feed', canActivate: [authGuard], data: seeker, loadComponent: () => import('./pages/account/seeker/seeker-lists').then(m => m.SeekerNewsFeed) },
      { path: 'privacy', title: 'JobEntry - Privacy & Sharing', canActivate: [authGuard], data: seeker, loadComponent: () => import('./pages/account/seeker/seeker-privacy').then(m => m.SeekerPrivacy) },
      // Employer
      { path: 'overview', title: 'JobEntry - Employer Dashboard', canActivate: [authGuard], data: employer, loadComponent: () => import('./pages/account/employer/employer-overview').then(m => m.EmployerOverview) },
      { path: 'company', title: 'JobEntry - Company Profile', canActivate: [authGuard], data: employer, loadComponent: () => import('./pages/account/employer/employer-company').then(m => m.EmployerCompany) },
      { path: 'candidates', title: 'JobEntry - Find Candidates', canActivate: [authGuard], data: employer, loadComponent: () => import('./pages/account/employer/employer-candidates').then(m => m.EmployerCandidates) },
      { path: 'talent-pool', title: 'JobEntry - Talent Pool', canActivate: [authGuard], data: employer, loadComponent: () => import('./pages/account/employer/employer-candidates').then(m => m.EmployerTalentPool) },
      { path: 'jobs/:id', title: 'JobEntry - Manage Posting', canActivate: [authGuard], data: employer, loadComponent: () => import('./pages/account/employer/employer-job').then(m => m.EmployerJob) },
      // Everyone
      { path: 'notifications', title: 'JobEntry - Notifications', loadComponent: () => import('./pages/account/common-pages').then(m => m.Notifications) },
      { path: 'notification-settings', title: 'JobEntry - Notification Settings', loadComponent: () => import('./pages/account/common-pages').then(m => m.NotificationSettings) },
      { path: 'security', title: 'JobEntry - Password & Security', loadComponent: () => import('./pages/account/common-pages').then(m => m.Security) },
    ],
  },

  // Consoles
  { path: 'admin', pathMatch: 'full', redirectTo: 'admin/accounts' },
  {
    path: 'admin/:section',
    title: 'JobEntry - Admin Console',
    canActivate: [authGuard],
    data: { actorType: 'Administrator' },
    loadComponent: () => import('./pages/consoles/consoles').then(m => m.AdminConsole),
  },
  { path: 'partner', pathMatch: 'full', redirectTo: 'partner/credentials' },
  {
    path: 'partner/:section',
    title: 'JobEntry - Partner Console',
    canActivate: [authGuard],
    data: { actorType: 'ExternalJobSite' },
    loadComponent: () => import('./pages/consoles/consoles').then(m => m.PartnerConsole),
  },

  { path: '**', title: 'JobEntry - 404', loadComponent: () => import('./pages/simple-pages').then(m => m.NotFound) },
];
