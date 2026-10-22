/** Inventory-bound publication authority. Meaning is derived upstream; this module validates correspondence only. */
import type { SemanticSource, KnowledgeId } from './semanticDataflowKnowledge';

import type { InvocationSemanticJudgment } from './invocationSemanticJudgmentInterface';
import {
  INVOCATION_SEMANTIC_COVERAGE_CONTRACT,
  INVOCATION_SEMANTIC_COVERAGE_PUBLICATION_AUTHORITY_BOUNDARY_CONTRACT,
  type InvocationSemanticCoveragePublicationAuthorityBoundaryContract,
  type InvocationSemanticCoveragePublicationInterface,
  type InvocationSemanticCoveragePublicationInput,
  type InvocationSemanticCoveragePublicationResult,
  type InvocationSemanticCoveragePublicationEntry,
  type InvocationSemanticCoveragePublication,
  type InvocationSemanticCoveragePublicationCorrespondence,
  type InvocationSemanticCoveragePublicationViolation,
  type InvocationSemanticSubject,
  type InvocationSemanticSubjectIdentity,
  type InvocationSemanticSubjectCoverageEntry,
} from './invocationSemanticPipelineInterface';


const identityOf = (subject: InvocationSemanticSubject): InvocationSemanticSubjectIdentity => {
  switch (subject.kind) {
    case 'ordinary-invocation-subject':
      return Object.freeze({ kind: 'invocation_semantic_subject_identity', form: 'ordinary-invocation', id: subject.invocation.id });
    case 'static-invocation-subject':
      return Object.freeze({ kind: 'invocation_semantic_subject_identity', form: 'static-invocation', id: subject.invocation.id });
    default: {
      const exhaustive: never = subject;
      return exhaustive;
    }
  }
};

const judgmentIdentity = (judgment: InvocationSemanticJudgment): InvocationSemanticSubjectIdentity => Object.freeze({
  kind: 'invocation_semantic_subject_identity',
  form: 'ordinary-invocation',
  id: judgment.invocation.id,
});

type OrdinaryInventoryEntry = Extract<InvocationSemanticSubjectCoverageEntry, { readonly kind: 'ordinary-invocation-subject-coverage-entry' }>;
type StaticInventoryEntry = Extract<InvocationSemanticSubjectCoverageEntry, { readonly kind: 'static-invocation-subject-coverage-entry' }>;
type PublishedOrdinaryEntry = Extract<InvocationSemanticCoveragePublicationEntry, { readonly kind: 'ordinary-invocation-judgment-published-coverage-entry' }>;
type UnavailableOrdinaryEntry = Extract<InvocationSemanticCoveragePublicationEntry, { readonly kind: 'ordinary-invocation-judgment-unavailable-coverage-entry' }>;
type StaticPublicationEntry = Extract<InvocationSemanticCoveragePublicationEntry, { readonly kind: 'static-invocation-coverage-entry' }>;
type InvocationCoveragePublicationPair =
  | Readonly<{ readonly kind: 'ordinary-published-pair'; readonly inventoryEntry: OrdinaryInventoryEntry; readonly publicationEntry: PublishedOrdinaryEntry }>
  | Readonly<{ readonly kind: 'ordinary-unavailable-pair'; readonly inventoryEntry: OrdinaryInventoryEntry; readonly publicationEntry: UnavailableOrdinaryEntry }>
  | Readonly<{ readonly kind: 'static-uncovered-pair'; readonly inventoryEntry: StaticInventoryEntry; readonly publicationEntry: StaticPublicationEntry }>;

const ordinaryEntry = (
  subject: OrdinaryInventoryEntry['subject'],
  judgment: InvocationSemanticJudgment | undefined,
): PublishedOrdinaryEntry | UnavailableOrdinaryEntry => {
  switch (judgment) {
    case undefined:
      return Object.freeze({
        kind: 'ordinary-invocation-judgment-unavailable-coverage-entry',
        subject,
        disposition: Object.freeze({ kind: 'judgment-unavailable', reason: 'ordinary-analysis-omitted-source-subject' }),
      });
    default:
      return Object.freeze({
        kind: 'ordinary-invocation-judgment-published-coverage-entry',
        subject,
        disposition: Object.freeze({ kind: 'judgment-published', judgment }),
      });
  }
};

