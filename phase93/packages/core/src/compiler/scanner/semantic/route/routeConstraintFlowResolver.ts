import type {
  RouteConstraintAllowedValue,
  RouteConstraintContract,
  RouteConstraintFact,
  RouteConstraintFlow,
  RouteConstraintMatcher,
} from '../../../../types/upstream/routeConstraints';
import { CONSTRAINT_RESOLVER_CATALOG } from './routeConstraintKnowledgeCatalog';

export interface RouteConstraintFlowInput {
  readonly facts: readonly RouteConstraintFact[];
}

export function resolveRouteConstraintFlow(input: RouteConstraintFlowInput): RouteConstraintFlow {
  const contracts = input.facts.map(resolveConstraintFact);
  const route = contracts.filter(item => item.source.kind === 'route');
  return Object.freeze({
    kind: 'route_constraint_flow',
    route: Object.freeze(route),
    effective: Object.freeze([...contracts]),
  });
}

function resolveConstraintFact(fact: RouteConstraintFact): RouteConstraintContract {
  return Object.freeze({ parameter: fact.parameter, matcher: CONSTRAINT_RESOLVER_CATALOG[fact.method](fact), source: fact.source });
}
