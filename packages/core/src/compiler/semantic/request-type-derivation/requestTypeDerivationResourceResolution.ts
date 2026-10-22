/** Canonical resource resolution over upstream inventory; ambiguity is explicit. */
import type {
  RequestTypeDerivationResourceResolutionInterface,
  RequestTypeResourceCandidateSelection,
  RequestTypeResourceCandidateSelectionInterface,
  RequestTypeResourceResolution,
  RequestTypeDerivationResourceResolutionInput,
  RequestTypeResourceEvidenceReference,
} from '../../../types/upstream/requestTypeDerivationInterface';
import { requestTypeDerivationSourceEvidenceInventory } from './requestTypeDerivationSourceEvidenceInventory';

export const requestTypeResourceCandidateSelection: RequestTypeResourceCandidateSelectionInterface = Object.freeze({
  select: (candidates: readonly RequestTypeResourceEvidenceReference[]): RequestTypeResourceCandidateSelection => candidates.reduce(
    (selection: RequestTypeResourceCandidateSelection, candidate: RequestTypeResourceEvidenceReference): RequestTypeResourceCandidateSelection => {
      switch (selection.kind) {
        case 'none':
          return Object.freeze({ kind: 'one', candidate });
        case 'one':
          return Object.freeze({ kind: 'many', first: selection.candidate, second: candidate, remaining: Object.freeze([]) });
        case 'many':
          return Object.freeze({ kind: 'many', first: selection.first, second: selection.second, remaining: Object.freeze([...selection.remaining, candidate]) });
      }
    },
    Object.freeze({ kind: 'none' }),
  ),
});

const resolutionFromSelection = (
  query: string,
  selection: RequestTypeResourceCandidateSelection,
): RequestTypeResourceResolution => {
  switch (selection.kind) {
    case 'none':
      return Object.freeze({ kind: 'missing', query });
    case 'one':
      return Object.freeze({ kind: 'resolved', resource: selection.candidate });
    case 'many':
      return Object.freeze({ kind: 'ambiguous', candidates: Object.freeze([selection.first, selection.second, ...selection.remaining]) });
  }
};

export const requestTypeDerivationResourceResolution: RequestTypeDerivationResourceResolutionInterface = Object.freeze({
  resolve: (input: RequestTypeDerivationResourceResolutionInput): RequestTypeResourceResolution => {
    const { resourceName, resources } = input;
    const query = resourceName.value.value;
    const canonicalIdentity = requestTypeDerivationSourceEvidenceInventory.canonicalResourceIdentity(resourceName);
    return resolutionFromSelection(
      query,
      requestTypeResourceCandidateSelection.select(resources.filter((resource: RequestTypeResourceEvidenceReference) =>
        requestTypeDerivationSourceEvidenceInventory.relateCanonicalResourceIdentity(resource.canonicalIdentity, canonicalIdentity).kind === 'canonical_resource_identity_equivalent',
      )),
    );
  },
});
