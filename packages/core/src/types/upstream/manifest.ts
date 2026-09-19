import type { CompleteSourceAst } from './ast';
import type { SourceFile } from './names';
import type { NumberValue } from './valueObjects';
import type { SourceSpan } from './provenance';

export type ManifestVersion = { readonly kind: 'manifest_version'; readonly major: NumberValue; readonly minor: NumberValue; readonly patch: NumberValue };
export type ManifestSource = { readonly kind: 'laravel_application'; readonly root: SourceFile; readonly source: SourceSpan };
export type RouteSyncManifest = { readonly kind: 'route_sync_manifest'; readonly version: ManifestVersion; readonly source: ManifestSource; readonly ast: CompleteSourceAst };
export type UpstreamBoundary = { readonly kind: 'validated_manifest'; readonly manifest: RouteSyncManifest };
