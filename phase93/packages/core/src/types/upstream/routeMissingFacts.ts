/** Syntax fact extracted from route AAT/AST. */
export type RouteMissingFact =
  | { readonly kind: 'absent' }
  | { readonly kind: 'custom_handler' };
