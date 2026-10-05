import type { ControllerAuthorizationRelation, ControllerPolicyRelation } from './controller';
import type { EffectiveControllerActionPolicy } from './effectiveControllerActionPolicy';
import type { ActionName, ControllerName, MiddlewareName } from './names';
import type { RouteMiddlewareContract, RouteMiddlewareExclusionContract, RouteMiddlewareSemanticInput } from './routeMiddleware';
import type { SourceSpan } from './provenance';

const sequenceToArray = <T>(items: import('./collections').Sequence<T>, output: readonly T[] = []): readonly T[] => items.kind === 'empty' ? output : sequenceToArray(items.tail, Object.freeze([...output, items.head]));

const sameAction = (left: ActionName, right: ActionName): boolean => left.value.value === right.value.value;
const sameMiddleware = (left: RouteMiddlewareContract | RouteMiddlewareExclusionContract, right: RouteMiddlewareContract | RouteMiddlewareExclusionContract): boolean =>
  left.middleware.name.value.value === right.middleware.name.value.value;

const scopeApplies = (
  scope: RouteMiddlewareContract['scope'],
  action: ActionName,
): boolean => scope.kind === 'all'
  || (scope.kind === 'only' && scope.actions.some(candidate => sameAction(candidate, action)))
  || (scope.kind === 'except' && !scope.actions.some(candidate => sameAction(candidate, action)));

const controllerMiddleware = (
  relations: readonly ControllerPolicyRelation[],
): { readonly declarations: readonly RouteMiddlewareContract[]; readonly exclusions: readonly RouteMiddlewareExclusionContract[] } => {
  const declarations: RouteMiddlewareContract[] = [];
  const exclusions: RouteMiddlewareExclusionContract[] = [];
  for (const relation of relations) {
    if (relation.kind !== 'controller_middleware_relation' || relation.middleware.kind !== 'middleware_name') continue;
    const contract = Object.freeze({
      middleware: { kind: 'named' as const, name: relation.middleware, parameters: [] },
      source: relation.scope.kind === 'method' ? { kind: 'controller_method' as const } : { kind: 'controller_class' as const },
      scope: relation.actions.kind === 'all'
        ? { kind: 'all' as const }
        : { kind: relation.actions.kind, actions: sequenceToArray(relation.actions.actions) },
    });
    if (relation.exclusion) exclusions.push(contract);
    else declarations.push(contract);
  }
  return { declarations: Object.freeze(declarations), exclusions: Object.freeze(exclusions) };
};

export interface EffectiveControllerActionPolicyUpstreamInput {
  readonly controller: ControllerName;
  readonly action: ActionName;
  readonly middleware: RouteMiddlewareSemanticInput;
  readonly policy?: readonly ControllerPolicyRelation[];
  readonly inheritedFrom?: readonly ControllerName[];
  readonly source?: readonly SourceSpan[];
}

/**
 * Pure upstream closure for one concrete controller action. This intentionally
 * has no scanner/compiler dependency so high-level source-model projection can
 * consume a closed policy without reversing the upstream/downstream boundary.
 */
export const resolveEffectiveControllerActionPolicyUpstream = (
  input: EffectiveControllerActionPolicyUpstreamInput,
): EffectiveControllerActionPolicy => {
  const controller = controllerMiddleware(input.policy ?? []);
  const declarations = Object.freeze([...input.middleware.declarations, ...controller.declarations]);
  const exclusions = Object.freeze([...input.middleware.exclusions, ...controller.exclusions]);
  const effectiveMiddleware = Object.freeze(declarations.filter(declaration =>
    scopeApplies(declaration.scope, input.action)
    && !exclusions.some(exclusion => scopeApplies(exclusion.scope, input.action) && sameMiddleware(declaration, exclusion)),
  ));
  const authorization = Object.freeze((input.policy ?? []).filter((relation): relation is ControllerAuthorizationRelation =>
    relation.kind === 'controller_authorization_relation'
    && (relation.actions.kind === 'all'
      || (relation.actions.kind === 'only' && sequenceToArray(relation.actions.actions).some(candidate => sameAction(candidate, input.action)))
      || (relation.actions.kind === 'except' && !sequenceToArray(relation.actions.actions).some(candidate => sameAction(candidate, input.action))))
  ));
  return Object.freeze({
    kind: 'effective_controller_action_policy' as const,
    controller: input.controller,
    action: input.action,
    middleware: effectiveMiddleware,
    authorization,
    inheritedFrom: Object.freeze([...(input.inheritedFrom ?? [])]),
    source: Object.freeze([...(input.source ?? [])]),
  });
};
