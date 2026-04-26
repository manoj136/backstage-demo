import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const licensesPlugin = createPlugin({
  id: 'licenses',
  routes: {
    root: rootRouteRef,
  },
});

export const LicensesPage = licensesPlugin.provide(
  createRoutableExtension({
    name: 'LicensesPage',
    component: () =>
      import('./components/LicensesComponent').then(m => m.LicensesComponent),
    mountPoint: rootRouteRef,
  }),
);
