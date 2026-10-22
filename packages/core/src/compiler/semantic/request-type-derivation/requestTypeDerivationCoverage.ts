/**
 * Upstream contract-coverage operation for RequestType semantic decision.
 * It creates only the existing coverage ADT; it never derives a judgment,
 * changes a verification result, or supplies missing proof evidence.
 */
import {
  REQUEST_TYPE_DERIVATION_LAW_IDS,
  type RequestTypeAuthorityCoverageEvidenceFor,
  type RequestTypeDerivationAuthorityCoverageInterface,
  type RequestTypeDerivationContract,
  type RequestTypeDerivationLawId,
  type RequestTypeDerivationVerification,
  type RequestTypeNonEmptyLedger,
} from '../../../types/upstream/requestTypeDerivationInterface';

const missingRequiredLaws = (
  contract: RequestTypeDerivationContract,
): readonly RequestTypeDerivationLawId[] =>
  REQUEST_TYPE_DERIVATION_LAW_IDS.filter(law => contract.laws[law] !== 'required');

const missingVerifiedLaws = (
  verification: Extract<RequestTypeDerivationVerification, { readonly kind: 'valid' }>,
): readonly RequestTypeDerivationLawId[] =>
  REQUEST_TYPE_DERIVATION_LAW_IDS.filter(law => verification.verifiedLaws[law] !== 'verified');

const isNonEmptyLedger = <T>(
  values: readonly T[],
): values is RequestTypeNonEmptyLedger<T> => values.length > 0 && values[0] !== undefined;

export const createRequestTypeDerivationAuthorityCoverage = <
  TContract extends RequestTypeDerivationContract,
>(contract: TContract): RequestTypeDerivationAuthorityCoverageInterface<TContract> => Object.freeze({
  contract,
  assess: (verification: RequestTypeDerivationVerification): RequestTypeAuthorityCoverageEvidenceFor<TContract> => {
    const missingContractLaws = missingRequiredLaws(contract);
    if (isNonEmptyLedger(missingContractLaws)) {
      return Object.freeze({
        kind: 'contract_incomplete',
        contract,
        missingLaws: missingContractLaws,
      });
    }

    if (verification.kind === 'valid') {
      const missingProofLaws = missingVerifiedLaws(verification);
      if (isNonEmptyLedger(missingProofLaws)) {
        return Object.freeze({
          kind: 'verification_incomplete',
          contract,
          missingLaws: missingProofLaws,
        });
      }
    } else if (verification.kind === 'verification_incomplete') {
      // Partial source evidence checks must never fall through to complete
      // contract coverage merely because the result is not `valid`/`invalid`.
      return Object.freeze({
        kind: 'verification_incomplete',
        contract,
        missingLaws: verification.missingLaws,
      });
    }

    return Object.freeze({ kind: 'complete', contract });
  },
});
