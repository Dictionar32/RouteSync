import type { RequestAst } from './ast';
import type { RequestDefinition } from './request';
import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { FormRequestSource } from '../domain/request';

/** Closed upstream contract for Laravel FormRequest derivation. */
export interface LaravelFormRequestScannerInterface {
  readonly kind: 'laravel_form_request_scanner';
  readonly closed: true;
  readonly contractVersion: 3;
  readonly scan: (input: LaravelFormRequestScanInput) => Promise<LaravelFormRequestScanJudgment>;
}

export interface LaravelFormRequestScanInput {
  readonly sourceProject: SourceProjectIdentity;
}

/** Source evidence, AST, and definition remain one correlated artifact. */
export interface LaravelFormRequestScanArtifact {
  readonly kind: 'laravel_form_request_scan_artifact';
  readonly source: FormRequestSource;
  readonly ast: RequestAst;
  readonly definition: RequestDefinition;
}

export interface LaravelFormRequestScanJudgment {
  readonly kind: 'laravel_form_request_scan_judgment';
  readonly contractVersion: 3;
  /** Full source inventory remains distinct from the subset with producible AST/definition artifacts. */
  readonly sources: readonly FormRequestSource[];
  readonly requests: readonly LaravelFormRequestScanArtifact[];
}
