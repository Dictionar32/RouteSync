/**
 * Historical wiring path. Route-group semantic authority remains upstream.
 * This module re-exports the interface-typed operation object, not free functions.
 */
export { routeGroupSemanticResolver } from '../../upstream/route/routeGroupSemanticResolver';
export type { RouteGroupResolutionJudgment, RouteGroupSemanticResolverInterface } from '../../upstream/route/routeGroupSemanticResolver';
