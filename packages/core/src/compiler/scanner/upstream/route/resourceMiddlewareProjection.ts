/**
 * Lossless Laravel resource middleware projection.
 *
 * Resource-route syntax is evidence; RouteMiddlewareContract is the canonical
 * policy projection consumed by the AST-free middleware resolver. `middleware`,
 * `middlewareFor`, and `withoutMiddlewareFor` therefore become declarations or
 * exclusions without leaking Laravel parser details downstream.
 */
import type { RouteResourceDeclarationAst, RouteResourceMiddlewareAst } from '../../lexer/routeAst/routeResourceDeclarationAst';
import { createActionName, createMiddlewareName } from '../../../../types/upstream/names';
import type { StringValue } from '../../../../types/upstream/valueObjects';
import type { RouteMiddlewareContract, RouteMiddlewareExclusionContract, RouteMiddlewareScope } from '../../../../types/upstream/routeMiddleware';
import { relationProject } from '../../../../semantic/foundation/relationalSequence';

export const routeMiddlewareReference = (raw: string) => {
  const separator = raw.indexOf(':');
  const name = separator < 0 ? raw : raw.slice(0, separator);
  const parameters = separator < 0 ? [] : raw.slice(separator + 1).split(',').filter(value => value.length > 0).map((value): StringValue => ({ kind: 'string_value', value }));
  return Object.freeze({ name: createMiddlewareName(name), parameters: Object.freeze(parameters) });
};

const scope = (value: RouteResourceMiddlewareAst): RouteMiddlewareScope =>
  value.scope.kind === 'all'
    ? { kind: 'all' }
    : value.scope.kind === 'only'
      ? { kind: 'only', actions: Object.freeze(relationProject(value.scope.actions, createActionName)) }
      : { kind: 'except', actions: Object.freeze(relationProject(value.scope.actions, createActionName)) };

const declarations = (values: readonly RouteResourceMiddlewareAst[]): readonly RouteMiddlewareContract[] =>
  Object.freeze(values.flatMap(value => value.middleware.map(raw => Object.freeze({
    middleware: routeMiddlewareReference(raw),
    source: { kind: 'resource' as const },
    scope: scope(value),
  }))));

const exclusions = (values: readonly RouteResourceMiddlewareAst[]): readonly RouteMiddlewareExclusionContract[] =>
  Object.freeze(values.flatMap(value => value.middleware.map(raw => Object.freeze({
    middleware: routeMiddlewareReference(raw),
    source: { kind: 'resource' as const },
    scope: scope(value),
  }))));

export interface RouteResourceMiddlewareProjection {
  readonly declarations: readonly RouteMiddlewareContract[];
  readonly exclusions: readonly RouteMiddlewareExclusionContract[];
}

export const projectRouteResourceMiddleware = (
  resource: RouteResourceDeclarationAst,
): RouteResourceMiddlewareProjection => Object.freeze({
  declarations: declarations(resource.middleware),
  exclusions: exclusions(resource.middlewareExclusions),
});
