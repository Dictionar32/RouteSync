import type { ResponseAst } from './ast';
import type { ResponseDefinition } from './response';
import type { ResourceDefinition } from './resource';
import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { LaravelControllerScanJudgment } from './laravelControllerScannerInterface';
import type { LaravelControllerMethodResponseAstProjectionJudgment, LaravelControllerResponseSemanticPipelineInterface } from './laravelControllerResponseSemanticJudgmentInterface';

/** Canonical response-scan input; semantic response authority is explicit. */
export interface LaravelResponseScannerInput {
  readonly sourceProject: SourceProjectIdentity;
  readonly controllerScan: LaravelControllerScanJudgment;
  readonly resourceDefinitions: readonly ResourceDefinition[];
  readonly responsePipeline: LaravelControllerResponseSemanticPipelineInterface;
}

/** Response products and the exact judgments from which projected products came. */
export interface LaravelResponseScannerResult {
  readonly definitions: readonly ResponseDefinition[];
  readonly asts: readonly ResponseAst[];
  readonly projectionJudgments: readonly LaravelControllerMethodResponseAstProjectionJudgment[];
}

/** Upstream contract for acquiring response products without reclassifying controller returns. */
export interface LaravelResponseScannerInterface {
  readonly kind: 'laravel_response_scanner';
  readonly closed: true;
  readonly contractVersion: 1;
  readonly scan: (input: LaravelResponseScannerInput) => Promise<LaravelResponseScannerResult>;
}
