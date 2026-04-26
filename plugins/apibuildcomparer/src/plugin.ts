import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const apibuildcomparerPlugin = createPlugin({
  id: 'apibuildcomparer',
  routes: {
    root: rootRouteRef,
  },
});

export const ApiBuilderComparerPage = apibuildcomparerPlugin.provide(
  createRoutableExtension({
    name: 'ApiBuilderComparerPage',
    component: () =>
      import('./components/ApiBuilderComparerComponent').then(m => m.ApiBuilderComparerPage),
    mountPoint: rootRouteRef,
  }),
);
