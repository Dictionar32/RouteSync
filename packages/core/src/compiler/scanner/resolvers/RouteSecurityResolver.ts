/** @deprecated Compatibility name; the upstream authority contract is canonical. */
import { routeSecurityAuthority } from '../../../types/upstream/routeSecurityAuthority';
import type {
  RouteSecurityAuthorityInput,
  RouteSecurityResolution,
} from '../../../types/upstream/routeSecurityAuthority';

export type { RouteSecurityResolution } from '../../../types/upstream/routeSecurityAuthority';

/** Thin executor adapter: accepts the existing closed input contract without unpacking or reclassifying it. */
export const RouteSecurityResolver = Object.freeze({
  resolve: (input: RouteSecurityAuthorityInput): RouteSecurityResolution =>
    routeSecurityAuthority.resolve(input),
});
