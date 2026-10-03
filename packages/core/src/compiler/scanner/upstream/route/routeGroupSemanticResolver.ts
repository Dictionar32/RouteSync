import type { RouteGroupContext, RouteConstraint } from '../../../../types/upstream/route';
import { stringValue } from '../../../../types/upstream/names';
import type { MiddlewareName } from '../../../../types/upstream/names';
import type { Sequence } from '../../../../types/upstream/collections';
import { createRoutePath } from '../../../../types/upstream/names';
import type { RouteGroupFact } from '../../../../types/upstream/routeGroupFacts';
import type { RouteMiddlewareMutation } from '../../../../types/upstream/route';
import { relationAdvanceIndex, relationGate, relationProject } from '../../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';

/**
 * Laravel semantic boundary. This layer is deliberately AST-free: all
 * Laravel/domain decisions happen from semantic facts, before the interface.
 */
export function resolveRouteGroupFacts(facts: RouteGroupFact): RouteGroupContext {
  const prefix = resolvePrefix(facts.prefix);

  const middlewareItems: readonly RouteMiddlewareMutation[] = resolveMiddlewareItems(facts.middleware);
  const middlewareMutations: Sequence<RouteMiddlewareMutation> = sequenceFromValues(middlewareItems);

  const constraints: Sequence<RouteConstraint> = sequenceFromValues(
    relationProject(facts.constraints, constraint => ({
      kind: 'pattern' as const,
      parameter: constraint.parameter,
      value: constraint.value,
    })),
  );

  const namePrefix = resolveNamePrefix(facts.namePrefix);

  const controller = resolveController(facts.controller);
  const domain = resolveDomain(facts.domain);

  return Object.freeze({
    middlewareMutations,
    prefix,
    namePrefix,
    controller,
    domain,
    bindingScope: resolveBindingScope(facts.bindingScope),
    constraints,
  });
}


function resolvePrefix(values: RouteGroupFact['prefix']): RouteGroupContext['prefix'] {
  return relationGate(
    relationEqual(values.length, 0),
    () => ({ kind: 'none' as const }),
    () => ({ kind: 'some' as const, value: createRoutePath(relationProject(values, value => value.value).join('/')) }),
  );
}

function resolveMiddlewareItems(values: RouteGroupFact['middleware']): readonly RouteMiddlewareMutation[] {
  return relationGate(
    relationEqual(values.length, 0),
    () => Object.freeze([]) as readonly RouteMiddlewareMutation[],
    () => Object.freeze([{ kind: 'with' as const, middleware: sequenceFromValues(values) }]),
  );
}

function resolveNamePrefix(values: RouteGroupFact['namePrefix']): RouteGroupContext['namePrefix'] {
  return relationGate(
    relationEqual(values.length, 0),
    () => ({ kind: 'none' as const }),
    () => ({ kind: 'some' as const, value: stringValue(relationProject(values, value => value.value).join('')) }),
  );
}

function sequenceFromValues<T>(values: readonly T[], index = 0): Sequence<T> {
  return relationGate(
    index < values.length,
    () => ({ kind: 'cons' as const, head: values[index], tail: sequenceFromValues(values, relationAdvanceIndex(index, 1)) }),
    () => ({ kind: 'empty' as const }),
  );
}

function resolveBindingScope(value: RouteGroupFact['bindingScope']): RouteGroupContext['bindingScope'] {
  const knowledge = Object.freeze({
    scoped: Object.freeze({ kind: 'scoped' as const }),
    without_scoped: Object.freeze({ kind: 'without_scoped' as const }),
    default: Object.freeze({ kind: 'default' as const }),
  });
  return knowledge[value];
}


function resolveController(value: RouteGroupFact['controller']): RouteGroupContext['controller'] {
  return relationGate(
    relationEqual(value.kind, 'absent'),
    () => ({ kind: 'none' as const }),
    () => ({ kind: 'some' as const, value: { kind: 'controller_reference' as const, name: value.value } }),
  );
}

function resolveDomain(value: RouteGroupFact['domain']): RouteGroupContext['domain'] {
  return relationGate(
    relationEqual(value.kind, 'absent'),
    () => ({ kind: 'default' as const }),
    () => ({ kind: 'explicit' as const, value: value.value }),
  );
}
