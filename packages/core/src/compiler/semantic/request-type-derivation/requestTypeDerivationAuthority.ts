/**
 * Contract-enforcing authority boundary for RequestType derivation.
 *
 * The semantic kernel supplies the domain reasoning and law verifier. This
 * adapter owns the trust boundary: a judgment is never returned as verified
 * unless its verifier result is valid and the judgment kind is coherent.
 * It deliberately does not implement a second request/resource classifier.
 */
import { createRequestTypeDerivationAuthorityCoverage } from './requestTypeDerivationCoverage';
import type {
  RequestTypeDerivationAuthorityInterface,
  RequestTypeDerivationAuthorityOutcome,
  RequestTypeDerivationContract,
  RequestTypeDerivationInput,
  RequestTypeDerivationJudgment,
  RequestTypeDerivationVerification,
} from '../../../types/upstream/requestTypeDerivationInterface';

export interface RequestTypeDerivationSemanticKernel {
  /** Produces the complete semantic judgment from source evidence. */
  readonly deriveJudgment: (input: RequestTypeDerivationInput) => RequestTypeDerivationJudgment;
  /** Checks the judgment against source evidence and the closed semantic laws. */
  readonly verify: (
    input: RequestTypeDerivationInput,
    judgment: RequestTypeDerivationJudgment,
  ) => RequestTypeDerivationVerification;
}


const areEquivalentEvidenceValues = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((item, index) => areEquivalentEvidenceValues(item, right[index]));
  }
  if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => (
      Object.hasOwn(right, key)
      && areEquivalentEvidenceValues(Reflect.get(left, key), Reflect.get(right, key))
    ));
};

const classifyAuthorityResult = (
  judgment: RequestTypeDerivationJudgment,
  verification: RequestTypeDerivationVerification,
): RequestTypeDerivationAuthorityOutcome => {
  if (judgment.kind === 'invalid_input') {
    if (verification.kind === 'rejection_confirmed') {
      if (verification.reason !== judgment.reason) {
        return Object.freeze({
          kind: 'authority_inconsistent',
          reason: 'rejection_reason_mismatch',
          judgment,
          verification,
        });
      }
      if (!areEquivalentEvidenceValues(verification.evidence, judgment.evidence)) {
        return Object.freeze({
          kind: 'authority_inconsistent',
          reason: 'rejection_witness_mismatch',
          judgment,
          verification,
        });
      }
      return Object.freeze({ kind: 'input_rejected', judgment, verification });
    }

    if (verification.kind === 'invalid') {
      return Object.freeze({ kind: 'rejection_verification_failed', judgment, verification });
    }

    return Object.freeze({
      kind: 'authority_inconsistent',
      reason: 'judgment_verification_kind_mismatch',
      judgment,
      verification,
    });
  }

  if (verification.kind === 'valid') {
    return Object.freeze({ kind: 'verified', judgment, verification });
  }

  if (verification.kind === 'invalid') {
    return Object.freeze({ kind: 'verification_failed', judgment, verification });
  }

  return Object.freeze({
    kind: 'authority_inconsistent',
    reason: 'judgment_verification_kind_mismatch',
    judgment,
    verification,
  });
};

export interface RequestTypeDerivationAuthorityFactoryInterface {
  readonly create: (
    contract: RequestTypeDerivationContract,
    kernel: RequestTypeDerivationSemanticKernel,
  ) => RequestTypeDerivationAuthorityInterface;
}

export const requestTypeDerivationAuthorityFactory: RequestTypeDerivationAuthorityFactoryInterface = Object.freeze({
  create: (
    contract: RequestTypeDerivationContract,
    kernel: RequestTypeDerivationSemanticKernel,
  ): RequestTypeDerivationAuthorityInterface => {
  const coverage = createRequestTypeDerivationAuthorityCoverage(contract);
  const verify = (
    input: RequestTypeDerivationInput,
    judgment: RequestTypeDerivationJudgment,
  ): RequestTypeDerivationVerification => kernel.verify(input, judgment);

  const derive = (input: RequestTypeDerivationInput): RequestTypeDerivationAuthorityOutcome => {
    const judgment = kernel.deriveJudgment(input);
    const verification = verify(input, judgment);

    const coverageEvidence = coverage.assess(verification);
    if (coverageEvidence.kind === 'contract_incomplete') {
      return Object.freeze({
        kind: 'authority_inconsistent',
        reason: 'contract_law_coverage_incomplete',
        judgment,
        verification,
      });
    }

    if (coverageEvidence.kind === 'verification_incomplete') {
      return Object.freeze({
        kind: 'authority_inconsistent',
        reason: 'verified_law_coverage_incomplete',
        judgment,
        verification,
      });
    }

    return classifyAuthorityResult(judgment, verification);
  };

  return Object.freeze({
    contract,
    derive,
    verify,
  });
  },
});
