/** Shapes returned by the JobPlatform APIs (camelCase JSON, enums serialised as strings). */

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface LocalizedView {
  ar: string;
  en: string;
}

export interface JobLocationView {
  governorate: string | null;
  city: string | null;
}

export interface SalaryRangeView {
  min: number | null;
  max: number | null;
  currency: string | null;
}

export type ContractType = 'FullTime' | 'PartTime' | 'Contract' | 'Internship' | 'Temporary';
export type WorkFormat = 'Physical' | 'Online' | 'Hybrid';

export interface JobPostingSummaryView {
  jobPostingId: string;
  title: LocalizedView;
  categoryCode: string;
  location: JobLocationView | null;
  salary: SalaryRangeView | null;
  deadlineUtc: string;
  status: string;
  contractType: ContractType;
  publishedAtUtc: string | null;
  relevanceScore: number | null;
}

export interface JobPostingView {
  jobPostingId: string;
  employerAccountId: string | null;
  source: string;
  title: LocalizedView;
  summary: LocalizedView;
  skills: string[];
  categoryCode: string;
  contractType: ContractType;
  educationLevel: string | null;
  requiredTraining: string[];
  workFormat: WorkFormat;
  location: JobLocationView | null;
  salary: SalaryRangeView | null;
  minExperienceYears: number | null;
  maxExperienceYears: number | null;
  requiredLanguages: string[];
  deadlineUtc: string;
  autoClose: boolean;
  jobLink: string | null;
  otherFields: Record<string, string>;
  visibility: { scope: 'Public' | 'Private' | 'Targeted'; targetJobSeekerIds: string[] };
  status: string;
  adminSuspended: boolean;
  /** Base64 row version; the API's ETag is this value in quotes. */
  rowVersion: string;
  createdAtUtc: string;
  publishedAtUtc: string | null;
  updatedAtUtc: string;
}

export interface JobSearchCriteria {
  keyword?: string | null;
  governorate?: string | null;
  city?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  contractType?: string | null;
  categoryCode?: string | null;
  sort?: string | null;
  page?: number;
  pageSize?: number;
}

export interface PostingRequest {
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  skills: string[];
  categoryCode: string;
  contractType: ContractType;
  educationLevel: string | null;
  requiredTraining: string[] | null;
  workFormat: WorkFormat;
  governorate: string | null;
  city: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  minExperienceYears: number | null;
  maxExperienceYears: number | null;
  requiredLanguages: string[] | null;
  deadlineUtc: string;
  autoClose: boolean;
  jobLink: string | null;
  otherFields: Record<string, string> | null;
}

export interface PostingMutationResult {
  jobPostingId: string;
  existing: boolean;
  overwritten: boolean;
}

export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  expiresAtUtc: string;
}

export interface AuthenticationResultDto {
  status: string;
  tokens: TokenPairDto | null;
  mfaToken: string | null;
  mfaTokenExpiresAtUtc: string | null;
  mustChangePassword: boolean;
}

export type ActorType = 'JobSeeker' | 'Employer' | 'Administrator' | 'ExternalJobSite' | 'Guest';

export interface RegisterJobSeekerRequest {
  fullName: string;
  mobile: string;
  email: string | null;
  password: string;
  preferredLanguage: string | null;
}

export interface RegisterEmployerRequest {
  companyName: string;
  email: string;
  mobile: string;
  companyId: string;
  registrationNumber: string;
  password: string;
  level: number;
}

export interface RegisteredAccountDto {
  accountId: string;
  actorType: ActorType;
  standing: string;
  nextStep: string;
  activationCodeExpiresAtUtc: string | null;
}

export interface NewsListItemView {
  newsArticleId: string;
  kind: string;
  title: LocalizedView;
  status: string;
  categoryNames: string[];
  publishedAtUtc: string | null;
}

export interface ProfileView {
  profileId: string;
  ownerAccountId: string;
  status: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  gender: string;
  yearsOfExperience: number | null;
  statement: string | null;
  bio: string | null;
  completionPercent: number;
}

export interface CompanyPageView {
  employerAccountId: string;
  name: string;
  logoUrl: string | null;
  industry: string;
  companySize: string;
  website: string;
  verified: boolean;
  badge: string | null;
  background: LocalizedView;
  highlights: string[];
  openPostings: { jobPostingId: string; title: string; governorate: string | null; city: string | null; deadlineUtc: string }[];
  openPostingsDegraded: boolean;
}

/** RFC 7807 body produced by ProblemDetailsMapper (with the platform error code in `code`). */
export interface ProblemDetails {
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
  errors?: Record<string, string[]>;
}
