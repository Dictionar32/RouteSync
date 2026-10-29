/**
 * Lossless controller-policy -> route-middleware projection.
 *
 * Only named Laravel middleware is eligible for RouteMiddlewareContract because
 * that contract intentionally models a concrete middleware name/reference.
 * Class/closure/unresolved expressions remain controller policy evidence and
 * are never coerced into a string name.
 */
import type { ControllerMiddlewareRelation, ControllerPolicyRelation } from '../../../../types/upstream/controller';
import type { MiddlewareName } from '../../../../types/upstream/names';
import type { RouteMiddlewareContract, RouteMiddlewareExclusionContract, RouteMiddlewareScope } from '../../../../types/upstream/routeMiddleware';
import type { Sequence } from '../../../../types/upstream/collections';

const sequenceToArray = <T>(sequence: Sequence<T>): readonly T[] => {
  switch (sequence.kind) {
    case 'empty':
      return Object.freeze([]);
    case 'cons':
      return [sequence.head, ...sequenceToArray(sequence.tail)];
    default: {
      const exhaustive: never = sequence;
      return exhaustive;
    }
  }
};

const actionScope = (relation: ControllerMiddlewareRelation): RouteMiddlewareScope => {
  switch (relation.actions.kind) {
    case 'blocked': return { kind: 'blocked', reason: relation.actions.reason };
    case 'all': return { kind: 'all' };
    case 'only': return { kind: 'only', actions: Object.freeze(sequenceToArray(relation.actions.actions)) };
    case 'except': return { kind: 'except', actions: Object.freeze(sequenceToArray(relation.actions.actions)) };
    case 'only_except': return {
      kind: 'only_except',
      only: Object.freeze(sequenceToArray(relation.actions.only)),
      except: Object.freeze(sequenceToArray(relation.actions.except)),
    };
    default: {
      const exhaustive: never = relation.actions;
      return exhaustive;
    }
  }
};
const controllerScope = (relation: ControllerMiddlewareRelation): RouteMiddlewareScope => actionScope(relation);

const namedMiddleware = (relation: ControllerMiddlewareRelation): MiddlewareName | undefined =>
  relation.middleware.kind === 'middleware_name' ? relation.middleware : undefined;

const declaration = (relation: ControllerMiddlewareRelation): RouteMiddlewareContract | undefined => {
  const name = namedMiddleware(relation);
  return name === undefined ? undefined : {
    middleware: { name, parameters: Object.freeze([]) },
    source: relation.scope.kind === 'class' ? { kind: 'controller_class' } : { kind: 'controller_method' },
    scope: controllerScope(relation),
  };
};

const exclusion = (relation: ControllerMiddlewareRelation): RouteMiddlewareExclusionContract | undefined => {
  const name = namedMiddleware(relation);
  return name === undefined ? undefined : {
    middleware: { name, parameters: Object.freeze([]) },
    source: relation.scope.kind === 'class' ? { kind: 'controller_class' } : { kind: 'controller_method' },
    scope: controllerScope(relation),
  };
};

export interface ControllerMiddlewareProjection {
  readonly declarations: readonly RouteMiddlewareContract[];
  readonly exclusions: readonly RouteMiddlewareExclusionContract[];
}

export interface ControllerMiddlewareProjectionOperationsInterface {
  readonly project: (policy: Sequence<ControllerPolicyRelation>) => ControllerMiddlewareProjection;
}

const projectControllerMiddlewareRelationsImplementation = (
  policy: Sequence<ControllerPolicyRelation>,
): ControllerMiddlewareProjection => {
  const relations: readonly ControllerMiddlewareRelation[] = sequenceToArray(policy).filter(
    (value): value is ControllerMiddlewareRelation => value.kind === 'controller_middleware_relation',
  );
  const declarations: RouteMiddlewareContract[] = [];
  const exclusions: RouteMiddlewareExclusionContract[] = [];

  for (const relation of relations) {
    if (relation.exclusion) {
      const item = exclusion(relation);
      if (item !== undefined) exclusions.push(item);
    } else {
      const item = declaration(relation);
      if (item !== undefined) declarations.push(item);
    }
  }

  return Object.freeze({
    declarations: Object.freeze(declarations),
    exclusions: Object.freeze(exclusions),
  });
};

export const controllerMiddlewareProjectionOperations:
  ControllerMiddlewareProjectionOperationsInterface = Object.freeze({
    project: projectControllerMiddlewareRelationsImplementation,
  });
