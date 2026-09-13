/**
 * Resolvers module index.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 */
export {
  CycleDetector,
  type ExpressionNode,
  type EvidenceNode,
  type ResolutionResult,
  type SemanticResolutionKernelContract,
  type ResolutionContext,
  type ResolverPlugin
} from './types';

export { SemanticResolutionKernel } from './SemanticResolutionKernel';
