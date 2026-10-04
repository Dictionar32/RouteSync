import type { RouteGroupContext, RouteConstraint } from '../../../../types/upstream/route';
import { stringValue } from '../../../../types/upstream/names';
import type { MiddlewareName } from '../../../../types/upstream/names';
import type { Sequence } from '../../../../types/upstream/collections';
import { createRoutePath } from '../../../../types/upstream/names';
import type { RouteGroupFact } from '../../../../types/upstream/routeGroupFacts';
import type { RouteMiddlewareMutation } from '../../../../types/upstream/route';
import { relationAdvanceIndex, relationGate, relationProject, relationVariantFold } from '../../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';

export interface RouteGroupResolutionJudgment {
  readonly kind: 'route_group_resolution_judgment';
  readonly input: RouteGroupFact;
  readonly context: RouteGroupContext;
  readonly resolution: 'relation_fact_projection';
  readonly target: 'route_semantic_context';
  readonly closed: true;
}

/**
 * Laravel semantic boundary. This layer is deliberately AST-free: all
 * Laravel/domain decisions happen from semantic facts, before the interface.
 */
export const resolveRouteGroupFactsJudgment = (facts: RouteGroupFact): RouteGroupResolutionJudgment => {
  const prefix = resolvePrefix(facts.prefix);

  const middlewareItems: readonly RouteMiddlewareMutation[] = resolveMiddlewareItems(facts.middleware);
  const middlewareMutations: Sequence<RouteMiddlewareMutation> = sequenceFromValues(middlewareItems);

  const constraints: Sequence<RouteConstraint> = sequenceFromValues(
    relationProject(facts.constraints, constraint => routeConstraintFromArgument(constraint.parameter, constraint.argument)),
  );

  const namePrefix = resolveNamePrefix(facts.namePrefix);

  const controller = resolveController(facts.controller);
  const domain = resolveDomain(facts.domain);

  const context = Object.freeze({
    middlewareMutations,
    prefix,
    namePrefix,
    controller,
    domain,
    bindingScope: resolveBindingScope(facts.bindingScope),
    constraints,
  });
  return Object.freeze({
    kind: 'route_group_resolution_judgment',
    input: facts,
    context,
    resolution: 'relation_fact_projection',
    target: 'route_semantic_context',
    closed: true,
  });
};

export function resolveRouteGroupFacts(facts: RouteGroupFact): RouteGroupContext {
  return resolveRouteGroupFactsJudgment(facts).context;
}


function routeConstraintFromArgument(parameter: RouteGroupFact['constraints'][number]['parameter'], argument: RouteGroupFact['constraints'][number]['argument']): RouteConstraint {
  return relationVariantFold(argument, 'pattern',
    () => Object.freeze({ kind: 'unconstrained' }),
    rest => relationVariantFold(rest, 'values',
      () => Object.freeze({ kind: 'unconstrained' }),
      values => Object.freeze({ kind: 'set', parameter, values: sequenceFromValues(values.values) }),
      () => Object.freeze({ kind: 'unconstrained' })),
    pattern => Object.freeze({ kind: 'pattern', parameter, value: pattern.value }));
}

function resolvePrefix(values: RouteGroupFact['prefix']): RouteGroupContext['prefix'] {
  return relationGate(
    relationEqual(values.length, 0),
    () => ({ kind: 'none' }),
    () => ({ kind: 'some', value: createRoutePath(relationProject(values, value => value.value).join('/')) }),
  );
}

function resolveMiddlewareItems(values: RouteGroupFact['middleware']): readonly RouteMiddlewareMutation[] {
  return relationGate(
    relationEqual(values.length, 0),
    () => Object.freeze([]),
    () => Object.freeze([{ kind: 'with', middleware: sequenceFromValues(values) }]),
  );
}

function resolveNamePrefix(values: RouteGroupFact['namePrefix']): RouteGroupContext['namePrefix'] {
  return relationGate(
    relationEqual(values.length, 0),
    () => ({ kind: 'none' }),
    () => ({ kind: 'some', value: stringValue(relationProject(values, value => value.value).join('')) }),
  );
}

function sequenceFromValues<T>(values: readonly T[], index = 0): Sequence<T> {
  return relationGate(
    index < values.length,
    () => ({ kind: 'cons', head: values[index], tail: sequenceFromValues(values, relationAdvanceIndex(index, 1)) }),
    () => ({ kind: 'empty' }),
  );
}

function resolveBindingScope(value: RouteGroupFact['bindingScope']): RouteGroupContext['bindingScope'] {
  const knowledge = Object.freeze({
    scoped: Object.freeze({ kind: 'scoped' }),
    without_scoped: Object.freeze({ kind: 'without_scoped' }),
    default: Object.freeze({ kind: 'default' }),
  });
  return knowledge[value];
}


function resolveController(value: RouteGroupFact['controller']): RouteGroupContext['controller'] {
  return relationGate(
    relationEqual(value.kind, 'absent'),
    () => ({ kind: 'none' }),
    () => ({ kind: 'some', value: { kind: 'controller_reference', name: value.value } }),
  );
}

function resolveDomain(value: RouteGroupFact['domain']): RouteGroupContext['domain'] {
  return relationGate(
    relationEqual(value.kind, 'absent'),
    () => ({ kind: 'default' }),
    () => ({ kind: 'explicit', value: value.value }),
  );
}