const createPublicationPair = (
  entry: InvocationSemanticSubjectCoverageEntry,
  judgment: InvocationSemanticJudgment | undefined,
): InvocationCoveragePublicationPair => {
  switch (entry.kind) {
    case 'ordinary-invocation-subject-coverage-entry': {
      const publishedEntry = ordinaryEntry(entry.subject, judgment);
      switch (publishedEntry.kind) {
        case 'ordinary-invocation-judgment-published-coverage-entry':
          return Object.freeze({ kind: 'ordinary-published-pair', inventoryEntry: entry, publicationEntry: publishedEntry });
        case 'ordinary-invocation-judgment-unavailable-coverage-entry':
          return Object.freeze({ kind: 'ordinary-unavailable-pair', inventoryEntry: entry, publicationEntry: publishedEntry });
        default: {
          const exhaustive: never = publishedEntry;
          return exhaustive;
        }
      }
    }
    case 'static-invocation-subject-coverage-entry':
      return Object.freeze({
        kind: 'static-uncovered-pair',
        inventoryEntry: entry,
        publicationEntry: Object.freeze({
          kind: 'static-invocation-coverage-entry',
          subject: entry.subject,
          disposition: Object.freeze({ kind: 'uncovered-source-fact', reason: 'static-invocation-algebra-and-authority-not-implemented' }),
        }),
      });
    default: {
      const exhaustive: never = entry;
      return exhaustive;
    }
  }
};

const createCorrespondence = (
  pair: InvocationCoveragePublicationPair,
): InvocationSemanticCoveragePublicationCorrespondence => {
  switch (pair.kind) {
    case 'ordinary-published-pair':
      return Object.freeze({
        kind: 'ordinary-invocation-coverage-correspondence',
        inventoryEntry: pair.inventoryEntry,
        analysisJudgment: pair.publicationEntry.disposition.judgment,
        publicationEntry: pair.publicationEntry,
      });
    case 'ordinary-unavailable-pair':
      return Object.freeze({
        kind: 'ordinary-invocation-unavailable-coverage-correspondence',
        inventoryEntry: pair.inventoryEntry,
        publicationEntry: pair.publicationEntry,
      });
    case 'static-uncovered-pair':
      return Object.freeze({
        kind: 'static-invocation-coverage-correspondence',
        inventoryEntry: pair.inventoryEntry,
        publicationEntry: pair.publicationEntry,
      });
    default: {
      const exhaustive: never = pair;
      return exhaustive;
    }
  }
};

const sameSource = (left: SemanticSource, right: SemanticSource): boolean => left.filePath.value === right.filePath.value && left.span.start.value === right.span.start.value && left.span.end.value === right.span.end.value && left.evidence.code === right.evidence.code;
const sameKnowledge = (left: KnowledgeId, right: KnowledgeId): boolean => left.identity.role === right.identity.role && left.identity.slot.value === right.identity.slot.value && sameSource(left.identity.source, right.identity.source);
const sameIdentity = (left: InvocationSemanticSubjectIdentity, right: InvocationSemanticSubjectIdentity): boolean => left.form === right.form && sameKnowledge(left.id, right.id);

