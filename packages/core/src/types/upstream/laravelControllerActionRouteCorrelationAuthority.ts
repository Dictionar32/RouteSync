import type { ActionName, ControllerName } from './names';
import type {
  ControllerActionJudgmentPublication,
  ControllerActionJudgmentRouteSelection,
} from './laravelControllerScannerInterface';
import type { SourceSpan } from './provenance';

/** Input to the closed route/action semantic correlation judgment. */
export interface ControllerActionRouteCorrelationInput {
  readonly kind: 'controller_action_route_correlation_input';
  readonly controller: ControllerName;
  readonly action: ActionName;
  readonly publications: readonly ControllerActionJudgmentPublication[];
}

/** The authority owns identity matching, publication coherence, and ambiguity. */
export interface ControllerActionRouteCorrelationAuthorityInterface {
  readonly kind: 'controller_action_route_correlation_authority';
  readonly contractVersion: 2;
  readonly identityCorrelation: 'route-publication-controller-and-action-match-canonical-semantic-identity-without-consumer-projection-identity';
  readonly sourceCorrelation: 'publication-source-file-and-method-span-match-the-canonical-action-judgment-source';
  readonly judge: (input: ControllerActionRouteCorrelationInput) => ControllerActionJudgmentRouteSelection;
}

const sameSourceSpan = (left: SourceSpan, right: SourceSpan): boolean =>
  left.file.value.value === right.file.value.value &&
  left.start.value === right.start.value &&
  left.end.value === right.end.value;

const publicationCoherence = (
  publication: ControllerActionJudgmentPublication,
): 'coherent' | 'publication_identity_mismatch' | 'source_span_mismatch' => {
  const judgment = publication.judgment;
  const identityCoherence =
    publication.controller.value.value === judgment.semantic.controllerName.value.value &&
    publication.action.value.value === judgment.semantic.actionName.value.value &&
    publication.sourceFile.value.value === judgment.semantic.source.file.value.value;
  const sourceFileCoherence =
    publication.sourceFile.value.value === publication.source.file.value.value &&
    publication.source.file.value.value === judgment.semantic.source.file.value.value;
  const spanCoherence = sameSourceSpan(publication.source, judgment.semantic.source);
  switch (true) {
    case !identityCoherence:
      return 'publication_identity_mismatch';
    case !(sourceFileCoherence && spanCoherence):
      return 'source_span_mismatch';
    default:
      return 'coherent';
  }
};

/**
 * Canonical route/action correlation. A candidate with the requested identity but
 * contradictory canonical provenance is rejected explicitly, never treated as a match.
 */
export const controllerActionRouteCorrelationAuthority: ControllerActionRouteCorrelationAuthorityInterface = Object.freeze({
  kind: 'controller_action_route_correlation_authority',
  contractVersion: 2,
  identityCorrelation: 'route-publication-controller-and-action-match-canonical-semantic-identity-without-consumer-projection-identity',
  sourceCorrelation: 'publication-source-file-and-method-span-match-the-canonical-action-judgment-source',
  judge: input => {
    const candidates = input.publications.filter(publication =>
      publication.controller.value.value === input.controller.value.value &&
      publication.action.value.value === input.action.value.value,
    );
    const invalid = candidates.find(publication => publicationCoherence(publication) !== 'coherent');
    switch (invalid === undefined ? 'coherent' : publicationCoherence(invalid)) {
      case 'publication_identity_mismatch':
        return invalid === undefined
          ? Object.freeze({ kind: 'unmatched_action_judgment' })
          : Object.freeze({ kind: 'invalid_action_judgment_publication', publication: invalid, reason: 'publication_identity_mismatch' } satisfies ControllerActionJudgmentRouteSelection);
      case 'source_span_mismatch':
        return invalid === undefined
          ? Object.freeze({ kind: 'unmatched_action_judgment' })
          : Object.freeze({ kind: 'invalid_action_judgment_publication', publication: invalid, reason: 'source_span_mismatch' } satisfies ControllerActionJudgmentRouteSelection);
      case 'coherent':
        break;
    }
    const [first, second, ...remaining] = candidates;
    switch (candidates.length) {
      case 0:
        return Object.freeze({ kind: 'unmatched_action_judgment' });
      case 1:
        return first === undefined
          ? Object.freeze({ kind: 'unmatched_action_judgment' })
          : Object.freeze({ kind: 'matched_action_judgment', publication: first });
      default:
        return first === undefined || second === undefined
          ? Object.freeze({ kind: 'unmatched_action_judgment' })
          : Object.freeze({
              kind: 'ambiguous_action_judgments',
              first,
              second,
              remaining: Object.freeze(remaining),
            });
    }
  },
});
