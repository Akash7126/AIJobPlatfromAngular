/** Request/response shapes of the remaining JobPlatform services (camelCase JSON, enums as strings). */
import { LocalizedView, PagedResult, PostingRequest, ProfileView, SalaryRangeView } from './api.models';

/* ---------- AccountIdentity ---------- */

export interface MfaEnrollmentDto {
  secret: string;
  provisioningUri: string;
}

export interface RegisterPartnerRequest {
  organisationName: string;
  contactEmail: string;
  mobile: string;
  identity: string;
  password: string;
}

export interface ConsentRequest {
  guestId: string | null;
  policyVersion: string;
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
  locale: string | null;
}

export interface ConsentStatusDto {
  guestId: string | null;
  currentPolicyVersion: string;
  privacyPolicyUrl: string;
  bannerText: LocalizedView;
  bannerRequired: boolean;
  allowed: { necessary: boolean; analytics: boolean; preferences: boolean; marketing: boolean };
  decidedAtUtc: string | null;
}

/* ---------- JobPosting ---------- */

export interface SearchCriteriaView {
  keyword: string | null;
  governorate: string | null;
  city: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  contractType: string | null;
  postedAfterUtc: string | null;
  deadlineBeforeUtc: string | null;
  categoryCode: string | null;
}

export interface SavedSearchRequest extends SearchCriteriaView {
  notifyOnMatch: boolean;
}

export interface SavedSearchView {
  savedSearchId: string;
  criteria: SearchCriteriaView;
  notifyOnMatch: boolean;
  createdAtUtc: string;
  lastEvaluatedAtUtc: string | null;
}

export interface InterestedRequest {
  referenceType: 'Posting' | 'Filter';
  postingId: string | null;
  keyword?: string | null;
  governorate?: string | null;
  city?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  contractType?: string | null;
  categoryCode?: string | null;
}

export interface InterestedListItemView {
  interestedListEntryId: string;
  referenceType: 'Posting' | 'Filter';
  postingId: string | null;
  criteria: SearchCriteriaView | null;
  createdAtUtc: string;
}

export interface FavoriteListView {
  favoriteJobListId: string;
  jobPostingIds: string[];
}

export interface UpdatePostingRequest extends PostingRequest {
  visibilityScope: 'Public' | 'Private' | 'Targeted';
  targetJobSeekerIds: string[] | null;
}

export interface PostingSchemaView {
  taxonomyVersion: number;
  fields: { name: string; required: boolean; type: string; allowedValues: string[] | null }[];
  categoryCodes: string[];
  skillCodes: string[];
}

/* ---------- JobSeekerProfile ---------- */

export interface EducationItem {
  id?: string;
  degree: string;
  institution: string;
  from: string | null;
  to: string | null;
  source?: string;
}

export interface ExperienceItem {
  id?: string;
  company: string;
  role: string;
  from: string | null;
  to: string | null;
  source?: string;
}

export interface SkillItem {
  id?: string;
  name: string;
  kind: string;
  class: string;
  source?: string;
}

export interface TrainingItem {
  id?: string;
  name: string;
  provider: string | null;
  completedOn: string | null;
}

export interface CertificateItem {
  id?: string;
  name: string;
  issuer: string | null;
  issuedOn: string | null;
}

export interface SocialLink {
  network: string;
  url: string;
}

export interface FullProfileView extends ProfileView {
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: SkillItem[];
  training: TrainingItem[];
  certificates: CertificateItem[];
  salaryExpectation: SalaryRangeView | null;
  address: { governorate: string | null; city: string | null; street: string | null } | null;
  socialLinks: SocialLink[];
}

export interface CreateProfileRequest {
  fullName: string;
  email: string;
  mobileNumber: string;
  gender: string;
}

export interface ProfileCompletionView {
  percent: number;
  missingSections: string[];
}

export interface JobPreferenceView {
  profileId: string;
  jobTypes: string[];
  industries: string[];
  locations: string[];
  salaryExpectation: SalaryRangeView | null;
  workArrangements: string[];
  updatedAtUtc: string;
}

export interface JobPreferenceRequest {
  jobTypes: string[];
  industries: string[];
  locations: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  workArrangements: string[];
}

export interface PrivacySettingView {
  profileId: string;
  visibility: string;
  publicSharingActive: boolean;
  deletionState: string;
  deactivationRequestedAtUtc: string | null;
}

export interface DocumentView {
  documentId: string;
  ownerType: string;
  ownerId: string;
  fileName: string;
  sizeBytes: number;
  contentType: string;
  documentType: string;
  uploadedAtUtc: string;
}

export interface ResumeView {
  resumeId: string;
  profileId: string;
  fileName: string;
  sizeBytes: number;
  format: string;
  uploadedAtUtc: string;
}

export interface ShareLinkView {
  shareLinkId: string;
  profileId: string;
  token: string;
  url: string;
  isActive: boolean;
  createdAtUtc: string;
}

export interface SharedProfileView {
  fullName: string;
  skills: SkillItem[];
  education: EducationItem[];
  experience: ExperienceItem[];
  statement: string | null;
  bio: string | null;
}

/* ---------- AiMatching ---------- */

export interface MatchedJobDto {
  matchScoreId: string;
  jobPostingId: string;
  title: string;
  score: number;
  computedAtUtc: string;
}

export interface MatchedCandidateDto {
  matchScoreId: string;
  profileId: string;
  score: number;
  computedAtUtc: string;
}

export interface MatchScoreDetailDto {
  matchScoreId: string | null;
  jobPostingId: string;
  title: string | null;
  score: number;
  meetsThreshold: boolean;
  configVersion: number;
  stored: boolean;
  computedAtUtc: string;
  breakdown: Record<string, unknown>[];
}

