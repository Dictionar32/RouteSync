/** Production composition root: parser adapter is injected into upstream semantic authorities. */
import {
  createPhpSourceInvocationSemanticPipelineAuthority,
  phpFunctionInvocationSemanticJudgmentBatchClosureAuthority,
  phpFunctionNameResolutionAuthority,
  phpFunctionResolutionEnvironmentProjectionAuthority,
  phpFunctionResolutionSourceInventoryAuthority,
  phpSourceFrontendExtractionValidationAuthority,
} from '@routesync/core';
import { phpSourceInvocationSemanticPipelineDelivery } from '@routesync/core';
import type { PhpSourceDocument, PhpSourceInvocationSemanticPipelineResult, PhpSourceInvocationSemanticPipelineDeliveryBatch } from '@routesync/core';
import { phpSourceFrontendAstAdapter } from './sourceFrontendAstAdapter';

export const phpSourceInvocationSemanticPipeline = createPhpSourceInvocationSemanticPipelineAuthority({
  frontend: phpSourceFrontendAstAdapter,
  extractionValidation: phpSourceFrontendExtractionValidationAuthority,
  sourceInventory: phpFunctionResolutionSourceInventoryAuthority,
  environmentProjection: phpFunctionResolutionEnvironmentProjectionAuthority,
  nameResolution: phpFunctionNameResolutionAuthority,
  invocationBatch: phpFunctionInvocationSemanticJudgmentBatchClosureAuthority,
});

export interface PhpSourceInvocationSemanticPipelineOperationsInterface {
  readonly analyze: (
    document: PhpSourceDocument,
  ) => PhpSourceInvocationSemanticPipelineResult;
  readonly analyzeBatch: (
    documents: readonly PhpSourceDocument[],
  ) => PhpSourceInvocationSemanticPipelineDeliveryBatch;
}

/** Public runtime operations are grouped behind one explicit interface object. */
export const phpSourceInvocationSemanticPipelineOperations: PhpSourceInvocationSemanticPipelineOperationsInterface = Object.freeze({
  analyze: (
    document: PhpSourceDocument,
  ): PhpSourceInvocationSemanticPipelineResult => phpSourceInvocationSemanticPipeline.analyze(document),
  analyzeBatch: (
    documents: readonly PhpSourceDocument[],
  ): PhpSourceInvocationSemanticPipelineDeliveryBatch => phpSourceInvocationSemanticPipelineDelivery.deliver(
    Object.freeze(documents.map(document => phpSourceInvocationSemanticPipeline.analyze(document))),
  ),
});
