import type { ControllerAuthorizationRelation, ControllerPolicyRelation } from './controller';
import type { ControllerName } from './names';
import type { EffectiveControllerActionPolicy } from './effectiveControllerActionPolicy';
import type { ActionName } from './names';
import type { RouteMiddlewareReference } from './routeMiddleware';
import type { ExpressionArguments } from './expression';
import type { SourceSpan } from './provenance';

export type ControllerActionPolicyProvenance =
  | 'route_group'
  | 'route'
  | 'controller_class'
  | 'controller_method'
  | 'resource';

/**
 * Canonical semantic projection of an effective Laravel controller-action policy.
 *
 * Policy remains domain semantics here; generic SemanticDataflowFact is deliberately
 * not involved. This relation vocabulary is carried by the canonical source-model
 * relation graph; structural graph projection deliberately filters it out.
 */
export type ControllerActionPolicyRelation =
  | Readonly<{
      readonly kind: 'controller_action_middleware_policy';
      readonly controller: ControllerName;
      readonly action: ActionName;
      readonly middleware: RouteMiddlewareReference;
      readonly source: readonly SourceSpan[];
      readonly provenance: ControllerActionPolicyProvenance;
      readonly inheritedFrom: readonly ControllerName[];
    }>
  | Readonly<{
      readonly kind: 'controller_action_authorization_policy';
      readonly controller: ControllerName;
      readonly action: ActionName;
      readonly arguments: ExpressionArguments;
      readonly source: SourceSpan;
      readonly provenance: ControllerActionPolicyProvenance;
      readonly inheritedFrom: readonly ControllerName[];
    }>;

const middlewareRelation = (
  policy: EffectiveControllerActionPolicy,
): readonly ControllerActionPolicyRelation[] => Object.freeze(
  policy.middleware.map(entry => Object.freeze({
    kind: 'controller_action_middleware_policy' as const,
    controller: policy.controller,
    action: policy.action,
    middleware: entry.middleware,
    source: policy.source,
    provenance: entry.source.kind,
    inheritedFrom: policy.inheritedFrom,
  })),
);

const authorizationRelation = (
  policy: EffectiveControllerActionPolicy,
  relation: ControllerAuthorizationRelation,
): ControllerActionPolicyRelation => Object.freeze({
  kind: 'controller_action_authorization_policy' as const,
  controller: policy.controller,
  action: policy.action,
  arguments: relation.arguments,
  source: relation.source,
  provenance: relation.scope.kind === 'method' ? 'controller_method' : 'controller_class',
  inheritedFrom: policy.inheritedFrom,
});


/** Project controller-declared policy evidence carried by a canonical action. */
export const controllerActionPolicyRelationsFromEvidence = (
  controller: ControllerName,
  action: ActionName,
  policy: readonly ControllerPolicyRelation[],
  inheritedFrom: readonly ControllerName[] = [],
): readonly ControllerActionPolicyRelation[] => Object.freeze(
  policy.reduce<ControllerActionPolicyRelation[]>((relations, relation) => {
    const provenance: ControllerActionPolicyProvenance = relation.scope.kind === 'method'
      ? 'controller_method'
      : 'controller_class';
    if (relation.kind === 'controller_middleware_relation') {
      if (relation.middleware.kind !== 'middleware_name') return relations;
      relations.push({
        kind: 'controller_action_middleware_policy',
        controller,
        action,
        middleware: { name: relation.middleware, parameters: [] },
        source: [relation.source],
        provenance,
        inheritedFrom,
      });
      return relations;
    }
    relations.push({
      kind: 'controller_action_authorization_policy',
      controller,
      action,
      arguments: relation.arguments,
      source: relation.source,
      provenance,
      inheritedFrom,
    });
    return relations;
  }, []),
);


/** Project one closed effective policy into canonical semantic relations. */
export const controllerActionPolicyRelations = (
  policy: EffectiveControllerActionPolicy,
): readonly ControllerActionPolicyRelation[] => Object.freeze([
  ...middlewareRelation(policy),
  ...policy.authorization.map(relation => authorizationRelation(policy, relation)),
]);
