import type { RouteParameter } from './route';
import type { ResourceName, RoutePath } from './names';

/** Canonical resolved path contract consumed by route emitters. */
export interface ResolvedLaravelRoutePath {
  readonly kind: 'resolved_laravel_route_path';
  readonly path: RoutePath;
  readonly resourceName: ResourceName;
  readonly parameters: readonly RouteParameter[];
  readonly runtimePath: RoutePath;
  readonly constantKey: string;
}

/** Input is source evidence; group prefixes are already ordered outermost-to-innermost. */
export interface LaravelRoutePathResolutionInput {
  readonly kind: 'laravel_route_path_resolution_input';
  readonly declaredPath: string;
  readonly groupPrefixes: readonly string[];
}

export interface LaravelRoutePathResolutionAuthority {
  readonly kind: 'laravel_route_path_resolution_authority';
  readonly contractVersion: 1;
  readonly closed: true;
  readonly resolve: (input: LaravelRoutePathResolutionInput) => ResolvedLaravelRoutePath;
}
