import type { TokenDescriptor } from '../phpAstTypes';

export type RouteResourceMethodAst = 'resource' | 'apiResource' | 'singleton' | 'apiSingleton';
export type RouteResourceNameAst = string & { readonly __routeResourceNameAst: unique symbol };
export type RouteResourceControllerAst = string & { readonly __routeResourceControllerAst: unique symbol };
export type RouteResourceActionAst = string & { readonly __routeResourceActionAst: unique symbol };
export type RouteResourceRouteNameAst = string & { readonly __routeResourceRouteNameAst: unique symbol };
export type RouteResourceParameterAst = string & { readonly __routeResourceParameterAst: unique symbol };
export interface RouteResourceMiddlewareAst {
  readonly middleware: readonly string[];
  readonly scope: { readonly kind: 'all' | 'only' | 'except'; readonly actions: readonly string[] };
}

export interface RouteResourceDeclarationAst {
  readonly method: RouteResourceMethodAst;
  readonly resource: RouteResourceNameAst;
  readonly controller: RouteResourceControllerAst;
  readonly withTrashed: readonly RouteResourceActionAst[] | undefined;
  readonly actionFilter: { readonly kind: 'only' | 'except'; readonly actions: readonly RouteResourceActionAst[] } | undefined;
  readonly names: { readonly names: readonly { readonly action: RouteResourceActionAst; readonly name: RouteResourceRouteNameAst }[] } | undefined;
  readonly parameters: { readonly parameters: readonly { readonly resource: RouteResourceNameAst; readonly parameter: RouteResourceParameterAst }[] } | undefined;
  readonly shallow: boolean;
  readonly scoped: { readonly parameters: readonly { readonly parameter: RouteResourceParameterAst; readonly key: RouteResourceParameterAst }[] } | undefined;
  readonly creatable: boolean;
  readonly destroyable: boolean;
  readonly middleware: readonly RouteResourceMiddlewareAst[];
  readonly middlewareExclusions: readonly RouteResourceMiddlewareAst[];
  readonly source: TokenDescriptor;
}

export const createRouteResourceNameAst = (value: string): RouteResourceNameAst => value as RouteResourceNameAst;
export const createRouteResourceControllerAst = (value: string): RouteResourceControllerAst => value as RouteResourceControllerAst;
export const createRouteResourceActionAst = (value: string): RouteResourceActionAst => value as RouteResourceActionAst;
export const createRouteResourceRouteNameAst = (value: string): RouteResourceRouteNameAst => value as RouteResourceRouteNameAst;
export const createRouteResourceParameterAst = (value: string): RouteResourceParameterAst => value as RouteResourceParameterAst;
