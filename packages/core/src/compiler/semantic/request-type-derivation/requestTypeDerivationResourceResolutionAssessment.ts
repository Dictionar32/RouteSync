/** Closed assessment for resource resolution; this is a preflight, not a proof judgment. */
import type {
  RequestTypeResourceResolutionAssessment,
  RequestTypeResourceResolutionAssessmentInterface,
  RequestTypeResourceConflictReceipt,
  RequestTypeRouteResourceResolutionReceipt,
} from '../../../types/upstream/requestTypeDerivationInterface';

const missingReceipts = (ledger: readonly RequestTypeRouteResourceResolutionReceipt[]) => Object.freeze(
  ledger.filter(receipt => receipt.resolution.kind === 'missing'),
);
const conflictReceipts = (ledger: readonly RequestTypeRouteResourceResolutionReceipt[]) => Object.freeze(
  ledger.filter((receipt): receipt is RequestTypeResourceConflictReceipt => receipt.resolution.kind === 'ambiguous' || receipt.resolution.kind === 'identity_mismatch'),
);

export const requestTypeDerivationResourceResolutionAssessment: RequestTypeResourceResolutionAssessmentInterface = Object.freeze({
  assess: (ledger): RequestTypeResourceResolutionAssessment => {
    const missing = missingReceipts(ledger);
    const conflicts = conflictReceipts(ledger);
    if (missing.length > 0 && conflicts.length > 0) return Object.freeze({ kind: 'incomplete_and_conflicted', ledger, missing, conflicts });
    if (conflicts.length > 0) return Object.freeze({ kind: 'conflict', ledger, conflicts });
    if (missing.length > 0) return Object.freeze({ kind: 'incomplete', ledger, missing });
    return Object.freeze({ kind: 'resolved', ledger });
  },
});
