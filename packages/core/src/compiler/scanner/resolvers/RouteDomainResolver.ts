/** @deprecated Compatibility adapter. Canonical route-domain authority lives upstream. */
import { routeDomainAuthority } from '../../../types/upstream/routeDomainAuthority';
export type { RouteDomainResolutionContext, RouteDomainResolutionJudgment, RouteDomainCandidate, RouteDomainCandidateKind } from '../../../types/upstream/routeDomainAuthority';

export const RouteDomainResolver = Object.freeze({
  resolve: routeDomainAuthority.resolve,
  resolveJudgment: routeDomainAuthority.resolveJudgment,
});
