import type { EffectiveControllerActionPolicy } from './effectiveControllerActionPolicy';
import type { EffectiveControllerActionPolicyCatalogEntry, EffectiveControllerActionPolicyUpstreamInput } from './effectiveControllerActionPolicy';
import { effectiveControllerActionPolicyAlgebra } from './effectiveControllerActionPolicyAlgebra';

const sameController = (left: import('./names').ControllerName, right: import('./names').ControllerName): boolean =>
  Object.is(left.value.value, right.value.value);

const samePolicySource = (
  left: import('./controller').ControllerPolicyRelation,
  right: import('./controller').ControllerPolicyRelation,
): boolean => {
  const sameSpan = left.source.file.value.value === right.source.file.value.value
    && left.source.start.value === right.source.start.value
    && left.source.end.value === right.source.end.value;
  if (!sameSpan || left.kind !== right.kind) return false;
  switch (left.kind) {
    case 'controller_authorization_relation':
      return right.kind === 'controller_authorization_relation';
    case 'controller_middleware_relation':
      return right.kind === 'controller_middleware_relation'
        && left.exclusion === right.exclusion
        && left.middleware.kind === right.middleware.kind
        && (left.middleware.kind !== 'middleware_name'
          || (right.middleware.kind === 'middleware_name'
            && left.middleware.value.value === right.middleware.value.value));
  }
};

const policyForController = (
  controller: import('./names').ControllerName,
  catalog: readonly EffectiveControllerActionPolicyCatalogEntry[],
): readonly import('./controller').ControllerPolicyRelation[] => catalog
  .filter(entry => sameController(entry.controller, controller))
  .flatMap(entry => entry.relations)
  .filter((relation, index, relations) => relations.findIndex(candidate => samePolicySource(candidate, relation)) === index);

const missingInheritedControllers = (
  input: EffectiveControllerActionPolicyUpstreamInput,
  catalog: readonly EffectiveControllerActionPolicyCatalogEntry[],
  unavailable: readonly import('./names').ControllerName[],
): readonly import('./names').ControllerName[] => input.inheritedFrom.filter(controller =>
  catalog.every(entry => !sameController(entry.controller, controller))
    || unavailable.some(candidate => sameController(candidate, controller)),
);

/**
 * Upstream closure for one concrete controller action. The resolver is an
 * orchestrator only; scope, exclusion, middleware, and authorization reasoning
 * are owned by the canonical algebra.
 */
export const resolveEffectiveControllerActionPolicyUpstream = (
  input: EffectiveControllerActionPolicyUpstreamInput,
): EffectiveControllerActionPolicy => {
  const catalog = input.policyCatalog;
  const unavailableControllers = catalog.kind === 'blocked' ? catalog.reason.controllers : Object.freeze([]);
  const missingControllers = Object.freeze(missingInheritedControllers(input, catalog.entries, unavailableControllers));
  const inheritedPolicy = missingControllers.length === 0
    ? input.inheritedFrom
      .flatMap(controller => policyForController(controller, catalog.entries))
      .filter(relation => relation.scope.kind === 'class')
    : Object.freeze([]);
  const completePolicy = Object.freeze([...inheritedPolicy, ...input.policy]);
  const controllerPolicy = effectiveControllerActionPolicyAlgebra.controllerMiddleware(completePolicy);
  const declarations = Object.freeze([...input.middleware.declarations, ...controllerPolicy.declarations]);
  const exclusions = Object.freeze([...input.middleware.exclusions, ...controllerPolicy.exclusions]);
  const blockedReasons = Object.freeze([
    ...(missingControllers.length > 0 ? [Object.freeze({ kind: 'controller_policy_inventory_unavailable' as const, controllers: missingControllers })] : []),
    ...completePolicy.flatMap(relation => relation.actions.kind === 'blocked' ? [relation.actions.reason] : []),
    ...input.middleware.declarations.flatMap(declaration => declaration.scope.kind === 'blocked' ? [declaration.scope.reason] : []),
    ...input.middleware.exclusions.flatMap(exclusion => exclusion.scope.kind === 'blocked' ? [exclusion.scope.reason] : []),
  ]);
  const judgment = (() => {
    switch (blockedReasons.length) {
      case 0: return Object.freeze({ kind: 'complete' as const });
      default: return Object.freeze({ kind: 'blocked' as const, reasons: blockedReasons });
    }
  })();
  const identity = Object.freeze({
    kind: 'effective_controller_action_policy' as const,
    controller: input.controller,
    action: input.action,
    inheritedFrom: Object.freeze([...input.inheritedFrom]),
    source: Object.freeze([...input.source]),
  });
  switch (judgment.kind) {
    case 'blocked':
      return Object.freeze({ ...identity, judgment });
    case 'complete':
      return Object.freeze({
        ...identity,
        judgment,
        middleware: effectiveControllerActionPolicyAlgebra.effectiveMiddleware(declarations, exclusions, input.action),
        authorization: effectiveControllerActionPolicyAlgebra.authorization(completePolicy, input.action),
      });
  }
};

/** Existing upstream authority: one canonical semantic decision boundary. */
export const effectiveControllerActionPolicySemanticAuthority: import('./effectiveControllerActionPolicy').EffectiveControllerActionPolicySemanticAuthorityInterface = Object.freeze({
  kind: 'effective_controller_action_policy_semantic_authority',
  closed: true,
  contractVersion: 4,
  judge: resolveEffectiveControllerActionPolicyUpstream,
});

