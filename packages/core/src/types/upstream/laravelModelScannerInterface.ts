import type { ModelAst } from './ast';
import type { ModelDefinition } from './model';
import type { SchemaInterface } from './schema';
import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { ControllerStaticCallModelClassIdentity } from './controllerStaticCallOriginInterface';

/** Closed upstream contract for Laravel Eloquent model acquisition. */
export interface LaravelModelScannerInterface {
  readonly kind: 'laravel_model_scanner';
  readonly closed: true;
  readonly contractVersion: 3;
  readonly scan: (input: LaravelModelScanInput) => Promise<LaravelModelScanJudgment>;
}

export interface LaravelModelScanInput {
  readonly sourceProject: SourceProjectIdentity;
  readonly schema: SchemaInterface;
}

/** AST and canonical definition are paired for the same model source subject. */
export interface LaravelModelScanArtifact {
  readonly kind: 'laravel_model_scan_artifact';
  readonly ast: ModelAst;
  readonly definition: ModelDefinition;
  /** Exact PHP class identity derived from the same declaration as this model. */
  readonly classIdentity: ControllerStaticCallModelClassIdentity;
}

export interface LaravelModelScanJudgment {
  readonly kind: 'laravel_model_scan_judgment';
  readonly contractVersion: 3;
  readonly models: readonly LaravelModelScanArtifact[];
}
