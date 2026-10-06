/**
 * Canonical aggregation boundary for Laravel route middleware evidence.
 *
 * Parsers and controller/resource projections remain evidence producers. This
 * builder is deliberately AST-free and only concatenates canonical contracts;
 * applicability and exclusion semantics stay in resolveRouteMiddlewareFlow().
 */
import type { ActionName, MiddlewareName } from '../../../../types/upstream/names';
import type { Presence } from '../../../../types/upstream/presence';
import type { RouteMiddlewareContract, RouteMiddlewareExclusionContract, RouteMiddlewareSemanticInput } from '../../../../types/upstream/routeMiddleware';
import { routeMiddlewareReference } from './resourceMiddlewareProjection';

export interface RouteMiddlewareSemanticEvidence {
  readonly routeGroup?: readonly MiddlewareName[];
  readonly route?: readonly MiddlewareName[];
  readonly resource?: {
    readonly declarations: readonly RouteMiddlewareContract[];
    readonly exclusions: readonly RouteMiddlewareExclusionContract[];
  };
  readonly controller?: {
    readonly declarations: readonly RouteMiddlewareContract[];
    readonly exclusions: readonly RouteMiddlewareExclusionContract[];
  };
}

const named = (name: MiddlewareName, source: 'route_group' | 'route'): RouteMiddlewareContract => Object.freeze({
  middleware: routeMiddlewareReference(name.value.value),
  source: { kind: source },
  scope: { kind: 'all' as const },
});

const declarationsOf = (items: readonly MiddlewareName[] | undefined, source: 'route_group' | 'route'): readonly RouteMiddlewareContract[] =>
  Object.freeze((items ?? []).map(item => named(item, source)));

/** Build one canonical input from all already-resolved middleware evidence. */
export const buildRouteMiddlewareSemanticInput = (
  evidence: RouteMiddlewareSemanticEvidence,
  action: Presence<ActionName>,
): RouteMiddlewareSemanticInput => Object.freeze({
  declarations: Object.freeze([
    ...declarationsOf(evidence.routeGroup, 'route_group'),
    ...declarationsOf(evidence.route, 'route'),
    ...(evidence.resource?.declarations ?? []),
    ...(evidence.controller?.declarations ?? []),
  ]),
  exclusions: Object.freeze([
    ...(evidence.resource?.exclusions ?? []),
    ...(evidence.controller?.exclusions ?? []),
  ]),
  action,
});

/** Convenience projection for route syntax that has already resolved to names. */
export const middlewareNames = (values: readonly string[]): readonly MiddlewareName[] =>
  Object.freeze(values.map(value => routeMiddlewareReference(value).name));
