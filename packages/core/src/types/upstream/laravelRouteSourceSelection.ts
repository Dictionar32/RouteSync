import type { SourceFile } from './names';

/** Closed scan intent: default project discovery and explicit file selection are distinct inputs. */
export type LaravelRouteSourceSelectionIntent =
  | Readonly<{ readonly kind: 'laravel_route_source_selection_default' }>
  | Readonly<{ readonly kind: 'laravel_route_source_selection_explicit'; readonly selection: Extract<LaravelRouteSourceSelection, { readonly kind: 'explicit_route_files' }> }>;

/** Route-source selection is scan intent, not source-project identity. */
export type LaravelRouteSourceSelection =
  | Readonly<{
      readonly kind: 'project_route_files';
    }>
  | Readonly<{
      readonly kind: 'explicit_route_files';
      readonly files: readonly SourceFile[];
    }>;

export interface LaravelRouteSourceSelectionInterface {
  readonly kind: 'laravel_route_source_selection_authority';
  readonly projectDefaults: () => LaravelRouteSourceSelection;
  readonly explicitFiles: (files: readonly SourceFile[]) => LaravelRouteSourceSelection;
}

export const laravelRouteSourceSelectionAuthority: LaravelRouteSourceSelectionInterface = Object.freeze({
  kind: 'laravel_route_source_selection_authority',
  projectDefaults: () => Object.freeze({ kind: 'project_route_files' as const }),
  explicitFiles: (files: readonly SourceFile[]) => Object.freeze({
    kind: 'explicit_route_files' as const,
    files: Object.freeze([...files]),
  }),
});
