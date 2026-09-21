/** Syntax AST for Laravel Route facade declarations. */
import type { AstIdentifier, TokenDescriptor } from "../phpAstTypes";

export type LaravelRouteMethod =
  | "get" | "post" | "put" | "patch" | "delete"
  | "options" | "head" | "match" | "any" | "apiResource";

export type RoutePathLiteralAst = string & { readonly __routePathAst: unique symbol };
export type MiddlewareNameAst = string & { readonly __middlewareAst: unique symbol };
export type RoutePrefixAst = string & { readonly __routePrefixAst: unique symbol };

export type RouteTargetAst =
  | { readonly kind: "controller_action"; readonly controller: AstIdentifier; readonly action: AstIdentifier }
  | { readonly kind: "controller_invokable"; readonly controller: AstIdentifier }
  | { readonly kind: "closure"; readonly action: AstIdentifier };

export interface RouteDeclarationAst {
  readonly method: LaravelRouteMethod;
  readonly targetMethods: readonly LaravelRouteMethod[];
  readonly path: RoutePathLiteralAst;
  readonly target: RouteTargetAst;
  readonly prefix: readonly RoutePrefixAst[];
  readonly middleware: readonly MiddlewareNameAst[];
  readonly source: TokenDescriptor;
  readonly end: TokenDescriptor;
}

export const createRoutePathLiteral = (value: string): RoutePathLiteralAst => value as RoutePathLiteralAst;
export const createMiddlewareNameAst = (value: string): MiddlewareNameAst => value as MiddlewareNameAst;
export const createRoutePrefixAst = (value: string): RoutePrefixAst => value as RoutePrefixAst;
