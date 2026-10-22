import type { ControllerAuthorizationRelation, ControllerPolicyRelation } from './controller';
import type { ControllerName } from './names';
import type { EffectiveControllerActionPolicy } from './effectiveControllerActionPolicy';
import type { ActionName } from './names';
import type { RouteMiddlewareReference } from './routeMiddleware';
import type { ExpressionArguments } from './expression';
import type { SourceSpan } from './provenance';
import type { EffectiveControllerActionPolicyBlockReason } from './effectiveControllerActionPolicy';

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
      readonly kind: 'controller_action_policy_blocked';
      readonly controller: ControllerName;
      readonly action: ActionName;
      readonly reasons: readonly EffectiveControllerActionPolicyBlockReason[];
      readonly source: readonly SourceSpan[];
      readonly inheritedFrom: readonly ControllerName[];
    }>
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

const provenanceForScope = (scope: ControllerAuthorizationRelation['scope'] | import('./controller').ControllerMiddlewareRelation['scope']): ControllerActionPolicyProvenance => {
  switch (scope.kind) {
    case 'method': return 'controller_method';
    case 'class': return 'controller_class';
  }
};

const middlewareRelation = (
  policy: Extract<EffectiveControllerActionPolicy, { readonly judgment: { readonly kind: 'complete' } }>,
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
  provenance: provenanceForScope(relation.scope),
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
    const provenance = provenanceForScope(relation.scope);
    switch (relation.actions.kind) {
      case 'blocked':
        relations.push({
          kind: 'controller_action_policy_blocked',
          controller,
          action,
          reasons: [relation.actions.reason],
          source: [relation.source],
          inheritedFrom,
        });
        return relations;
      case 'all':
      case 'only':
      case 'except':
      case 'only_except':
        switch (relation.kind) {
          case 'controller_middleware_relation':
            switch (relation.middleware.kind) {
              case 'middleware_name':
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
              default: return relations;
            }
          case 'controller_authorization_relation':
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
        }
    }
  }, []),
);


/** Project one closed effective policy into canonical semantic relations. */
export const controllerActionPolicyRelations = (
  policy: EffectiveControllerActionPolicy,
): readonly ControllerActionPolicyRelation[] => {
  switch (policy.judgment.kind) {
    case 'blocked':
      return Object.freeze([Object.freeze({
        kind: 'controller_action_policy_blocked' as const,
        controller: policy.controller,
        action: policy.action,
        reasons: policy.judgment.reasons,
        source: policy.source,
        inheritedFrom: policy.inheritedFrom,
      })]);
    case 'complete':
      return Object.freeze([
        ...middlewareRelation(policy),
        ...policy.authorization.map(relation => authorizationRelation(policy, relation)),
      ]);
  }
};
