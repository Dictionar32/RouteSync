import type { RouteGroupContext, RouteConstraint } from '../../../../types/upstream/route';
import { stringValue } from '../../../../types/upstream/names';
import type { MiddlewareName } from '../../../../types/upstream/names';
import type { Sequence } from '../../../../types/upstream/collections';
import { createRoutePath } from '../../../../types/upstream/names';
import type { RouteGroupFact } from '../../../../types/upstream/routeGroupFacts';
import type { RouteMiddlewareMutation } from '../../../../types/upstream/route';

/**
 * Laravel semantic boundary. This layer is deliberately AST-free: all
 * Laravel/domain decisions happen from semantic facts, before the interface.
 */
export function resolveRouteGroupFacts(facts: RouteGroupFact): RouteGroupContext {
  const prefix = resolvePrefix(facts.prefix);

  const middlewareItems: readonly RouteMiddlewareMutation[] = resolveMiddlewareItems(facts.middleware);
  const middlewareMutations: Sequence<RouteMiddlewareMutation> = middlewareItems.reduceRight<Sequence<RouteMiddlewareMutation>>(
    (tail, mutation) => ({ kind: 'cons', head: mutation, tail }),
    { kind: 'empty' },
  );

  const constraints: Sequence<RouteConstraint> = facts.constraints.reduceRight<Sequence<RouteConstraint>>(
    (tail, constraint) => ({
      kind: 'cons',
      head: {
        kind: 'pattern',
        parameter: constraint.parameter,
        value: constraint.value,
      },
      tail,
    }),
    { kind: 'empty' },
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
  if (values.length === 0) return { kind: 'none' };
  return { kind: 'some', value: createRoutePath(values.map(value => value.value).join('/')) };
}

function resolveMiddlewareItems(values: RouteGroupFact['middleware']): readonly RouteMiddlewareMutation[] {
  if (values.length === 0) return [];
  return [{
    kind: 'with',
    middleware: values.reduceRight<Sequence<MiddlewareName>>(
      (tail, name) => ({ kind: 'cons', head: name, tail }),
      { kind: 'empty' },
    ),
  }];
}

function resolveNamePrefix(values: RouteGroupFact['namePrefix']): RouteGroupContext['namePrefix'] {
  if (values.length === 0) return { kind: 'none' };
  return { kind: 'some', value: stringValue(values.map(value => value.value).join('')) };
}

const BINDING_SCOPE: Readonly<Record<RouteGroupFact['bindingScope'], RouteGroupContext['bindingScope']>> = Object.freeze({
  scoped: { kind: 'scoped' },
  without_scoped: { kind: 'without_scoped' },
  default: { kind: 'default' },
});

function resolveBindingScope(value: RouteGroupFact['bindingScope']): RouteGroupContext['bindingScope'] {
  return BINDING_SCOPE[value];
}


const CONTROLLER_BY_PRESENCE = Object.freeze({
  absent: () => ({ kind: 'none' as const }),
  present: (value: Extract<RouteGroupFact['controller'], { kind: 'present' }>) => ({ kind: 'some' as const, value: { kind: 'controller_reference' as const, name: value.value } }),
});

function resolveController(value: RouteGroupFact['controller']): RouteGroupContext['controller'] {
  return CONTROLLER_BY_PRESENCE[value.kind](value as never);
}

const DOMAIN_BY_PRESENCE = Object.freeze({
  absent: () => ({ kind: 'default' as const }),
  present: (value: Extract<RouteGroupFact['domain'], { kind: 'present' }>) => ({ kind: 'explicit' as const, value: value.value }),
});

function resolveDomain(value: RouteGroupFact['domain']): RouteGroupContext['domain'] {
  return DOMAIN_BY_PRESENCE[value.kind](value as never);
}
