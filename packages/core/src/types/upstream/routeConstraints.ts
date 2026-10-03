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
