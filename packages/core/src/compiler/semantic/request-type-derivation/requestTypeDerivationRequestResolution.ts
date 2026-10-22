/**
 * Canonical request-resolution operation over upstream source-evidence inventory.
 * Exact identity takes precedence; normalized matching is considered only when
 * no exact candidate exists. Candidate cardinality is a separate closed ADT
 * operation, so a missing or ambiguous match can never be converted into a
 * first-item selection.
 */
import type {
  RequestTypeDerivationRequestResolutionInterface,
  RequestTypeRequestCandidateSelection,
  RequestTypeRequestCandidateSelectionInterface,
  RequestTypeRequestResolution,
} from '../../../types/upstream/requestTypeDerivationInterface';

export const requestTypeRequestCandidateSelection: RequestTypeRequestCandidateSelectionInterface = Object.freeze({
  select: (candidates): RequestTypeRequestCandidateSelection => candidates.reduce<RequestTypeRequestCandidateSelection>(
    (selection, candidate) => {
      switch (selection.kind) {
        case 'none':
          return Object.freeze({ kind: 'one', candidate });
        case 'one':
          return Object.freeze({
            kind: 'many',
            first: selection.candidate,
            second: candidate,
            remaining: Object.freeze([]),
          });
        case 'many':
          return Object.freeze({
            kind: 'many',
            first: selection.first,
            second: selection.second,
            remaining: Object.freeze([...selection.remaining, candidate]),
          });
      }
    },
    Object.freeze({ kind: 'none' }),
  ),
});

const resolutionFromSelection = (
  query: string,
  selection: RequestTypeRequestCandidateSelection,
  exact: boolean,
): RequestTypeRequestResolution => {
  switch (selection.kind) {
    case 'none':
      return Object.freeze({ kind: 'missing', query });
    case 'one':
      return Object.freeze({
        kind: exact ? 'resolved_exact' : 'resolved_normalized',
        request: selection.candidate,
      });
    case 'many':
      return Object.freeze({
        kind: exact ? 'ambiguous_exact' : 'ambiguous_normalized',
        candidates: Object.freeze([selection.first, selection.second, ...selection.remaining]),
      });
  }
};

export const requestTypeDerivationRequestResolution: RequestTypeDerivationRequestResolutionInterface = Object.freeze({
  resolve: ({ requestClass, requests }): RequestTypeRequestResolution => {
    const query = requestClass.value.value;
    const exactSelection = requestTypeRequestCandidateSelection.select(
      requests.filter(request => request.canonicalIdentity.requestName.value.value === query),
    );

    switch (exactSelection.kind) {
      case 'one':
      case 'many':
        return resolutionFromSelection(query, exactSelection, true);
      case 'none':
        return resolutionFromSelection(
          query,
          requestTypeRequestCandidateSelection.select(
            requests.filter(request => request.canonicalIdentity.requestName.value.value.toLowerCase() === query.toLowerCase()),
          ),
          false,
        );
    }
  },
});
