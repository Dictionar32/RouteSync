import type { RouteMissingBehavior, RouteMissingBehaviorFlow } from '../../../../types/upstream/routeMissing';
import type { RouteMissingFact } from '../../../../types/upstream/routeMissingFacts';

/** AST-free semantic resolver for Laravel missing() behavior. */
export function resolveRouteMissingFact(
  fact: RouteMissingFact,
): RouteMissingBehaviorFlow {
  const behavior: RouteMissingBehavior = resolveMissingBehavior(fact);

  return Object.freeze({
    kind: 'route_missing_behavior_flow' as const,
    behavior: Object.freeze(behavior),
  });
}


const MISSING_BEHAVIOR: Readonly<Record<RouteMissingFact['kind'], RouteMissingBehavior>> = Object.freeze({
  custom_handler: { kind: 'custom_handler' },
  absent: { kind: 'default_404' },
});

function resolveMissingBehavior(fact: RouteMissingFact): RouteMissingBehavior {
  return MISSING_BEHAVIOR[fact.kind];
}
