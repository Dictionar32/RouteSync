import type { ControllerAuthorizationRelation, ControllerMiddlewareRelation, ControllerPolicyRelation } from './controller';
import type {
  ControllerMiddlewarePolicyParts,
  EffectiveControllerActionPolicyAlgebraInterface,
} from './effectiveControllerActionPolicy';
import type { ActionName, MiddlewareName } from './names';
import type { RouteMiddlewareContract, RouteMiddlewareExclusionContract } from './routeMiddleware';
import type { Sequence } from './collections';

const sequenceToArray = <T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  items.kind === 'empty' ? output : sequenceToArray(items.tail, Object.freeze([...output, items.head]));

const sameAction = (left: ActionName, right: ActionName): boolean =>
  Object.is(left.value.value, right.value.value);

const sameMiddleware = (
  left: RouteMiddlewareContract | RouteMiddlewareExclusionContract,
  right: RouteMiddlewareContract | RouteMiddlewareExclusionContract,
): boolean => Object.is(left.middleware.name.value.value, right.middleware.name.value.value);

const scopeApplies = (scope: RouteMiddlewareContract['scope'], action: ActionName): boolean => {
  switch (scope.kind) {
    case 'blocked': return false;
    case 'all': return true;
    case 'only': return sequenceToArray(scope.actions).some(candidate => sameAction(candidate, action));
    case 'except': return !sequenceToArray(scope.actions).some(candidate => sameAction(candidate, action));
    case 'only_except': return sequenceToArray(scope.only).some(candidate => sameAction(candidate, action))
      && !sequenceToArray(scope.except).some(candidate => sameAction(candidate, action));
  }
};

type NamedControllerMiddlewareRelation = ControllerMiddlewareRelation & { readonly middleware: MiddlewareName };

const isNamedControllerMiddleware = (relation: ControllerPolicyRelation): relation is NamedControllerMiddlewareRelation =>
  relation.kind === 'controller_middleware_relation' && relation.middleware.kind === 'middleware_name';

const controllerMiddleware = (relations: readonly ControllerPolicyRelation[]): ControllerMiddlewarePolicyParts => {
  const controllerMiddlewareRelations = relations.filter(isNamedControllerMiddleware);
  const contracts = controllerMiddlewareRelations.map(relation => Object.freeze({
    contract: Object.freeze({
      middleware: { kind: 'named' as const, name: relation.middleware, parameters: [] },
      source: relation.scope.kind === 'method' ? { kind: 'controller_method' as const } : { kind: 'controller_class' as const },
      scope: relation.actions.kind === 'blocked'
        ? { kind: 'blocked' as const, reason: relation.actions.reason }
        : relation.actions.kind === 'all'
        ? { kind: 'all' as const }
        : relation.actions.kind === 'only_except'
          ? { kind: 'only_except' as const, only: sequenceToArray(relation.actions.only), except: sequenceToArray(relation.actions.except) }
          : { kind: relation.actions.kind, actions: sequenceToArray(relation.actions.actions) },
    }),
    exclusion: relation.exclusion,
  }));
  return Object.freeze({
    declarations: Object.freeze(contracts.filter(value => !value.exclusion).map(value => value.contract)),
    exclusions: Object.freeze(contracts.filter(value => value.exclusion).map(value => value.contract)),
  });
};

const effectiveMiddleware = (
  declarations: readonly RouteMiddlewareContract[],
  exclusions: readonly RouteMiddlewareExclusionContract[],
  action: ActionName,
): readonly RouteMiddlewareContract[] => Object.freeze(declarations.filter(
  declaration => scopeApplies(declaration.scope, action)
    && !exclusions.some(exclusion => scopeApplies(exclusion.scope, action) && sameMiddleware(declaration, exclusion))
));

const authorization = (
  relations: readonly ControllerPolicyRelation[],
  action: ActionName,
): readonly ControllerAuthorizationRelation[] => Object.freeze(relations.filter(
  (relation): relation is ControllerAuthorizationRelation => relation.kind === 'controller_authorization_relation'
    && (() => {
      switch (relation.actions.kind) {
        case 'blocked': return false;
        case 'all': return true;
        case 'only': return sequenceToArray(relation.actions.actions).some(candidate => sameAction(candidate, action));
        case 'except': return !sequenceToArray(relation.actions.actions).some(candidate => sameAction(candidate, action));
        case 'only_except': return sequenceToArray(relation.actions.only).some(candidate => sameAction(candidate, action))
          && !sequenceToArray(relation.actions.except).some(candidate => sameAction(candidate, action));
      }
    })(),
));

export const effectiveControllerActionPolicyAlgebra: EffectiveControllerActionPolicyAlgebraInterface = Object.freeze({
  controllerMiddleware,
  effectiveMiddleware,
  authorization,
});
