/**
 * AST-free Laravel route middleware semantic resolver.
 *
 * Authority boundary:
 * - receives canonical middleware declarations/exclusions only;
 * - evaluates only/except against an explicit concrete action;
 * - applies middleware exclusions by middleware identity;
 * - never claims runtime middleware execution order.
 */
import type { RouteMiddlewareContract, RouteMiddlewareExclusionContract, RouteMiddlewareFlow, RouteMiddlewareScope, RouteMiddlewareSemanticInput } from '../../types/upstream/routeMiddleware';
import type { ActionName } from '../../types/upstream/names';
import type { ControllerPolicyActionScopeBlockReason } from '../../types/upstream/controller';
import type { Presence } from '../../types/upstream/presence';
import { routeMiddlewareIdentityAuthority, routeMiddlewareScopeApplicabilityAuthority } from '../scanner/semantic/route/routeMiddlewareKnowledgeCatalog';

const blockedScopeReasons = (scope: RouteMiddlewareScope): readonly ControllerPolicyActionScopeBlockReason[] => {
  switch (scope.kind) {
    case 'blocked': return [scope.reason];
    case 'all':
    case 'only':
    case 'except':
    case 'only_except': return [];
  }
};

/** Runtime contract for semantic middleware applicability and exclusion resolution. */
export interface RouteMiddlewareFlowResolverInterface {
  readonly kind: 'route_middleware_flow_resolver';
  readonly contractVersion: 1;
  readonly resolve: (input: RouteMiddlewareSemanticInput) => RouteMiddlewareFlow;
}

/** Resolve declared middleware into the concrete action's effective middleware set. */
export const routeMiddlewareFlowResolver: RouteMiddlewareFlowResolverInterface = Object.freeze({
  kind: 'route_middleware_flow_resolver',
  contractVersion: 1,
  resolve: (input: RouteMiddlewareSemanticInput): RouteMiddlewareFlow => {
  const blockedScopes = Object.freeze([
    ...input.declarations.flatMap(declaration => blockedScopeReasons(declaration.scope)),
    ...input.exclusions.flatMap(exclusion => blockedScopeReasons(exclusion.scope)),
  ]);
  const effectiveMiddleware = input.declarations.flatMap(declaration =>
    routeMiddlewareScopeApplicabilityAuthority.classify(declaration.scope, input.action).continueWith({
      onNotApplicable: () => [],
      onApplicable: () => {
        const declarationIdentity = routeMiddlewareIdentityAuthority.identify(declaration.middleware);
        const applicableExclusions = input.exclusions.flatMap(exclusion =>
          routeMiddlewareIdentityAuthority.compare(
            declarationIdentity,
            routeMiddlewareIdentityAuthority.identify(exclusion.middleware),
          ).continueWith({
            onSameIdentity: () => routeMiddlewareScopeApplicabilityAuthority.classify(exclusion.scope, input.action).continueWith({
              onApplicable: () => [exclusion],
              onNotApplicable: () => [],
            }),
            onDifferentIdentity: () => [],
          }),
        );
        switch (applicableExclusions.length) {
          case 0: return [declaration];
          default: return [];
        }
      },
    }),
  );
  const judgment = (() => {
    switch (blockedScopes.length) {
      case 0: return Object.freeze({ kind: 'complete' as const });
      default: return Object.freeze({ kind: 'blocked' as const, reasons: blockedScopes });
    }
  })();
  return Object.freeze({
    kind: 'route_middleware_flow' as const,
    judgment,
    middleware: Object.freeze([...input.declarations]),
    exclusions: Object.freeze([...input.exclusions]),
    effectiveMiddleware: Object.freeze(effectiveMiddleware),
  });
  },
});
