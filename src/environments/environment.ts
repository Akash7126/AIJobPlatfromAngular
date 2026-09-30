/** Base URLs of the JobPlatform microservices (ports from each service's Properties/launchSettings.json). */
export const environment = {
  production: false,
  api: {
    // Every service validates tokens against http://localhost:5100/.well-known/jwks.json (appsettings.Development.json), so AccountIdentity runs on 5100.
    identity: 'http://localhost:5100',
    government: 'http://localhost:5101',
    external: 'http://localhost:5102',
    profile: 'http://localhost:5104',
    employer: 'http://localhost:5105',
    help: 'http://localhost:5106',
    audit: 'http://localhost:5107',
    admin: 'http://localhost:5108',
    jobs: 'http://localhost:5109',
    matching: 'http://localhost:5110',
    sourcing: 'http://localhost:5111',
    reporting: 'http://localhost:5112',
    notification: 'http://localhost:5113',
  },
};

export type ServiceKey = keyof typeof environment.api;
