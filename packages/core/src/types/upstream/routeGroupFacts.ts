import type { ControllerName, DomainTypeName, MiddlewareName, RouteParameterName } from './names';
import type { Presence } from './presence';
import type { RouteConstraintArgument, RouteConstraintSyntaxMethod } from './routeConstraints';
import type { StringValue } from './valueObjects';

/** Group constraint evidence is the canonical upstream route-constraint fact with group provenance. */
export type RouteGroupConstraintFact = {
  readonly parameter: RouteParameterName;
  readonly method: RouteConstraintSyntaxMethod;
  readonly argument: RouteConstraintArgument;
  readonly source: { readonly kind: 'group' };
};

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
