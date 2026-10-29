import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticPipelineAssemblyResult,
  RequestTypeDerivationSemanticPipelineCompositionInterface,
  RequestTypeDerivationSemanticPipelineAssemblerInterface,
} from './requestTypeDerivationInterface';
import { requestTypeDerivationContract } from './requestTypeDerivationInterface';

/**
 * The legacy scanner implementation was removed with the compiler purge.
 * Keep the upstream preparation boundary explicit and fail closed until a
 * source-AST pipeline implementation is composed again.
 */
export const manifestBuilderOperationPreparation = Object.freeze({
  kind: 'manifest_builder_operation_preparation' as const,
  contractVersion: 1 as const,
  prepare: (input: unknown): never => {
    throw new Error('Manifest builder source-AST pipeline is not composed in the active upstream runtime.');
  },
});

export const requestTypeDerivationProductionPipelineAssembler: RequestTypeDerivationSemanticPipelineAssemblerInterface = Object.freeze({
  assemble: (
    composition: RequestTypeDerivationSemanticPipelineCompositionInterface,
  ): RequestTypeDerivationSemanticPipelineAssemblyResult => {
    const mismatch = Object.freeze({
      kind: 'contract_mismatch' as const,
      capability: 'reasoning' as const,
      expected: requestTypeDerivationContract as RequestTypeDerivationContract,
      actual: requestTypeDerivationContract as RequestTypeDerivationContract,
    });
    const rejected = Object.freeze({
      kind: 'rejected' as const,
      mismatches: Object.freeze([mismatch]) as readonly [typeof mismatch, ...typeof mismatch[]],
      continueWith: <Result>(handlers: { readonly assembled: (value: never) => Result; readonly rejected: (value: typeof rejected) => Result }): Result =>
        handlers.rejected(rejected),
    });
    return rejected;
  },
});
