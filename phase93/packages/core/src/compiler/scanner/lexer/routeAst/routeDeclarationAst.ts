/** Syntax AST for Laravel Route facade declarations. */
import type { AstIdentifier, TokenDescriptor, PhpAstValue } from "../phpAstTypes";
import type { RouteBindingDeclarationAst } from "./routeBindingDeclarationAst";

export type LaravelRouteMethod =
  | "get" | "post" | "put" | "patch" | "delete"
  | "options" | "head" | "match" | "any" | "apiResource";

export type RoutePathLiteralAst = string & { readonly __routePathAst: unique symbol };
export type MiddlewareNameAst = string & { readonly __middlewareAst: unique symbol };
export type RoutePrefixAst = string & { readonly __routePrefixAst: unique symbol };
export type RouteNamePrefixAst = string & { readonly __routeNamePrefixAst: unique symbol };
export type RouteControllerAst = string & { readonly __routeControllerAst: unique symbol };
export type RouteDomainAst = string & { readonly __routeDomainAst: unique symbol };
export type RouteConstraintParameterAst = string & { readonly __routeConstraintParameterAst: unique symbol };
export type RouteConstraintValueAst = string & { readonly __routeConstraintValueAst: unique symbol };
export type RouteConstraintMethodAst =
  | 'where'
  | 'whereNumber'
  | 'whereAlpha'
  | 'whereAlphaNumeric'
  | 'whereUuid'
  | 'whereUlid'
  | 'whereIn';

export type RouteTargetAst =
  | { readonly kind: "controller_action"; readonly controller: AstIdentifier; readonly action: AstIdentifier }
  | { readonly kind: "controller_invokable"; readonly controller: AstIdentifier }
  | { readonly kind: "closure"; readonly action: AstIdentifier; readonly returns: readonly PhpAstValue[] };

export interface RouteDeclarationAst {
  readonly method: LaravelRouteMethod;
  readonly targetMethods: readonly LaravelRouteMethod[];
  readonly path: RoutePathLiteralAst;
  readonly target: RouteTargetAst;
  /** Route URI binding syntax, including Laravel {parameter:key} custom keys. */
  readonly bindings: readonly RouteBindingDeclarationAst[];
  readonly prefix: readonly RoutePrefixAst[];
  readonly middleware: readonly MiddlewareNameAst[];
  /** Middleware declared directly on the route, distinct from inherited group middleware. */
  readonly routeMiddleware: readonly MiddlewareNameAst[];
  /** Semantic group attributes captured upstream from Laravel fluent group syntax. */
  readonly groupNamePrefix: readonly RouteNamePrefixAst[];
  readonly groupController: RouteControllerAst | undefined;
  readonly groupDomain: RouteDomainAst | undefined;
  readonly groupBindingScope: 'default' | 'scoped' | 'without_scoped';
  /** Whether the route declares Laravel's missing() customization. */
  readonly missingHandler: boolean;
  /** Whether Laravel implicit model binding should include soft-deleted models via withTrashed(). */
  readonly withTrashed: boolean;
  /** Constraints declared directly on this route via where()/constraint helpers. */
  readonly routeConstraints: readonly {
    readonly method: RouteConstraintMethodAst;
    readonly parameter: RouteConstraintParameterAst;
    readonly value: RouteConstraintValueAst | undefined;
    readonly values?: readonly RouteConstraintValueAst[];
  }[];
  readonly groupConstraints: readonly {
    readonly method: RouteConstraintMethodAst;
    readonly parameter: RouteConstraintParameterAst;
    readonly value: RouteConstraintValueAst | undefined;
    readonly values?: readonly RouteConstraintValueAst[];
  }[];
  readonly source: TokenDescriptor;
  readonly end: TokenDescriptor;
}

export const createRoutePathLiteral = (value: string): RoutePathLiteralAst => value as RoutePathLiteralAst;
export const createMiddlewareNameAst = (value: string): MiddlewareNameAst => value as MiddlewareNameAst;
export const createRoutePrefixAst = (value: string): RoutePrefixAst => value as RoutePrefixAst;
export const createRouteNamePrefixAst = (value: string): RouteNamePrefixAst => value as RouteNamePrefixAst;
export const createRouteControllerAst = (value: string): RouteControllerAst => value as RouteControllerAst;
export const createRouteDomainAst = (value: string): RouteDomainAst => value as RouteDomainAst;
export const createRouteConstraintParameterAst = (value: string): RouteConstraintParameterAst => value as RouteConstraintParameterAst;
export const createRouteConstraintValueAst = (value: string): RouteConstraintValueAst => value as RouteConstraintValueAst;
