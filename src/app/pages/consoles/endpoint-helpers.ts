import { FieldDef, FieldType } from '../../shared/endpoint-panel';

/* Small builders that keep the endpoint catalogues readable. */

export const path = (name: string, label?: string, options?: string[]): FieldDef => ({
  name,
  in: 'path',
  required: true,
  label,
  type: options ? 'select' : 'text',
  options,
});

export const query = (name: string, type: FieldType = 'text', extra: Partial<FieldDef> = {}): FieldDef => ({ name, in: 'query', type, ...extra });

export const body = (name: string, type: FieldType = 'text', extra: Partial<FieldDef> = {}): FieldDef => ({ name, in: 'body', type, ...extra });

export const form = (name: string, type: FieldType = 'text', extra: Partial<FieldDef> = {}): FieldDef => ({ name, in: 'form', type, ...extra });

export const required = (field: FieldDef): FieldDef => ({ ...field, required: true });

export const paging = (pageSize = 20): FieldDef[] => [query('page', 'number', { default: 1 }), query('pageSize', 'number', { default: pageSize })];

export const dateRange = (type: FieldType = 'date'): FieldDef[] => [query('from', type), query('to', type)];

/** Filters shared by the AuditLogging trail endpoints. */
export const auditFilters = (): FieldDef[] => [
  ...dateRange('datetime'),
  query('outcome'),
  ...paging(),
  query('includeArchived', 'bool'),
];

export const ACTOR_TYPES = ['JobSeeker', 'Employer', 'Administrator', 'ExternalJobSite'];
export const HELP_ROLES = ['JobSeeker', 'Employer', 'ExternalJobSite', 'Guest', 'Administrator'];
export const HELP_KINDS = ['Faq', 'Law', 'Regulation', 'ContractTypeRegulation', 'Guide', 'Video', 'InteractiveGuide'];
export const SOURCE_SYSTEMS = ['MoL', 'PEF', 'GovernmentDatabase', 'EducationalInstitution', 'GovernmentIdSystem'];
export const CONTRACT_TYPE_VALUES = ['FullTime', 'PartTime', 'Contract', 'Internship', 'Temporary'];
export const WORK_FORMATS = ['Physical', 'Online', 'Hybrid'];
export const GRANULARITY = ['day', 'week', 'month'];
export const REPORT_FORMATS = ['Pdf', 'Excel', 'Csv'];
