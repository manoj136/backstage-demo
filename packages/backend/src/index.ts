/*
 * Hi!
 *
 * Note that this is an EXAMPLE Backstage backend. Please check the README.
 *
 * Happy hacking!
 */

import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

backend.add(import('@backstage/plugin-app-backend'));
backend.add(import('@backstage/plugin-proxy-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend'));
backend.add(import('@backstage/plugin-techdocs-backend/alpha'));

// auth plugin
//backend.add(import('@backstage/plugin-auth-backend'));
// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
//backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
// See https://backstage.io/docs/auth/guest/provider

//backend.add(import('@backstage/plugin-auth-backend-module-microsoft-provider'));

import { createBackendModule } from '@backstage/backend-plugin-api';
import { microsoftAuthenticator } from '@backstage/plugin-auth-backend-module-microsoft-provider';
import { stringifyEntityRef, DEFAULT_NAMESPACE } from '@backstage/catalog-model';
import {
  authProvidersExtensionPoint,
  createOAuthProviderFactory,
} from '@backstage/plugin-auth-node';

const customAuth = createBackendModule({
  // This ID must be exactly "auth" because that's the plugin it targets
  pluginId: 'auth',
  // This ID must be unique, but can be anything
  moduleId: 'microsoft',
  register(reg) {
    reg.registerInit({
      deps: { providers: authProvidersExtensionPoint },
      async init({ providers }) {
        providers.registerProvider({
          // This ID must match the actual provider config, e.g. addressing
          // auth.providers.github means that this must be "github".
          providerId: 'microsoft',
          // Use createProxyAuthProviderFactory instead if it's one of the proxy
          // based providers rather than an OAuth based one
          factory: createOAuthProviderFactory({
            authenticator: microsoftAuthenticator,
            async signInResolver({ profile }, ctx) {
              /*********************************************************************
               * Custom resolver code goes here, see farther down in this article! *
               * "info" is the sign in result from the upstream (github here), and *
               * "ctx" contains useful utilities for token issuance etc.           *
               *********************************************************************/
              if (!profile.email) {
                throw new Error(
                  'Login failed, user profile does not contain an email',
                );
              }
              // Split the email into the local part and the domain.
              const [localPart, domain] = profile.email.split('@');
            
              // Next we verify the email domain. It is recommended to include this
              // kind of check if you don't look up the user in an external service.
              if (domain !== 'admgroup.com') {
                // throw new Error(
                //   `Login failed, '${profile.email}' does not belong to the expected domain`,
                //);
              }
            
              // By using `stringifyEntityRef` we ensure that the reference is formatted correctly
              const userEntity = stringifyEntityRef({
                kind: 'User',
                name: localPart,
                namespace: DEFAULT_NAMESPACE,
              });
              return ctx.issueToken({
                claims: {
                  sub: userEntity,
                  ent: [userEntity],
                },
              });
            },
          }),
        });
      },
    });
  },
});

backend.add(import('@backstage/plugin-auth-backend'));
backend.add(customAuth);

// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);

// See https://backstage.io/docs/features/software-catalog/configuration#subscribing-to-catalog-errors
backend.add(import('@backstage/plugin-catalog-backend-module-logs'));

// permission plugin
backend.add(import('@backstage/plugin-permission-backend/alpha'));
// See https://backstage.io/docs/permissions/getting-started for how to create your own permission policy
backend.add(
  import('@backstage/plugin-permission-backend-module-allow-all-policy'),
);

// search plugin
backend.add(import('@backstage/plugin-search-backend/alpha'));

// search engine
// See https://backstage.io/docs/features/search/search-engines
backend.add(import('@backstage/plugin-search-backend-module-pg/alpha'));

// search collators
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs/alpha'));

// kubernetes
backend.add(import('@backstage/plugin-kubernetes-backend'));

backend.add(import('@backstage-community/plugin-azure-devops-backend'));
backend.add(import('@drodil/backstage-plugin-qeta-backend'));
backend.add(import('@backstage-community/plugin-playlist-backend'));
backend.add(import('@rsc-labs/backstage-changelog-plugin-backend'));

import {
  coreServices,
  SchedulerServiceTaskRunner,
  readSchedulerServiceTaskScheduleDefinitionFromConfig
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { azureKeyVaultProvider } from './providers/azure-key-vault-provider';
import { azureDevOpsBuildPipelineProvider } from './providers/azure-devops-build-pipeline-provider';

export const catalogModuleAzureKeyVaultProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'azureKeyVaultProvider',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        reader: coreServices.urlReader,
        scheduler: coreServices.scheduler,
        rootConfig: coreServices.rootConfig,
        database: coreServices.database,
        httpAuth: coreServices.auth,
        permissions: coreServices.permissions,
      },
      async init({ catalog, scheduler, rootConfig, httpAuth}) {
        const config = rootConfig.getConfig('catalog.providers.azure-key-vault-provider'); 
        
        // Add a default schedule if you don't define one in config.
        const schedule = config.has('schedule')
          ? readSchedulerServiceTaskScheduleDefinitionFromConfig(
              config.getConfig('schedule'),
            )
          : {
              frequency: { minutes: 1 },
              timeout: { minutes: 10 },
            };
        const taskRunner: SchedulerServiceTaskRunner = scheduler.createScheduledTaskRunner(schedule);

        const myProvider = new azureKeyVaultProvider(taskRunner,rootConfig, httpAuth);
        catalog.addEntityProvider(myProvider);
      },
    });
  },
});

export const catalogModuleAzureDevOpsBuildPipelineProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'azureDevOpsBuildPipelineProvider',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        reader: coreServices.urlReader,
        scheduler: coreServices.scheduler,
        rootConfig: coreServices.rootConfig,
        database: coreServices.database,
        httpAuth: coreServices.auth,
        permissions: coreServices.permissions,
      },
      async init({ catalog, scheduler, rootConfig, httpAuth}) {
        const config = rootConfig.getConfig('catalog.providers.azure-devOps-build-pipeline-provider'); 
        
        // Add a default schedule if you don't define one in config.
        const schedule = config.has('schedule')
          ? readSchedulerServiceTaskScheduleDefinitionFromConfig(
              config.getConfig('schedule'),
            )
          : {
              frequency: { minutes: 1 },
              timeout: { minutes: 10 },
            };
        const taskRunner: SchedulerServiceTaskRunner = scheduler.createScheduledTaskRunner(schedule);

        const myProvider = new azureDevOpsBuildPipelineProvider(taskRunner,rootConfig, httpAuth);
        catalog.addEntityProvider(myProvider);
      },
    });
  },
});

backend.add(catalogModuleAzureKeyVaultProvider);
backend.add(catalogModuleAzureDevOpsBuildPipelineProvider);

backend.add(import('@backstage/plugin-catalog-backend-module-azure'));
// Add the Argo CD backend plugin
backend.add(import('@roadiehq/backstage-plugin-argo-cd-backend'));

backend.start();
