/**
 * Closed assessment of the request-resolution ledger at the CLI projection boundary.
 * This operation does not derive RequestType values and does not claim proof-law verification.
 */
import type {
  RequestTypeAmbiguousResolutionReceipt,
  RequestTypeIncompleteResolutionIssue,
  RequestTypeMissingResolutionReceipt,
  RequestTypeRequestResolutionAssessment,
  RequestTypeRequestResolutionAssessmentInterface,
  RequestTypeRouteRequestResolutionReceipt,
  RequestTypeUnresolvedBindingReceipt,
} from '../../../types/upstream/requestTypeDerivationInterface';

const missingReceipts = (
  ledger: readonly RequestTypeRouteRequestResolutionReceipt[],
): readonly RequestTypeMissingResolutionReceipt[] => Object.freeze(
  ledger.filter((receipt): receipt is RequestTypeMissingResolutionReceipt => receipt.resolution.kind === 'missing'),
);

const unresolvedBindingReceipts = (
  ledger: readonly RequestTypeRouteRequestResolutionReceipt[],
): readonly RequestTypeUnresolvedBindingReceipt[] => Object.freeze(
  ledger.filter((receipt): receipt is RequestTypeUnresolvedBindingReceipt => receipt.resolution.kind === 'unresolved_binding'),
);

const incompleteIssues = (
  ledger: readonly RequestTypeRouteRequestResolutionReceipt[],
): readonly RequestTypeIncompleteResolutionIssue[] => Object.freeze([
  ...missingReceipts(ledger).map(receipt => Object.freeze({ kind: 'missing_request' as const, receipt })),
  ...unresolvedBindingReceipts(ledger).map(receipt => Object.freeze({ kind: 'unresolved_binding' as const, receipt })),
]);

const ambiguousReceipts = (
  ledger: readonly RequestTypeRouteRequestResolutionReceipt[],
): readonly RequestTypeAmbiguousResolutionReceipt[] => Object.freeze(
  ledger.filter((receipt): receipt is RequestTypeAmbiguousResolutionReceipt => (
    receipt.resolution.kind === 'ambiguous_exact' || receipt.resolution.kind === 'ambiguous_normalized'
  )),
);

const assess = (
  ledger: readonly RequestTypeRouteRequestResolutionReceipt[],
): RequestTypeRequestResolutionAssessment => {
  const issues = incompleteIssues(ledger);
  const ambiguous = ambiguousReceipts(ledger);

  if (issues.length > 0 && ambiguous.length > 0) {
    return Object.freeze({ kind: 'incomplete_and_conflicted', ledger, issues, ambiguous });
  }
  if (ambiguous.length > 0) {
    return Object.freeze({ kind: 'conflict', ledger, ambiguous });
  }
  if (issues.length > 0) {
    return Object.freeze({ kind: 'incomplete', ledger, issues });
  }
  return Object.freeze({ kind: 'resolved', ledger });
};

export const requestTypeDerivationRequestResolutionAssessment: RequestTypeRequestResolutionAssessmentInterface = Object.freeze({ assess });
