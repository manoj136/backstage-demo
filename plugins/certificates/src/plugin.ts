import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const certificatesPlugin = createPlugin({
  id: 'certificates',
  routes: {
    root: rootRouteRef,
  },
});

export const CertificatesPage = certificatesPlugin.provide(
  createRoutableExtension({
    name: 'CertificatesPage',
    component: () =>
      import('./components/CertificatesComponent').then(m => m.CertificatesComponent),
    mountPoint: rootRouteRef,
  }),
);
