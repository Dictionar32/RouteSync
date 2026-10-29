/**
 * Canonical aggregation boundary for Laravel route middleware evidence.
 * Parsers and controller/resource projections remain evidence producers.
 */
import type { ActionName, MiddlewareName } from '../../../../types/upstream/names';
import type { Presence } from '../../../../types/upstream/presence';
import type { RouteMiddlewareContract, RouteMiddlewareExclusionContract, RouteMiddlewareSemanticInput } from '../../../../types/upstream/routeMiddleware';
import { routeResourceMiddlewareOperations } from './resourceMiddlewareProjection';

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

export interface RouteMiddlewareSemanticInputOperationsInterface {
  readonly build: (
    evidence: RouteMiddlewareSemanticEvidence,
    action: Presence<ActionName>,
  ) => RouteMiddlewareSemanticInput;
  readonly names: (values: readonly string[]) => readonly MiddlewareName[];
}

const named = (name: MiddlewareName, source: 'route_group' | 'route'): RouteMiddlewareContract => Object.freeze({
  middleware: routeResourceMiddlewareOperations.reference(name.value.value),
  source: { kind: source },
  scope: { kind: 'all' as const },
});

const declarationsOf = (items: readonly MiddlewareName[] | undefined, source: 'route_group' | 'route'): readonly RouteMiddlewareContract[] =>
  Object.freeze((items ?? []).map(item => named(item, source)));

export const routeMiddlewareSemanticInputOperations: RouteMiddlewareSemanticInputOperationsInterface = Object.freeze({
  build: (
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
  }),
  names: (values: readonly string[]): readonly MiddlewareName[] =>
    Object.freeze(values.map(value => routeResourceMiddlewareOperations.reference(value).name)),
});
