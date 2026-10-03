import type { StringValue } from './valueObjects';
import type { ControllerName, DomainTypeName, MiddlewareName, RouteParameterName } from './names';
import type { Presence } from './presence';
import type { RouteConstraintArgument } from './routeConstraints';

/** Syntax facts extracted from route-group AAT/AST. Values are typed facts, not free strings. */
export interface RouteGroupConstraintFact {
  readonly parameter: RouteParameterName;
  readonly argument: RouteConstraintArgument;
}

export type RouteGroupBindingScopeFact = 'default' | 'scoped' | 'without_scoped';

export interface RouteGroupFact {
  readonly prefix: readonly StringValue[];
  readonly middleware: readonly MiddlewareName[];
  readonly namePrefix: readonly StringValue[];
  readonly controller: Presence<ControllerName>;
  readonly domain: Presence<DomainTypeName>;
  readonly bindingScope: RouteGroupBindingScopeFact;
  readonly constraints: readonly RouteGroupConstraintFact[];
}