const validateAndPublish = (input: InvocationSemanticCoveragePublicationInput): InvocationSemanticCoveragePublicationResult => {
  const violations: InvocationSemanticCoveragePublicationViolation[] = [];
  const inventory = input.inventory;
  const judgments = input.analysis.judgments;

  inventory.forEach((entry, index) => {
    const identity = identityOf(entry.subject);
    inventory.slice(0, index).forEach(previous => {
      const previousIdentity = identityOf(previous.subject);
      if (sameIdentity(previousIdentity, identity)) {
        violations.push(Object.freeze({ kind: 'duplicate-inventory-identity', identity }));
      }
    });
  });

  judgments.forEach((judgment, index) => {
    const actual = judgmentIdentity(judgment);
    const priorJudgments = judgments.slice(0, index).filter(previous => sameIdentity(judgmentIdentity(previous), actual));
    if (priorJudgments.length > 0) violations.push(Object.freeze({ kind: 'duplicate-analysis-judgment', identity: actual }));

    const ordinaryMatches = inventory.filter(entry => entry.kind === 'ordinary-invocation-subject-coverage-entry' && sameIdentity(identityOf(entry.subject), actual));
    const staticMatches = inventory.filter(entry => entry.kind === 'static-invocation-subject-coverage-entry' && sameKnowledge(entry.subject.invocation.id, judgment.invocation.id));
    if (ordinaryMatches.length === 0 && staticMatches.length > 0) {
      const expected = identityOf(staticMatches[0]!.subject);
      violations.push(Object.freeze({ kind: 'judgment-subject-mismatch', expected, actual }));
    } else if (ordinaryMatches.length === 0) {
      violations.push(Object.freeze({ kind: 'analysis-judgment-outside-inventory', identity: actual }));
    } else {
      const matched = ordinaryMatches[0]!;
      if (!sameSource(matched.subject.invocation.source, judgment.invocation.source)) {
        violations.push(Object.freeze({ kind: 'source-evidence-mismatch', identity: actual, expected: matched.subject.invocation.source, actual: judgment.invocation.source }));
      }
    }
  });

  const publicationPairs = inventory.map(entry => {
    const matchedJudgments = entry.kind === 'ordinary-invocation-subject-coverage-entry'
      ? judgments.filter(judgment => sameIdentity(judgmentIdentity(judgment), identityOf(entry.subject)))
      : [];
    switch (matchedJudgments.length) {
      case 1:
        return createPublicationPair(entry, matchedJudgments.find(() => true));
      default:
        return createPublicationPair(entry, undefined);
    }
  });
  const publication: InvocationSemanticCoveragePublication = Object.freeze({ kind: 'invocation_semantic_coverage_publication', entries: Object.freeze(publicationPairs.map(pair => pair.publicationEntry)) });

  const firstViolation = violations[0];
  switch (firstViolation) {
    case undefined: {
      const correspondences = publicationPairs.map(pair => createCorrespondence(pair));
      return Object.freeze({
        kind: 'validated-publication',
        publication,
        validation: Object.freeze({
          kind: 'invocation_semantic_coverage_publication_validation',
          contract: INVOCATION_SEMANTIC_COVERAGE_CONTRACT,
          authorityBoundary: INVOCATION_SEMANTIC_COVERAGE_PUBLICATION_AUTHORITY_BOUNDARY_CONTRACT,
          analysis: input.analysis,
          correspondences: Object.freeze(correspondences),
          invariant: 'one-publication-entry-per-inventory-identity-with-matching-form-subject-and-source-evidence-and-each-published-ordinary-judgment-bound-to-the-exact-analysis-judgment',
        }),
      });
    }
    default: {
      const rejectionLedger: readonly [InvocationSemanticCoveragePublicationViolation, ...InvocationSemanticCoveragePublicationViolation[]] = Object.freeze([firstViolation, ...violations.slice(1)]);
      return Object.freeze({ kind: 'rejected-publication', analysis: input.analysis, violations: rejectionLedger });
    }
  }
};

export const invocationSemanticCoveragePublicationAuthority: InvocationSemanticCoveragePublicationInterface = Object.freeze({
  kind: 'invocation_semantic_coverage_publication_authority',
  contract: INVOCATION_SEMANTIC_COVERAGE_CONTRACT,
  authorityBoundary: INVOCATION_SEMANTIC_COVERAGE_PUBLICATION_AUTHORITY_BOUNDARY_CONTRACT satisfies InvocationSemanticCoveragePublicationAuthorityBoundaryContract,
  publish: validateAndPublish,
});
