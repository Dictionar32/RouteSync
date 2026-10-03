/** Semantic behavior when Laravel implicit route model binding cannot find a model. */
export type RouteMissingBehavior =
  | { readonly kind: 'default_404' }
  | { readonly kind: 'custom_handler' };

export interface RouteMissingBehaviorFlow {
  readonly kind: 'route_missing_behavior_flow';
  readonly behavior: RouteMissingBehavior;
}
