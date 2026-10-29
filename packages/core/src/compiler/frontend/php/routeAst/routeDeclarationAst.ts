/** Syntax AST for Laravel Route facade declarations. */
import type { AstIdentifier, TokenDescriptor, PhpAstValue } from "../phpAstTypes";
import type { RouteBindingDeclarationAst } from "./routeBindingDeclarationAst";
import type { RouteResourceMiddlewareAst } from "./routeResourceDeclarationAst";
import type { LaravelRouteMethod, LaravelRouteTargetMethod } from "../../../../types/upstream/laravelRouteScannerInterface";

export type { LaravelRouteMethod, LaravelRouteTargetMethod } from "../../../../types/upstream/laravelRouteScannerInterface";

export type RoutePathLiteralAst = string & { readonly __routePathAst: unique symbol };
export type MiddlewareNameAst = string & { readonly __middlewareAst: unique symbol };
export type RoutePrefixAst = string & { readonly __routePrefixAst: unique symbol };
export type RouteNamePrefixAst = string & { readonly __routeNamePrefixAst: unique symbol };
export type RouteControllerAst = string & { readonly __routeControllerAst: unique symbol };
export type RouteDomainAst = string & { readonly __routeDomainAst: unique symbol };
export type RouteConstraintParameterAst = string & { readonly __routeConstraintParameterAst: unique symbol };
export type RouteConstraintValueAst = string & { readonly __routeConstraintValueAst: unique symbol };

export type RouteConstraintArgumentAst =
  | { readonly kind: 'pattern'; readonly value: RouteConstraintValueAst }
  | { readonly kind: 'values'; readonly values: readonly RouteConstraintValueAst[] }
  | { readonly kind: 'none' };
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
  | { readonly kind: "closure"; readonly action: AstIdentifier; readonly returns: readonly PhpAstValue[] }
  | { readonly kind: "unsupported"; readonly reason: string };

export interface RouteDeclarationAst {
  readonly method: LaravelRouteMethod;
  readonly targetMethods: readonly LaravelRouteTargetMethod[];
  readonly path: RoutePathLiteralAst;
  readonly target: RouteTargetAst;
  /** Route URI binding syntax, including Laravel {parameter:key} custom keys. */
  readonly bindings: readonly RouteBindingDeclarationAst[];
  readonly prefix: readonly RoutePrefixAst[];
  readonly middleware: readonly MiddlewareNameAst[];
  /** Middleware declared directly on the route, distinct from inherited group middleware. */
  readonly routeMiddleware: readonly MiddlewareNameAst[];
  /** Resource middleware declarations/exclusions discovered on resource fluent chains. */
  readonly resourceMiddleware: readonly RouteResourceMiddlewareAst[];
  readonly resourceMiddlewareExclusions: readonly RouteResourceMiddlewareAst[];
  /** Semantic group attributes captured upstream from Laravel fluent group syntax. */
  readonly groupNamePrefix: readonly RouteNamePrefixAst[];
  readonly groupController?: RouteControllerAst;
  readonly groupDomain?: RouteDomainAst;
  readonly groupBindingScope: 'default' | 'scoped' | 'without_scoped';
  /** Whether the route declares Laravel's missing() customization. */
  readonly missingHandler: boolean;
  /** Whether Laravel implicit model binding should include soft-deleted models via withTrashed(). */
  readonly withTrashed: boolean;
  /** Resource action-selection and capability modifiers preserved before upstream resolution. */
  readonly resourceActionFilter?: { readonly kind: 'only' | 'except'; readonly actions: readonly string[] };
  readonly resourceShallow: boolean;
  readonly resourceScoped: boolean;
  readonly resourceCreatable: boolean;
  readonly resourceDestroyable: boolean;
  /** Constraints declared directly on this route via where()/constraint helpers. */
  readonly routeConstraints: readonly {
    readonly method: RouteConstraintMethodAst;
    readonly parameter: RouteConstraintParameterAst;
    readonly argument: RouteConstraintArgumentAst;
  }[];
  readonly groupConstraints: readonly {
    readonly method: RouteConstraintMethodAst;
    readonly parameter: RouteConstraintParameterAst;
    readonly argument: RouteConstraintArgumentAst;
  }[];
  readonly source: TokenDescriptor;
  readonly end: TokenDescriptor;
}

export interface RoutePathLiteralAstFactoryInterface { readonly create: (value: string) => RoutePathLiteralAst; }
export interface MiddlewareNameAstFactoryInterface { readonly create: (value: string) => MiddlewareNameAst; }
export interface RoutePrefixAstFactoryInterface { readonly create: (value: string) => RoutePrefixAst; }
export interface RouteNamePrefixAstFactoryInterface { readonly create: (value: string) => RouteNamePrefixAst; }
export interface RouteControllerAstFactoryInterface { readonly create: (value: string) => RouteControllerAst; }
export interface RouteDomainAstFactoryInterface { readonly create: (value: string) => RouteDomainAst; }
export interface RouteConstraintParameterAstFactoryInterface { readonly create: (value: string) => RouteConstraintParameterAst; }
export interface RouteConstraintValueAstFactoryInterface { readonly create: (value: string) => RouteConstraintValueAst; }
export interface RouteConstraintArgumentAstFactoryInterface {
  readonly pattern: (value: RouteConstraintValueAst) => RouteConstraintArgumentAst;
  readonly values: (values: readonly RouteConstraintValueAst[]) => RouteConstraintArgumentAst;
  readonly none: () => RouteConstraintArgumentAst;
}

export const routePathLiteralAstFactory: RoutePathLiteralAstFactoryInterface = Object.freeze({ create: (value: string) => value as RoutePathLiteralAst });
export const middlewareNameAstFactory: MiddlewareNameAstFactoryInterface = Object.freeze({ create: (value: string) => value as MiddlewareNameAst });
export const routePrefixAstFactory: RoutePrefixAstFactoryInterface = Object.freeze({ create: (value: string) => value as RoutePrefixAst });
export const routeNamePrefixAstFactory: RouteNamePrefixAstFactoryInterface = Object.freeze({ create: (value: string) => value as RouteNamePrefixAst });
export const routeControllerAstFactory: RouteControllerAstFactoryInterface = Object.freeze({ create: (value: string) => value as RouteControllerAst });
export const routeDomainAstFactory: RouteDomainAstFactoryInterface = Object.freeze({ create: (value: string) => value as RouteDomainAst });
export const routeConstraintParameterAstFactory: RouteConstraintParameterAstFactoryInterface = Object.freeze({ create: (value: string) => value as RouteConstraintParameterAst });
export const routeConstraintValueAstFactory: RouteConstraintValueAstFactoryInterface = Object.freeze({ create: (value: string) => value as RouteConstraintValueAst });
export const routeConstraintArgumentAstFactory: RouteConstraintArgumentAstFactoryInterface = Object.freeze({
  pattern: (value: RouteConstraintValueAst) => Object.freeze({ kind: 'pattern' as const, value }),
  values: (values: readonly RouteConstraintValueAst[]) => Object.freeze({ kind: 'values' as const, values: Object.freeze([...values]) }),
  none: () => Object.freeze({ kind: 'none' as const }),
});
