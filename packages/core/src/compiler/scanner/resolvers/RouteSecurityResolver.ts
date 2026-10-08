/** @deprecated Compatibility adapter. Canonical security authority lives upstream. */
import { routeSecurityAuthority } from '../../../types/upstream/routeSecurityAuthority';
import type { RouteMiddlewares } from '../../../types/upstream/collections';
import type { TruthValue } from '../../../types/upstream/valueObjects';
import type { RouteSecurityResolution } from '../../../types/upstream/routeSecurityAuthority';

export type { RouteSecurityResolution } from '../../../types/upstream/routeSecurityAuthority';

export const RouteSecurityResolver = Object.freeze({
  resolve: (middleware: RouteMiddlewares, auth: TruthValue = { kind: 'truth_value', value: false }) =>
    routeSecurityAuthority.resolve(middleware, auth),
});
