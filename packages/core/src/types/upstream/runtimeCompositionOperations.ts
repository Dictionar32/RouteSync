import type {
  ManifestBuilderInput,
  ManifestBuilderOperationPreparationInterface,
} from './manifestBuilderInterface';
import {
  REQUEST_TYPE_DERIVATION_LAW_IDS,
  type RequestTypeAuthorityCoverageEvidenceFor,
  type RequestTypeDerivationContract,
  type RequestTypeDerivationSemanticPipelineAssemblyResult,
  type RequestTypeDerivationSemanticPipelineAssemblyHandlers,
  type RequestTypeDerivationSemanticPipelineCompositionInterface,
  type RequestTypeDerivationSemanticPipelineAssemblerInterface,
  type RequestTypeDerivationSemanticPipelineInterface,
  type RequestTypeDerivationSemanticInferenceFor,
  type RequestTypeDerivationVerification,
  type RequestTypeNonEmptyLedger,
} from './requestTypeDerivationInterface';
import { requestTypeDerivationContract } from './requestTypeDerivationInterface';
import { createRequestTypeDerivationAuthorityIntegrityGate } from './requestTypeDerivationAuthorityIntegrityGate';
import { createRequestTypeDerivationSemanticAssessmentValidator } from './requestTypeDerivationAssessmentIntegrityRuntime';

/**
 * Source-AST construction is not available in this runtime yet. Keep the
 * existing preparation contract honest until its concrete scanner dependency
 * set is composed; callers receive the exact boundary failure, never a fake
 * complete manifest.
 */
export const manifestBuilderOperationPreparation: ManifestBuilderOperationPreparationInterface = {
  kind: 'manifest_builder_operation_preparation',
  contractVersion: 1,
  prepare: (_input: ManifestBuilderInput) => {
    throw new Error('Manifest builder source-AST pipeline is not implemented in the active upstream runtime.');
  },
};

const nonEmpty = <Value>(values: readonly Value[]): values is RequestTypeNonEmptyLedger<Value> =>
  values.length > 0 && values[0] !== undefined;

const coverageFor = <Contract extends RequestTypeDerivationContract>(
  contract: Contract,
  verification: RequestTypeDerivationVerification,
): RequestTypeAuthorityCoverageEvidenceFor<Contract> => {
  const missingContractLaws = REQUEST_TYPE_DERIVATION_LAW_IDS.filter(law => contract.laws[law] !== 'required');
  if (nonEmpty(missingContractLaws)) {
    return { kind: 'contract_incomplete', contract, missingLaws: missingContractLaws };
  }

  if (verification.kind === 'verification_incomplete') {
    return { kind: 'verification_incomplete', contract, missingLaws: verification.missingLaws };
  }

  if (verification.kind === 'valid') {
    const missingVerifiedLaws = REQUEST_TYPE_DERIVATION_LAW_IDS.filter(law => verification.verifiedLaws[law] !== 'verified');
    if (nonEmpty(missingVerifiedLaws)) {
      return { kind: 'verification_incomplete', contract, missingLaws: missingVerifiedLaws };
    }
  }

  return { kind: 'complete', contract };
};

const mismatch = (
  capability: 'reasoning' | 'verifier' | 'decision' | 'authority' | 'integrity',
  expected: RequestTypeDerivationContract,
  actual: RequestTypeDerivationContract,
) => Object.freeze({ kind: 'contract_mismatch' as const, capability, expected, actual });

const createPipeline = <
  Contract extends RequestTypeDerivationContract,
  Inference extends RequestTypeDerivationSemanticInferenceFor<Contract>,
>(
  composition: RequestTypeDerivationSemanticPipelineCompositionInterface<Contract, Inference>,
): RequestTypeDerivationSemanticPipelineInterface<Contract, Inference> => {
  const authorityIntegrity = createRequestTypeDerivationAuthorityIntegrityGate(
    composition.authority,
    composition.integrity,
  );
  const validateAssessment = createRequestTypeDerivationSemanticAssessmentValidator(composition.contract);

  return {
    contract: composition.contract,
    derive: input => {
      const preparedInput = composition.preparation.prepare(input);
      const inference = composition.reasoning.infer(preparedInput);
      const verification = composition.verifier.verify(inference);
      const coverage = coverageFor(composition.contract, verification.result);
      const candidate = composition.decision.decide({
        contract: composition.contract,
        inference,
        verification,
        coverage,
      });
      const authorityResult = authorityIntegrity.evaluate(input, candidate, verification);
      if (authorityResult.kind === 'integrity_rejected') {
        return authorityResult;
      }
      return authorityResult.assessment;
    },
    validateAssessment,
  };
};

/** Compose only supplied semantic capabilities; reject mismatched contracts as a closed ADT. */
export const requestTypeDerivationProductionPipelineAssembler: RequestTypeDerivationSemanticPipelineAssemblerInterface = {
  assemble: (composition): RequestTypeDerivationSemanticPipelineAssemblyResult => {
    const mismatches = [
      composition.reasoning.contract === composition.contract ? undefined : mismatch('reasoning', composition.contract, composition.reasoning.contract),
      composition.verifier.contract === composition.contract ? undefined : mismatch('verifier', composition.contract, composition.verifier.contract),
      composition.decision.contract === composition.contract ? undefined : mismatch('decision', composition.contract, composition.decision.contract),
      composition.authority.contract === composition.contract ? undefined : mismatch('authority', composition.contract, composition.authority.contract),
      composition.integrity.contract === composition.contract ? undefined : mismatch('integrity', composition.contract, composition.integrity.contract),
    ].filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== undefined);

    if (mismatches.length > 0) {
      const first = mismatches[0];
      if (first === undefined) throw new Error('Contract mismatch inventory invariant violated.');
      const rejection = {
        kind: 'rejected' as const,
        mismatches: [first, ...mismatches.slice(1)] as const,
        continueWith: <Result>(handlers: RequestTypeDerivationSemanticPipelineAssemblyHandlers<Result>) => handlers.rejected(rejection),
      };
      return rejection;
    }

    const pipeline = createPipeline(composition);
    const assembled = {
      kind: 'assembled' as const,
      pipeline,
      continueWith: <Result>(handlers: RequestTypeDerivationSemanticPipelineAssemblyHandlers<Result>) => handlers.assembled(pipeline),
    };
    return assembled;
  },
};
