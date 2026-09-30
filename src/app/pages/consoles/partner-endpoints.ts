import { ConsoleSection } from '../../shared/console-shell';
import { CONTRACT_TYPE_VALUES, WORK_FORMATS, auditFilters, body, dateRange, path, paging, query, required } from './endpoint-helpers';

/** Every endpoint an external job site (partner) account uses. Rendered by the partner console. */
export const PARTNER_SECTIONS: ConsoleSection[] = [
  {
    key: 'credentials',
    title: 'API Credentials',
    icon: 'fa-key',
    service: 'AccountIdentity',
    endpoints: [
      { title: 'Current credential', service: 'identity', method: 'GET', path: 'api/v1/api-credentials/current', autoRun: true },
      {
        title: 'Issue credential',
        service: 'identity',
        method: 'POST',
        path: 'api/v1/api-credentials',
        description: 'The client secret is shown only once. Issuing a new one revokes the previous credential.',
        fields: [
          body('ipWhitelist', 'list', { label: 'IP whitelist' }),
          body('maxRequests', 'number'),
          body('periodSeconds', 'number'),
          body('expiresAtUtc', 'datetime', { label: 'Expires at' }),
        ],
      },
      {
        title: 'Revoke credential',
        service: 'identity',
        method: 'POST',
        path: 'api/v1/api-credentials/{id}/revoke',
        confirm: 'Revoke this API credential?',
        fields: [path('id', 'Credential ID')],
      },
      {
        title: 'Get OAuth access token (client credentials)',
        service: 'identity',
        method: 'POST',
        path: 'oauth/token',
        fields: [
          required(body('grant_type', 'text', { label: 'Grant type', default: 'client_credentials' })),
          required(body('client_id', 'text', { label: 'Client ID' })),
          required(body('client_secret', 'text', { label: 'Client secret' })),
        ],
      },
      { title: 'Authorization server metadata', service: 'identity', method: 'GET', path: '.well-known/oauth-authorization-server' },
      { title: 'OpenID configuration', service: 'identity', method: 'GET', path: '.well-known/openid-configuration' },
      { title: 'Signing keys (JWKS)', service: 'identity', method: 'GET', path: '.well-known/jwks.json' },
    ],
  },
  {
    key: 'integration',
    title: 'Integration',
    icon: 'fa-plug',
    service: 'ExternalIntegration',
    endpoints: [
      { title: 'My integration', service: 'external', method: 'GET', path: 'api/v1/partner/integration', autoRun: true },
      {
        title: 'Register integration',
        service: 'external',
        method: 'POST',
        path: 'api/v1/partner/integrations/register',
        fields: [required(body('sourcePlatformName')), required(body('baseUrl', 'text', { label: 'Base URL' })), body('recommendedByMolPef', 'bool', { label: 'Recommended by MoL/PEF' })],
      },
      {
        title: 'Enable pull / push models',
        service: 'external',
        method: 'PUT',
        path: 'api/v1/partner/integration/models',
        fields: [body('pullEnabled', 'bool'), body('pushEnabled', 'bool')],
      },
      {
        title: 'Sync schedule',
        service: 'external',
        method: 'PUT',
        path: 'api/v1/partner/sync-schedule',
        fields: [required(body('mode', 'select', { options: ['Scheduled', 'OnDemand'] })), body('cron', 'text', { placeholder: '0 */6 * * *' })],
      },
      { title: 'Start sync run', service: 'external', method: 'POST', path: 'api/v1/partner/sync-runs' },
      {
        title: 'Attribution visibility',
        service: 'external',
        method: 'PUT',
        path: 'api/v1/partner/attribution-visibility',
        fields: [required(body('visibility', 'select', { options: ['Public', 'AdminOnly'] }))],
      },
      { title: 'Provision sandbox', service: 'external', method: 'POST', path: 'api/v1/partner/sandbox' },
    ],
  },
  {
    key: 'jobs',
    title: 'Job Data',
    icon: 'fa-briefcase',
    service: 'ExternalIntegration',
    endpoints: [
      {
        title: 'Push a job',
        service: 'external',
        method: 'POST',
        path: 'api/v1/partner/jobs',
        fields: [
          required(body('sourceJobId', 'text', { label: 'Source job ID' })),
          required(body('title')),
          required(body('location')),
          required(body('contractType', 'select', { options: CONTRACT_TYPE_VALUES })),
          required(body('workFormat', 'select', { options: WORK_FORMATS })),
          required(body('applicationDeadline', 'datetime')),
          required(body('skills', 'list')),
          body('sourceUrl', 'text', { label: 'Source URL' }),
          required(body('summary', 'textarea')),
        ],
      },
      {
        title: 'Sync job attribution',
        service: 'external',
        method: 'PATCH',
        path: 'api/v1/partner/jobs/{platformJobId}',
        fields: [
          path('platformJobId', 'Platform job ID'),
          required(body('operation', 'select', { options: ['ExtendDeadline', 'EditDescription', 'Close', 'Deactivate', 'Delete'] })),
          body('deadline', 'datetime'),
          body('description', 'textarea'),
        ],
      },
    ],
  },
  {
    key: 'mapping',
    title: 'Field Mapping',
    icon: 'fa-exchange-alt',
    service: 'ExternalIntegration',
    endpoints: [
      { title: 'Current mapping', service: 'external', method: 'GET', path: 'api/v1/partner/mapping', autoRun: true },
      { title: 'Standard schema', service: 'external', method: 'GET', path: 'api/v1/partner/standard-schema' },
      {
        title: 'Configure mapping',
        service: 'external',
        method: 'PUT',
        path: 'api/v1/partner/mapping',
        fields: [
          required(body('standardSchemaVersion')),
          required(
            body('rules', 'json', {
              placeholder: '[{ "sourceField": "job_title", "targetField": "title", "transform": "Trim" }]',
              help: 'transform: None, Trim, ToUpper, ToLower, SplitComma',
            }),
          ),
        ],
      },
    ],
  },
  {
    key: 'docs',
    title: 'Documentation',
    icon: 'fa-book',
    service: 'ExternalIntegration',
    endpoints: [
      { title: 'API versions', service: 'external', method: 'GET', path: 'api/v1/api-versions', autoRun: true },
      { title: 'API documentation', service: 'external', method: 'GET', path: 'api/v1/docs/{version}', fields: [path('version')] },
      { title: 'Interfaces', service: 'external', method: 'GET', path: 'api/v1/docs/{version}/interfaces', fields: [path('version')] },
      { title: 'Schema documentation', service: 'external', method: 'GET', path: 'api/v1/partner/schema-documentation', fields: [required(query('version'))] },
    ],
  },
  {
    key: 'logs',
    title: 'Logs & Statistics',
    icon: 'fa-chart-bar',
    service: 'AuditLogging',
    endpoints: [
      { title: 'Integration status', service: 'audit', method: 'GET', path: 'api/v1/partners/me/integration-status', autoRun: true },
      { title: 'Sync dashboard', service: 'audit', method: 'GET', path: 'api/v1/partners/me/sync-dashboard', fields: paging() },
      { title: 'API responses', service: 'audit', method: 'GET', path: 'api/v1/partners/me/api-responses', fields: auditFilters() },
      { title: 'Submissions', service: 'audit', method: 'GET', path: 'api/v1/partners/me/submissions', fields: auditFilters() },
      { title: 'Sync errors', service: 'audit', method: 'GET', path: 'api/v1/partners/me/sync-errors', fields: auditFilters() },
      {
        title: 'Usage statistics',
        service: 'audit',
        method: 'GET',
        path: 'api/v1/partners/me/usage-statistics',
        fields: dateRange().map(f => ({ ...f, required: true })),
      },
    ],
  },
];
