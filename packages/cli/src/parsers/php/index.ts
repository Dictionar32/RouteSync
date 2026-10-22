/**
 * index.ts
 *
 * Sub-domain exports for PHP code parsing.
 *
 * @module cli/parsers/php
 */

export { phpNodeSourceSliceOperation, type PhpNodeSourceSliceOperationInterface } from './sourceSlice';
export { phpAstNodeMappingOperation, type PhpAstNodeMappingOperationInterface } from './nodeMapper';
export { phpExpressionParsingOperation, type PhpExpressionParsingOperationInterface } from './expressionParser';

export { phpSourceFrontendAstAdapter } from './sourceFrontendAstAdapter';
export { phpSourceInvocationSemanticPipeline, phpSourceInvocationSemanticPipelineOperations } from './sourceInvocationPipeline';
export type { PhpSourceInvocationSemanticPipelineOperationsInterface } from './sourceInvocationPipeline';

export { controllerInvocationManifestBuilder } from './controllerInvocationManifestComposition';
export { CONTROLLER_INVOCATION_MANIFEST_COMPOSITION_REASONING_CONTRACT, controllerInvocationManifestCompositionAuthority, controllerInvocationManifestCompositionAuthorityFactory } from './controllerInvocationManifestComposition';
export type {
  ControllerInvocationManifestCompositionAuthorityInterface,
  ControllerInvocationManifestCompositionAuthorityFactoryInterface,
  ControllerInvocationManifestBuilderInterface,
  ControllerInvocationManifestCompositionInput,
  ControllerInvocationManifestCompositionReasoningContract,
  ControllerInvocationManifestInventoryRejectedJudgment,
  ControllerInvocationManifestSourceDiscoveryBlockedJudgment,
} from './controllerInvocationManifestCompositionInterface';
