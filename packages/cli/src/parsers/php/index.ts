export { phpAstBoundaryOperations, type PhpAstBoundaryOperationsInterface, type PhpAstBoundaryJudgment, type PhpAstBoundaryJudgmentHandlers, type PhpAstBoundaryFact, type PhpAstBoundaryRelation } from './astBoundarySemanticInterface';
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
export { phpSourceInvocationSemanticPipelineOperations } from './sourceInvocationPipeline';

export { controllerInvocationManifestBuilder, controllerInvocationManifestTerminalOperationsFactory } from './controllerInvocationManifestComposition';
export { controllerInvocationManifestCompositionAuthority, controllerInvocationManifestCompositionAuthorityFactory } from './controllerInvocationManifestComposition';
export type {
  ControllerInvocationManifestCompositionAuthorityInterface,
  ControllerInvocationManifestCompositionAuthorityFactoryInterface,
  ControllerInvocationManifestBuilderInterface,
  ControllerInvocationManifestTerminalOperationInterface,
  ControllerInvocationManifestTerminalFailure,
  ControllerInvocationManifestTerminalFailureEvidence,
  ControllerInvocationManifestTerminalOperationsFactoryInterface,
  ControllerInvocationManifestCompleteJudgment,
  ControllerInvocationManifestBlockedJudgment,
  ControllerInvocationManifestInventoryRejectedTerminal,
  ControllerInvocationManifestSourceDiscoveryBlockedTerminal,
  ControllerInvocationManifestSourceProjectIdentityBlockedTerminal,
  ControllerInvocationManifestSourceDocumentsBlockedTerminal,
  ControllerInvocationManifestSourceDocumentIdentityRejectedTerminal,
  ControllerInvocationManifest,
  ControllerInvocationManifestCompositionInput,
  ControllerInvocationManifestInventoryRejectedJudgment,
  ControllerInvocationManifestSourceDiscoveryBlockedJudgment,
  ControllerInvocationManifestSourceProjectIdentityBlockedJudgment,
  ControllerInvocationManifestSourceDocumentsBlockedJudgment,
  ControllerInvocationManifestSourceDocumentIdentityRejectedJudgment,
} from './controllerInvocationManifestCompositionInterface';
