/** Production composition root: parser adapter is injected into upstream semantic authorities. */
import {
  phpSourceInvocationSemanticPipelineAuthorityFactory,
  PHP_SOURCE_INVOCATION_SEMANTIC_PIPELINE_CONTRACT,
  phpFunctionInvocationSemanticJudgmentBatchClosureAuthority,
  phpFunctionNameResolutionAuthority,
  phpFunctionResolutionEnvironmentProjectionAuthority,
  phpFunctionResolutionSourceInventoryAuthority,
  phpSourceFrontendExtractionValidationAuthority,
} from '@routesync/core';
import { phpSourceInvocationSemanticPipelineDelivery } from '@routesync/core';
import type { PhpSourceDocument, PhpSourceInvocationSemanticPipelineInterface } from '@routesync/core';
import { phpSourceFrontendAstAdapter } from './sourceFrontendAstAdapter';

const phpSourceInvocationSemanticPipelineAuthority = phpSourceInvocationSemanticPipelineAuthorityFactory.create({
  frontend: phpSourceFrontendAstAdapter,
  extractionValidation: phpSourceFrontendExtractionValidationAuthority,
  sourceInventory: phpFunctionResolutionSourceInventoryAuthority,
  environmentProjection: phpFunctionResolutionEnvironmentProjectionAuthority,
  nameResolution: phpFunctionNameResolutionAuthority,
  invocationBatch: phpFunctionInvocationSemanticJudgmentBatchClosureAuthority,
});

/** Public runtime operation reuses the existing upstream pipeline contract. */
export const phpSourceInvocationSemanticPipelineOperations: PhpSourceInvocationSemanticPipelineInterface = Object.freeze({
  kind: 'php_source_invocation_semantic_pipeline',
  contract: PHP_SOURCE_INVOCATION_SEMANTIC_PIPELINE_CONTRACT,
  analyze: (document: PhpSourceDocument) => phpSourceInvocationSemanticPipelineAuthority.analyze(document),
});
