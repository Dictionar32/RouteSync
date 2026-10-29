import type { RouteGroupContext, RouteConstraint } from '../../../../types/upstream/route';
import { stringValue } from '../../../../types/upstream/names';
import type { MiddlewareName } from '../../../../types/upstream/names';
import type { Sequence } from '../../../../types/upstream/collections';
import { createRoutePath } from '../../../../types/upstream/names';
import type { RouteGroupFact } from '../../../../types/upstream/routeGroupFacts';
import type { RouteMiddlewareMutation } from '../../../../types/upstream/route';

export interface RouteGroupResolutionJudgment {
  readonly kind: 'route_group_resolution_judgment';
  readonly input: RouteGroupFact;
  readonly context: RouteGroupContext;
  readonly resolution: 'typed_fact_projection';
  readonly target: 'route_semantic_context';
  readonly closed: true;
}

/**
 * Laravel semantic boundary. This layer is deliberately AST-free: all
 * Laravel/domain decisions happen from semantic facts, before the interface.
 */
export interface RouteGroupSemanticResolverInterface {
  readonly resolveJudgment: (facts: RouteGroupFact) => RouteGroupResolutionJudgment;
  readonly resolveContext: (facts: RouteGroupFact) => RouteGroupContext;
}

const resolveJudgment = (facts: RouteGroupFact): RouteGroupResolutionJudgment => {
  const prefix = resolvePrefix(facts.prefix);

  const middlewareItems: readonly RouteMiddlewareMutation[] = resolveMiddlewareItems(facts.middleware);
  const middlewareMutations: Sequence<RouteMiddlewareMutation> = sequenceFromValues(middlewareItems);

  const constraints: Sequence<RouteConstraint> = sequenceFromValues(
    facts.constraints.map(constraint => routeConstraintFromArgument(constraint.parameter, constraint.argument)),
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
    resolution: 'typed_fact_projection',
    target: 'route_semantic_context',
    closed: true,
  });
};

const resolveContext = (facts: RouteGroupFact): RouteGroupContext => resolveJudgment(facts).context;

export const routeGroupSemanticResolver: RouteGroupSemanticResolverInterface = Object.freeze({
  resolveJudgment,
  resolveContext,
});


const routeConstraintFromArgument = (
  parameter: RouteGroupFact['constraints'][number]['parameter'],
  argument: RouteGroupFact['constraints'][number]['argument'],
): RouteConstraint => {
  switch (argument.kind) {
    case 'none':
      return Object.freeze({ kind: 'unconstrained' });
    case 'values':
      return Object.freeze({ kind: 'set', parameter, values: sequenceFromValues(argument.values) });
    case 'pattern':
      return Object.freeze({ kind: 'pattern', parameter, value: argument.value });
    default: {
      const exhaustive: never = argument;
      return exhaustive;
    }
  }
};

const resolvePrefix = (values: RouteGroupFact['prefix']): RouteGroupContext['prefix'] => {
  if (values.length === 0) return Object.freeze({ kind: 'none' });
  return Object.freeze({ kind: 'some', value: createRoutePath(values.map(value => value.value).join('/')) });
};

const resolveMiddlewareItems = (values: RouteGroupFact['middleware']): readonly RouteMiddlewareMutation[] =>
  values.length === 0
    ? Object.freeze([])
    : Object.freeze([{ kind: 'with', middleware: sequenceFromValues(values) }]);

const resolveNamePrefix = (values: RouteGroupFact['namePrefix']): RouteGroupContext['namePrefix'] => {
  if (values.length === 0) return Object.freeze({ kind: 'none' });
  return Object.freeze({ kind: 'some', value: stringValue.create(values.map(value => value.value).join('')) });
};

const sequenceFromValues = <T>(values: readonly T[], index = 0): Sequence<T> =>
  index < values.length
    ? Object.freeze({ kind: 'cons', head: values[index], tail: sequenceFromValues(values, index + 1) })
    : Object.freeze({ kind: 'empty' });

const resolveBindingScope = (value: RouteGroupFact['bindingScope']): RouteGroupContext['bindingScope'] => {
  switch (value) {
    case 'scoped':
      return Object.freeze({ kind: 'scoped' });
    case 'without_scoped':
      return Object.freeze({ kind: 'without_scoped' });
    case 'default':
      return Object.freeze({ kind: 'default' });
    default: {
      const exhaustive: never = value;
      return exhaustive;
    }
  }
};


const resolveController = (value: RouteGroupFact['controller']): RouteGroupContext['controller'] => {
  switch (value.kind) {
    case 'absent':
      return Object.freeze({ kind: 'none' });
    case 'present':
      return Object.freeze({ kind: 'some', value: Object.freeze({ kind: 'controller_reference', name: value.value }) });
    default: {
      const exhaustive: never = value;
      return exhaustive;
    }
  }
};

const resolveDomain = (value: RouteGroupFact['domain']): RouteGroupContext['domain'] => {
  switch (value.kind) {
    case 'absent':
      return Object.freeze({ kind: 'default' });
    case 'present':
      return Object.freeze({ kind: 'explicit', value: value.value });
    default: {
      const exhaustive: never = value;
      return exhaustive;
    }
  }
};
