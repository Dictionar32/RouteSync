import type { StringValue } from './valueObjects';
import type { RouteParameterName } from './names';
import type { Presence } from './presence';

export type RouteBindingWithTrashedFact =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present' };

/** Syntax fact extracted from route AAT/AST. */
export interface RouteBindingFact {
  readonly parameter: RouteParameterName;
  readonly parent: Presence<RouteParameterName>;
  readonly customKey: Presence<StringValue>;
  readonly withTrashed: RouteBindingWithTrashedFact;
}
