import type { ProviderAst } from './ast';
import type { ProviderDefinition } from './application';
import type { SourceProjectIdentity } from './highLevelSourceModel';

/** Provider AST and semantic definition remain bound to the same producer result. */
export interface LaravelProviderScanArtifact {
  readonly kind: 'laravel_provider_scan_artifact';
  readonly ast: ProviderAst;
  readonly definition: ProviderDefinition;
}

export interface LaravelProviderScanJudgment {
  readonly kind: 'laravel_provider_scan_judgment';
  readonly closed: true;
  readonly contractVersion: 1;
  readonly artifacts: readonly LaravelProviderScanArtifact[];
}

export interface LaravelProviderScannerInterface {
  readonly kind: 'laravel_provider_scanner';
  readonly closed: true;
  readonly contractVersion: 1;
  readonly scan: (sourceProject: SourceProjectIdentity) => Promise<LaravelProviderScanJudgment>;
}
