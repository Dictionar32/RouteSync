import type { EnumName, RouteParameterName } from './names';
import type { StringValue } from './valueObjects';
import type { Presence } from './presence';

export type RouteConstraintSyntaxMethod =
  | 'where'
  | 'whereNumber'
  | 'whereAlpha'
  | 'whereAlphaNumeric'
  | 'whereUuid'
  | 'whereUlid'
  | 'whereIn';

export type RouteConstraintSource =
  | { readonly kind: 'group' }
  | { readonly kind: 'route' };

export interface RouteConstraintArgumentVisitor<R> {
  readonly pattern: (argument: Extract<RouteConstraintArgument, { readonly kind: 'pattern' }>) => R;
  readonly values: (argument: Extract<RouteConstraintArgument, { readonly kind: 'values' }>) => R;
  readonly none: (argument: Extract<RouteConstraintArgument, { readonly kind: 'none' }>) => R;
}

export interface RouteConstraintArgumentAlgebraInterface {
  readonly match: <R>(argument: RouteConstraintArgument, visitor: RouteConstraintArgumentVisitor<R>) => R;
}

/** Exhaustive eliminator for the source-level route-constraint argument ADT. */
export const matchRouteConstraintArgument = <R>(
  argument: RouteConstraintArgument,
  visitor: RouteConstraintArgumentVisitor<R>,
): R => {
  switch (argument.kind) {
    case 'pattern':
      return visitor.pattern(argument);
    case 'values':
      return visitor.values(argument);
    case 'none':
      return visitor.none(argument);
    default: {
      const exhaustive: never = argument;
      return exhaustive;
    }
  }
};

/** Canonical interface-first operation for exhaustive route-constraint ADT elimination. */
export const routeConstraintArgumentAlgebra: RouteConstraintArgumentAlgebraInterface = Object.freeze({
  match: matchRouteConstraintArgument,
});

/** Syntax facts extracted from the AAT/AST; Laravel meaning is resolved downstream. */
export type RouteConstraintArgument =
  | { readonly kind: 'pattern'; readonly value: StringValue }
  | { readonly kind: 'values'; readonly values: readonly StringValue[] }
  | { readonly kind: 'none' };

export interface RouteConstraintFact {
  readonly parameter: RouteParameterName;
  readonly method: RouteConstraintSyntaxMethod;
  readonly argument: RouteConstraintArgument;
  readonly source: RouteConstraintSource;
}

export type RouteConstraintMatcher =
  | { readonly kind: 'regex'; readonly pattern: StringValue }
  | { readonly kind: 'number' }
  | { readonly kind: 'alpha' }
  | { readonly kind: 'alpha_numeric' }
  | { readonly kind: 'uuid' }
  | { readonly kind: 'ulid' }
  | { readonly kind: 'in'; readonly values: readonly RouteConstraintAllowedValue[] }
  | { readonly kind: 'unresolved'; readonly method: RouteConstraintSyntaxMethod; readonly reason: 'missing_value' | 'missing_values' };

export type RouteConstraintAllowedValue =
  | { readonly kind: 'literal'; readonly value: StringValue }
  | { readonly kind: 'enum_cases'; readonly enum: EnumName };

/** Fully semantic Laravel constraint contract. */
export interface RouteConstraintContract {
  readonly parameter: RouteParameterName;
  readonly matcher: RouteConstraintMatcher;
  readonly source: RouteConstraintSource;
}

export interface RouteConstraintFlow {
  readonly kind: 'route_constraint_flow';
  readonly route: readonly RouteConstraintContract[];
  readonly effective: readonly RouteConstraintContract[];
}
