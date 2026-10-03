/**
 * Semantic binding boundary.
 *
 * AST extraction is deliberately outside this module. Consumers that still
 * have AAT/AST must pass through routeBindingAstAdapter first.
 */
import type { RouteBindingContract } from '../../../../types/upstream/routeBinding';
import type { RouteBindingFact } from '../../../../types/upstream/routeBindingFacts';
import { resolveRouteBindingFacts } from './routeBindingSemanticResolver';

export function resolveRouteBindingContracts(
  facts: readonly RouteBindingFact[],
): readonly RouteBindingContract[] {
  return resolveRouteBindingFacts(facts);
}
