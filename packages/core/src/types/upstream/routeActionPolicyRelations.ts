import type { EffectiveControllerActionPolicy } from './effectiveControllerActionPolicy';
import type { RouteMiddlewareContract } from './routeMiddleware';
import type { RouteReference, ControllerReference } from './semanticReferences';
import type { SourceSpan } from './provenance';
import type { ControllerAuthorizationRelation } from './controller';
import type { ExpressionArguments } from './expression';

export type RouteActionPolicyProvenance =
  | 'route_group'
  | 'route'
  | 'controller_class'
  | 'controller_method'
  | 'resource';

export type RouteActionPolicyRelation = Readonly<{
  readonly kind: 'route_action_middleware_policy';
  readonly route: RouteReference;
  readonly controller: ControllerReference;
  readonly middleware: RouteMiddlewareContract['middleware'];
  readonly provenance: RouteActionPolicyProvenance;
  readonly inheritedFrom: readonly import('./names').ControllerName[];
  readonly source: readonly SourceSpan[];
}> | Readonly<{
  readonly kind: 'route_action_authorization_policy';
  readonly route: RouteReference;
  readonly controller: ControllerReference;
  readonly arguments: ExpressionArguments;
  readonly provenance: Extract<RouteActionPolicyProvenance, 'controller_class' | 'controller_method'>;
  readonly inheritedFrom: readonly import('./names').ControllerName[];
  readonly source: SourceSpan;
}>;

const controllerReferenceFromPolicy = (policy: EffectiveControllerActionPolicy): ControllerReference => ({
  kind: 'controller_reference',
  name: policy.controller,
  action: policy.action,
});

export const routeActionPolicyRelationsFromEffectivePolicy = (
  route: RouteReference,
  policy: EffectiveControllerActionPolicy,
): readonly RouteActionPolicyRelation[] => Object.freeze([
  ...policy.middleware.map(entry => Object.freeze({
    kind: 'route_action_middleware_policy' as const,
    route,
    controller: controllerReferenceFromPolicy(policy),
    middleware: entry.middleware,
    provenance: entry.source.kind,
    inheritedFrom: policy.inheritedFrom,
    source: policy.source,
  })),
  ...policy.authorization.map((relation: ControllerAuthorizationRelation) => Object.freeze({
    kind: 'route_action_authorization_policy' as const,
    route,
    controller: controllerReferenceFromPolicy(policy),
    arguments: relation.arguments,
    provenance: relation.scope.kind === 'method' ? 'controller_method' as const : 'controller_class' as const,
    inheritedFrom: policy.inheritedFrom,
    source: relation.source,
  })),
]);

/**
 * Project already-canonical route middleware evidence before controller closure.
 * Kept as a compatibility/evidence lane; closed routes should use the function
 * above so route identity and controller/action closure remain explicit.
 */
export const routeActionPolicyRelations = (
  route: RouteReference,
  controller: ControllerReference,
  middleware: readonly RouteMiddlewareContract[],
  source: SourceSpan,
): readonly RouteActionPolicyRelation[] => Object.freeze(
  middleware.map(entry => Object.freeze({
    kind: 'route_action_middleware_policy' as const,
    route,
    controller,
    middleware: entry.middleware,
    provenance: entry.source.kind,
    inheritedFrom: Object.freeze([] as import('./names').ControllerName[]),
    source: [source],
  })),
);
