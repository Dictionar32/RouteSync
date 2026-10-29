/**
 * Lossless Laravel resource middleware projection.
 * Resource-route syntax is evidence; RouteMiddlewareContract is the canonical
 * policy projection consumed by the AST-free middleware resolver.
 */
import type { RouteResourceDeclarationAst, RouteResourceMiddlewareAst } from '../../../frontend/php/routeAst/routeResourceDeclarationAst';
import { createActionName, createMiddlewareName } from '../../../../types/upstream/names';
import type { MiddlewareName } from '../../../../types/upstream/names';
import type { StringValue } from '../../../../types/upstream/valueObjects';
import type { RouteMiddlewareContract, RouteMiddlewareExclusionContract, RouteMiddlewareScope } from '../../../../types/upstream/routeMiddleware';

export interface RouteMiddlewareReferenceInterface {
  readonly name: MiddlewareName;
  readonly parameters: readonly StringValue[];
}

export interface RouteResourceMiddlewareProjection {
  readonly declarations: readonly RouteMiddlewareContract[];
  readonly exclusions: readonly RouteMiddlewareExclusionContract[];
}

export interface RouteResourceMiddlewareOperationsInterface {
  readonly reference: (raw: string) => RouteMiddlewareReferenceInterface;
  readonly project: (
    resource: Pick<RouteResourceDeclarationAst, 'middleware' | 'middlewareExclusions'>,
  ) => RouteResourceMiddlewareProjection;
}

const scope = (value: RouteResourceMiddlewareAst): RouteMiddlewareScope =>
  value.scope.kind === 'all'
    ? { kind: 'all' }
    : value.scope.kind === 'only'
      ? { kind: 'only', actions: Object.freeze(value.scope.actions.map(createActionName)) }
      : { kind: 'except', actions: Object.freeze(value.scope.actions.map(createActionName)) };

const declarations = (values: readonly RouteResourceMiddlewareAst[]): readonly RouteMiddlewareContract[] =>
  Object.freeze(values.flatMap(value => value.middleware.map(raw => Object.freeze({
    middleware: routeResourceMiddlewareOperations.reference(raw),
    source: { kind: 'resource' as const },
    scope: scope(value),
  }))));

const exclusions = (values: readonly RouteResourceMiddlewareAst[]): readonly RouteMiddlewareExclusionContract[] =>
  Object.freeze(values.flatMap(value => value.middleware.map(raw => Object.freeze({
    middleware: routeResourceMiddlewareOperations.reference(raw),
    source: { kind: 'resource' as const },
    scope: scope(value),
  }))));

export const routeResourceMiddlewareOperations: RouteResourceMiddlewareOperationsInterface = Object.freeze({
  reference: (raw: string): RouteMiddlewareReferenceInterface => {
    const separator = raw.indexOf(':');
    const name = separator < 0 ? raw : raw.slice(0, separator);
    const parameters = separator < 0
      ? []
      : raw.slice(separator + 1).split(',').filter(value => value.length > 0)
        .map((value): StringValue => ({ kind: 'string_value', value }));
    return Object.freeze({ name: createMiddlewareName(name), parameters: Object.freeze(parameters) });
  },
  project: (
    resource: Pick<RouteResourceDeclarationAst, 'middleware' | 'middlewareExclusions'>,
  ): RouteResourceMiddlewareProjection => Object.freeze({
    declarations: declarations(resource.middleware),
    exclusions: exclusions(resource.middlewareExclusions),
  }),
});
