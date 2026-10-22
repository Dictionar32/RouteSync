import type { ServiceAst } from './ast';
import type { ServiceDefinition } from './service';
import type { ModelAst } from './ast';
import type { SourceProjectIdentity } from './highLevelSourceModel';

/** One source-correlated service result; AST and definition cannot be re-paired downstream. */
export interface LaravelServiceScanArtifact {
  readonly kind: 'laravel_service_scan_artifact';
  readonly ast: ServiceAst;
  readonly definition: ServiceDefinition;
}

export interface LaravelServiceScanJudgment {
  readonly kind: 'laravel_service_scan_judgment';
  readonly closed: true;
  readonly contractVersion: 1;
  readonly artifacts: readonly LaravelServiceScanArtifact[];
}

/** Upstream contract for source-backed service acquisition with model evidence. */
export interface LaravelServiceScannerInterface {
  readonly kind: 'laravel_service_scanner';
  readonly closed: true;
  readonly contractVersion: 1;
  readonly scan: (input: Readonly<{
    readonly sourceProject: SourceProjectIdentity;
    readonly models: readonly ModelAst[];
  }>) => Promise<LaravelServiceScanJudgment>;
}
