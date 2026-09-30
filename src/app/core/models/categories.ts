/**
 * The eight "Explore By Category" tiles of the JobEntry template, mapped to JobPosting category codes.
 * The codes come from the platform taxonomy (GET /taxonomy/posting-schema) - adjust them to match your taxonomy.
 */
export interface JobCategory {
  code: string;
  name: string;
  icon: string;
}

export const JOB_CATEGORIES: JobCategory[] = [
  { code: 'marketing', name: 'Marketing', icon: 'fa-mail-bulk' },
  { code: 'customer-service', name: 'Customer Service', icon: 'fa-headset' },
  { code: 'human-resource', name: 'Human Resource', icon: 'fa-user-tie' },
  { code: 'project-management', name: 'Project Management', icon: 'fa-tasks' },
  { code: 'business-development', name: 'Business Development', icon: 'fa-chart-line' },
  { code: 'sales-communication', name: 'Sales & Communication', icon: 'fa-hands-helping' },
  { code: 'teaching-education', name: 'Teaching & Education', icon: 'fa-book-reader' },
  { code: 'design-creative', name: 'Design & Creative', icon: 'fa-drafting-compass' },
];

export const CONTRACT_TYPES: { value: string; label: string }[] = [
  { value: 'FullTime', label: 'Full Time' },
  { value: 'PartTime', label: 'Part Time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Internship', label: 'Internship' },
  { value: 'Temporary', label: 'Temporary' },
];

export function categoryName(code: string): string {
  return JOB_CATEGORIES.find(c => c.code.toLowerCase() === code?.toLowerCase())?.name ?? code;
}

export function contractTypeLabel(value: string): string {
  return CONTRACT_TYPES.find(c => c.value === value)?.label ?? value;
}
