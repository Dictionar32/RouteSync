/**
 * Lossless controller-policy -> route-middleware projection.
 *
 * Only named Laravel middleware is eligible for RouteMiddlewareContract because
 * that contract intentionally models a concrete middleware name/reference.
 * Class/closure/unresolved expressions remain controller policy evidence and
 * are never coerced into a string name.
 */
import type { ControllerMiddlewareRelation, ControllerPolicyActionScope, ControllerPolicyRelation } from '../../../../types/upstream/controller';
import type { MiddlewareName } from '../../../../types/upstream/names';
import type { RouteMiddlewareContract, RouteMiddlewareExclusionContract, RouteMiddlewareScope } from '../../../../types/upstream/routeMiddleware';
import { relationExpand, relationGate, relationSelect, relationVariantFold } from '../../../../semantic/relations/relationalSequence';
import { relationEqual } from '../../../../semantic/relations/semanticRelations';
import type { Sequence } from '../../../../types/upstream/collections';

const sequenceToArray = <T>(sequence: Sequence<T>): readonly T[] =>
  relationGate(
    relationEqual(sequence.kind, 'empty'),
    () => [],
    () => {
      const cons = sequence as Extract<Sequence<T>, { readonly kind: 'cons' }>;
      return [cons.head, ...sequenceToArray(cons.tail)];
    },
  );

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

export const projectControllerMiddlewareRelations = (
  policy: Sequence<ControllerPolicyRelation>,
): ControllerMiddlewareProjection => {
  const relations = relationSelect(sequenceToArray(policy), value => value.kind === 'controller_middleware_relation');
  const declarations = relationExpand(relations, value => {
    const relation = value as ControllerMiddlewareRelation;
    return relation.exclusion ? [] : relationVariantFold({ kind: 'some', value: declaration(relation) }, 'some', item => item === undefined ? [] : [item], () => []);
  });
  const exclusions = relationExpand(relations, value => {
    const relation = value as ControllerMiddlewareRelation;
    return relation.exclusion ? relationVariantFold({ kind: 'some', value: exclusion(relation) }, 'some', item => item === undefined ? [] : [item], () => []) : [];
  });
  return Object.freeze({
    declarations: Object.freeze(declarations),
    exclusions: Object.freeze(exclusions),
  });
};