export interface JobRecommendationDto {
  id: string;
  strategy: string;
  computedAtUtc: string;
  items: { jobPostingId: string; title: string; score: number; reason: string }[];
}

export interface ParsedProfileDataDto {
  parsedProfileDataId: string;
  resumeId: string;
  profileId: string;
  status: string;
  lowConfidenceThresholdPercent: number;
  fields: { name: string; value: string; source: string; confidence: number; needsReview: boolean }[];
}

export interface ShortlistDto {
  id: string;
  jobPostingId: string;
  employerAccountId: string;
  status: string;
  requestedSize: number;
  configVersion: number;
  items: { rank: number; profileId: string; score: number }[];
  failureReason: string | null;
  requestedAtUtc: string;
  computedAtUtc: string | null;
}

/* ---------- CandidateSourcing ---------- */

export interface CandidateSearchRequest {
  skills: string[] | null;
  educationLevel: string | null;
  minExperienceYears: number | null;
  maxExperienceYears: number | null;
  locationCode: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  availability: string | null;
  page: number;
  pageSize: number;
}

export interface CandidateSearchResultItemView {
  candidateProfileId: string;
  skills: string[];
  educationLevel: string | null;
  yearsOfExperience: number | null;
  locationCode: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
}

export interface CandidateInsightView {
  candidateInsightId: string;
  candidateProfileId: string;
  jobPostingId: string;
  availability: string | null;
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  overallScore: number;
  strengths: string[];
  gaps: string[];
  withheldFields: string[];
  computedAtUtc: string;
}

export interface CandidateRankingItemView {
  candidateProfileId: string;
  rank: number;
  score: number;
  strengths: string[];
  gaps: string[];
}

export interface CandidateRecommendationItemView {
  candidateProfileId: string;
  score: number;
}

export interface TalentPoolEntryView {
  talentPoolEntryId: string;
  candidateProfileId: string;
  jobPostingId: string;
  note: string | null;
  addedAtUtc: string;
}

export interface ThresholdView {
  jobPostingId: string;
  percent: number;
  version: number;
}

/* ---------- EmployerOnboarding ---------- */

export type CompanySize = 'Micro' | 'Small' | 'Medium' | 'Large';

export interface Level2Request {
  companyName: string;
  companyId: string;
  registrationNumber: string;
  website: string;
  industry: string;
  size: CompanySize;
  governorate: string;
  city: string;
  street: string | null;
  description: string;
}

export interface EmployerRegistrationView {
  employerRegistrationId: string;
  employerAccountId: string;
  status: string;
  identity: { name: string; companyId: string; registrationNumber: string } | null;
  level2: { website: string; industry: string; size: string; governorate: string; city: string; street: string | null; description: string } | null;
  openedAtUtc: string;
  approvedBy: string | null;
  approvedAtUtc: string | null;
}

export interface CompanyMediaView {
  companyMediaId: string;
  kind: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  isPrimaryLogo: boolean;
  uploadedAtUtc: string;
}

/* ---------- GovernmentIntegration ---------- */

export interface EmployerVerificationView {
  employerVerificationId: string;
  employerAccountId: string;
  state: string;
  method: string;
  attemptCount: number;
  decidedBy: string | null;
  decidedAtUtc: string | null;
  failureReason: string | null;
  attempts: unknown[];
}

/* ---------- AuditLogging ---------- */

export interface EmployerDashboardDto {
  registrationApproved: boolean;
  postings: number;
  activePostings: number;
  shortlists: number;
  items: { jobPostingId: string; title: string; status: string; updatedAtUtc: string }[];
  updatedAtUtc: string | null;
}

export interface JobStatusHistoryDto {
  jobPostingId: string;
  employerId: string;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  changedAtUtc: string;
}

/* ---------- HelpContent ---------- */

export type HelpRole = 'JobSeeker' | 'Employer' | 'ExternalJobSite' | 'Guest' | 'Administrator';

export interface HelpSearchResultView {
  helpContentId: string;
  kind: string;
  title: LocalizedView;
  topicName: string | null;
}

export interface HelpCenterTopicView {
  topicId: string | null;
  topicName: string | null;
  items: HelpSearchResultView[];
}

export interface HelpContentView {
  helpContentId: string;
  kind: string;
  title: LocalizedView;
  body: LocalizedView;
  currentVersion: number;
  topicId: string | null;
  roles: string[];
  media: { mediaId: string; type: string; url: string; captionsRef: string | null; textAlternative: string | null }[];
}

export interface NewsArticleView {
  newsArticleId: string;
  kind: string;
  title: LocalizedView;
  body: LocalizedView;
  status: string;
  media: { mediaId: string; type: string; url: string; altText: string | null }[];
  categoryIds: string[];
  tags: string[];
  createdAtUtc: string;
  publishedAtUtc: string | null;
}

export interface TutorialView {
  tutorialId: string;
  title: LocalizedView;
  body: LocalizedView;
  completed: boolean;
  completedAtUtc: string | null;
}

export interface CompanyPageEditRequest {
  backgroundAr: string | null;
  backgroundEn: string | null;
  highlights: string[];
}

/* ---------- Notification ---------- */

export interface InAppNotificationDto {
  id: string;
  typeCode: string;
  title: string;
  body: string;
  actionUrl: string | null;
  status: string;
  createdAtUtc: string;
  readAtUtc: string | null;
  icon: string;
  colour: string;
  iconTextAlternative: string;
}

export interface InAppPage {
  items: PagedResult<InAppNotificationDto>;
  unread: number;
}

export interface NotificationPreferencesDto {
  categories: Record<string, boolean>;
  mandatory: string[];
  mode: string | null;
  smsOptedIn: boolean | null;
  mobileMasked: string | null;
  unsubscribed: string[];
}
