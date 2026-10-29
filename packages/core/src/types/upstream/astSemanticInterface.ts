/**
 * RouteSync AST semantic interface — highest compiler boundary.
 *
 * The AST judgment remains the SSOT. Scanner evidence, upstream mapping,
 * resolver graph, analysis, semantic-type lowering, and target projection all
 * speak through this closed relation algebra. No layer owns semantic meaning
 * through traversal state or host-language absence.
 */

import type { SourceSpan } from './provenance';
import type { PhpAstExpressionKind } from './phpAstSyntaxKind';
import type {
  AstDerivation,
  AstDiagnostic,
  AstNodeIdentity,
  AstRelationFact,
  AstRelationFacts,
  AstRelationName,
  AstRelationTerm,
  AstResolutionStatus,
  AstRuleName,
  AstRelationFactSequence,
  AstWitnessName,
} from './ast';
import { astSequenceOperations } from './ast';
import {
  relationAny,
  relationAll,
  relationEqual,
  relationFixedPoint,
  relationFold,
  relationSelect,
  relationProject,
  relationResolve,
  relationVariantFold,
} from '../../semantic/relations/relationalSequence';
import { relationUnique } from '../../semantic/relations/relationMembership';
import { numberValue, stringValue, type NumberValue, type StringValue } from './valueObjects';
import { semanticReasoningContract, type SemanticReasoningContract } from './semanticReasoning';

export type AstSemanticStage =
  | 'scanner_evidence'
  | 'upstream_mapping'
  | 'resolver_graph'
  | 'analysis'
  | 'semantic_type_lowering'
  | 'target_projection';

export type AstSemanticRelationName =
  | AstRelationName
  | 'scanner_observes' | 'scanner_tokens' | 'scanner_syntax' | 'scanner_diagnostic'
  | 'upstream_maps' | 'upstream_identity' | 'upstream_origin' | 'upstream_provenance'
  | 'resolver_candidate' | 'resolver_resolves' | 'resolver_conflict' | 'resolver_edge'
  | 'analysis_depends' | 'analysis_reaches' | 'analysis_dominates' | 'analysis_proves' | 'analysis_dataflow_dependency' | 'analysis_dataflow_value_flow' | 'analysis_dataflow_reaches'
  | 'type_infers' | 'type_refines' | 'type_lowers' | 'type_compatible'
  | 'target_projects' | 'target_emits' | 'target_preserves' | 'target_requires'
  | 'ast_candidate' | 'ast_resolves' | 'ast_conflicts' | 'ast_proves' | 'ast_analyzes' | 'ast_types' | 'ast_lowers' | 'ast_projects';

export type AstSemanticTerm =
  | { readonly kind: 'node'; readonly value: AstNodeIdentity }
  | { readonly kind: 'source'; readonly value: SourceSpan }
  | { readonly kind: 'rule'; readonly value: AstRuleName }
  | { readonly kind: 'witness'; readonly value: AstWitnessName }
  | { readonly kind: 'stage'; readonly value: AstSemanticStage }
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'syntax'; readonly value: PhpAstExpressionKind };

export type AstSemanticFact = {
  readonly kind: 'ast_semantic_fact';
  readonly stage: AstSemanticStage;
  readonly relation: AstSemanticRelationName;
  readonly subject: AstSemanticTerm;
  readonly object: AstSemanticTerm;
};

export type AstSemanticFacts = {
  readonly kind: 'ast_semantic_facts';
  readonly items: readonly AstSemanticFact[];
};

export type AstSemanticPremise = {
  readonly kind: 'ast_semantic_premise';
  readonly fact: AstSemanticFact;
};

export type AstSemanticRule = {
  readonly kind: 'ast_semantic_rule';
  readonly name: AstRuleName;
  readonly stage: AstSemanticStage;
  readonly premises: readonly AstSemanticFact[];
  readonly conclusions: readonly AstSemanticFact[];
};

export type AstSemanticDerivation = {
  readonly kind: 'ast_semantic_derivation';
  readonly rule: AstRuleName;
  readonly witness: AstWitnessName;
  readonly premises: readonly AstSemanticPremise[];
  readonly conclusions: readonly AstSemanticFact[];
};

/** Closure-specific derivations carry an explicit round for well-founded replay. */
export type AstSemanticClosureDerivation = AstSemanticDerivation & Readonly<{
  readonly round: AstSemanticRoundCount;
}>;

/** Domain identity: the tag prevents unrelated identity classes being interchanged. */
export type AstSemanticRequestIdentity = Readonly<{
  readonly kind: 'ast_semantic_request_identity';
  readonly value: StringValue;
}>;
export type AstSemanticSeedSnapshotIdentity = Readonly<{
  readonly kind: 'ast_semantic_seed_snapshot_identity';
  readonly canonicalForm: StringValue;
}>;
export type AstSemanticRuleSetIdentity = Readonly<{
  readonly kind: 'ast_semantic_rule_set_identity';
  readonly canonicalForm: StringValue;
}>;
export type AstSemanticFactSetIdentity = Readonly<{
  readonly kind: 'ast_semantic_fact_set_identity';
  readonly canonicalForm: StringValue;
}>;
export type AstSemanticDerivationLedgerIdentity = Readonly<{
  readonly kind: 'ast_semantic_derivation_ledger_identity';
  readonly canonicalForm: StringValue;
}>;
export type AstSemanticRoundLimit = Readonly<{
  readonly kind: 'ast_semantic_round_limit';
  readonly value: NumberValue;
}>;
export type AstSemanticRoundCount = Readonly<{
  readonly kind: 'ast_semantic_round_count';
  readonly value: NumberValue;
}>;

export const astSemanticRequestIdentity = (value: string): AstSemanticRequestIdentity => Object.freeze({
  kind: 'ast_semantic_request_identity',
  value: stringValue.create(value),
});
export const astSemanticRoundLimit = (value: number): AstSemanticRoundLimit => Object.freeze({
  kind: 'ast_semantic_round_limit',
  value: numberValue(value),
});
const astSemanticRoundCount = (value: number): AstSemanticRoundCount => Object.freeze({
  kind: 'ast_semantic_round_count',
  value: numberValue(value),
});
const astSemanticSeedSnapshotIdentity = (canonicalForm: string): AstSemanticSeedSnapshotIdentity => Object.freeze({
  kind: 'ast_semantic_seed_snapshot_identity', canonicalForm: stringValue.create(canonicalForm),
});
const astSemanticRuleSetIdentity = (canonicalForm: string): AstSemanticRuleSetIdentity => Object.freeze({
  kind: 'ast_semantic_rule_set_identity', canonicalForm: stringValue.create(canonicalForm),
});
const astSemanticFactSetIdentity = (canonicalForm: string): AstSemanticFactSetIdentity => Object.freeze({
  kind: 'ast_semantic_fact_set_identity', canonicalForm: stringValue.create(canonicalForm),
});
const astSemanticDerivationLedgerIdentity = (canonicalForm: string): AstSemanticDerivationLedgerIdentity => Object.freeze({
  kind: 'ast_semantic_derivation_ledger_identity', canonicalForm: stringValue.create(canonicalForm),
});

/**
 * Closure input is named so the rule set, seed evidence, and termination bound
 * form one explicit domain contract. Numeric and identity fields are value
 * objects, not interchangeable primitive fields. Invalid limits remain
 * representable so the authority can return a typed incomplete outcome.
 */
export type AstSemanticClosureRequest = Readonly<{
  readonly kind: 'ast_semantic_closure_request';
  readonly requestIdentity: AstSemanticRequestIdentity;
  readonly seed: AstSemanticFacts;
  readonly rules: readonly AstSemanticRule[];
  readonly roundLimit: AstSemanticRoundLimit;
}>;

/**
 * A closure is final only when the authority has observed a fixed point.
 * Reaching the iteration bound is not equivalent to semantic closure.
 */
export type AstSemanticClosure =
  | {
      readonly kind: 'ast_semantic_closure';
      readonly status: 'closed';
      readonly requestIdentity: AstSemanticRequestIdentity;
      readonly seedSnapshotIdentity: AstSemanticSeedSnapshotIdentity;
      readonly ruleSetIdentity: AstSemanticRuleSetIdentity;
      readonly factSetIdentity: AstSemanticFactSetIdentity;
      readonly derivationLedgerIdentity: AstSemanticDerivationLedgerIdentity;
      readonly facts: AstSemanticFacts;
      readonly derivations: readonly AstSemanticClosureDerivation[];
      readonly rounds: AstSemanticRoundCount;
      readonly certificate: {
        readonly kind: 'ast_semantic_fixed_point_certificate';
        readonly stableFacts: true;
        readonly rulesExhausted: true;
        readonly requestIdentity: AstSemanticRequestIdentity;
        readonly seedSnapshotIdentity: AstSemanticSeedSnapshotIdentity;
        readonly ruleSetIdentity: AstSemanticRuleSetIdentity;
        readonly factSetIdentity: AstSemanticFactSetIdentity;
        readonly derivationLedgerIdentity: AstSemanticDerivationLedgerIdentity;
      };
    }
  | {
      readonly kind: 'ast_semantic_closure';
      readonly status: 'incomplete';
      readonly requestIdentity: AstSemanticRequestIdentity;
      readonly seedSnapshotIdentity: AstSemanticSeedSnapshotIdentity;
      readonly ruleSetIdentity: AstSemanticRuleSetIdentity;
      readonly factSetIdentity: AstSemanticFactSetIdentity;
      readonly derivationLedgerIdentity: AstSemanticDerivationLedgerIdentity;
      readonly reason: 'invalid_round_limit' | 'round_limit_reached';
      readonly facts: AstSemanticFacts;
      readonly derivations: readonly AstSemanticClosureDerivation[];
      readonly rounds: AstSemanticRoundCount;
      readonly roundLimit: AstSemanticRoundLimit;
    };

/**
 * Verifies closure-to-request binding and ledger integrity. This is a structural
 * verifier, not a cryptographic authenticity check and not a replacement for
 * checking the semantic soundness of every rule implementation.
 */
export type AstSemanticClosureVerification =
  | Readonly<{
      readonly kind: 'ast_semantic_closure_verification';
      readonly status: 'verified';
      readonly requestIdentity: AstSemanticRequestIdentity;
      readonly seedSnapshotIdentity: AstSemanticSeedSnapshotIdentity;
      readonly ruleSetIdentity: AstSemanticRuleSetIdentity;
      readonly factSetIdentity: AstSemanticFactSetIdentity;
      readonly derivationLedgerIdentity: AstSemanticDerivationLedgerIdentity;
    }>
  | Readonly<{
      readonly kind: 'ast_semantic_closure_verification';
      readonly status: 'rejected';
      readonly reason:
        | 'incomplete_closure'
        | 'invalid_closed_round_bound'
        | 'seed_fact_missing_from_closure'
        | 'request_identity_mismatch'
        | 'seed_snapshot_mismatch'
        | 'rule_set_mismatch'
        | 'fact_set_mismatch'
        | 'derivation_ledger_mismatch'
        | 'certificate_binding_mismatch'
        | 'derivation_rule_unknown'
        | 'derivation_premise_mismatch'
        | 'derivation_premise_not_in_closure'
        | 'derivation_conclusion_mismatch'
        | 'duplicate_rule_identity'
        | 'derivation_replay_mismatch';
    }>;

/** A closure result accepted only after replayable proof verification. */
export type AstSemanticClosureAssessment =
  | Readonly<{
      readonly kind: 'ast_semantic_closure_assessment';
      readonly status: 'accepted';
      readonly closure: Extract<AstSemanticClosure, { readonly status: 'closed' }>;
      readonly verification: Extract<AstSemanticClosureVerification, { readonly status: 'verified' }>;
      readonly reasoning: SemanticReasoningContract<'declarative_relation_rewrite_fixed_point'>;
    }>
  | Readonly<{
      readonly kind: 'ast_semantic_closure_assessment';
      readonly status: 'rejected';
      readonly closure: AstSemanticClosure;
      readonly verification: Extract<AstSemanticClosureVerification, { readonly status: 'rejected' }>;
      readonly reasoning: SemanticReasoningContract<'declarative_relation_rewrite_fixed_point'>;
    }>;

export type AstSemanticJudgment = {
  readonly kind: 'ast_semantic_judgment';
  readonly node: AstNodeIdentity;
  readonly stage: AstSemanticStage;
  readonly facts: AstSemanticFacts;
  readonly status: AstResolutionStatus;
  readonly diagnostics: readonly AstDiagnostic[];
  readonly derivation: AstDerivation;
};

export type AstSemanticProjection = {
  readonly kind: 'ast_semantic_projection';
  readonly stage: 'target_projection';
  readonly facts: AstSemanticFacts;
};

export type AstSemanticInterface = {
  /** Declares the reasoning strategy that owns closure and proof replay. */
  readonly reasoning: SemanticReasoningContract<'declarative_relation_rewrite_fixed_point'>;
  readonly fact: (
    stage: AstSemanticStage,
    relation: AstSemanticRelationName,
    subject: AstSemanticTerm,
    object: AstSemanticTerm,
  ) => AstSemanticFact;
  readonly judgment: (
    node: AstNodeIdentity,
    stage: AstSemanticStage,
    facts: AstSemanticFacts,
    status: AstResolutionStatus,
    diagnostics: readonly AstDiagnostic[],
    derivation: AstDerivation,
  ) => AstSemanticJudgment;
  /**
   * Contract laws:
   * - every recorded derivation's premises must be contained in the facts
   *   available before that rule application;
   * - every recorded conclusion must belong to the named rule;
   * - duplicate facts are canonicalized by relation identity;
   * - `status: closed` is permitted only at a fixed point after all rules have
   *   been reconsidered; exhausting the bound must return `incomplete`;
   * - an invalid bound must never be represented as a successful closure.
   */
  readonly close: (request: AstSemanticClosureRequest) => AstSemanticClosure;
  /** Rebinds a closure to its exact request and verifies its structural ledger. */
  readonly verifyClosure: (
    request: AstSemanticClosureRequest,
    closure: AstSemanticClosure,
  ) => AstSemanticClosureVerification;
  /** Close and verify as one authority operation; consumers cannot accidentally treat an unverified closure as accepted. */
  readonly closeVerified: (request: AstSemanticClosureRequest) => AstSemanticClosureAssessment;
  readonly project: (
    facts: AstSemanticFacts,
  ) => AstSemanticProjection;
};

export const astSemanticFact = (
  stage: AstSemanticStage,
  relation: AstSemanticRelationName,
  subject: AstSemanticTerm,
  object: AstSemanticTerm,
): AstSemanticFact => Object.freeze({
  kind: 'ast_semantic_fact',
  stage,
  relation,
  subject,
  object,
});

export const astSemanticFacts = (items: readonly AstSemanticFact[]): AstSemanticFacts => Object.freeze({
  kind: 'ast_semantic_facts',
  items: Object.freeze(relationUnique(items)),
});

const semanticFactKey = (fact: AstSemanticFact): string => JSON.stringify([
  fact.stage,
  fact.relation,
  fact.subject,
  fact.object,
]);

/** Canonical set identity is independent of evidence/rule declaration order. */
const canonicalSetIdentity = <Value>(values: readonly Value[], key: (value: Value) => string): string =>
  JSON.stringify([...relationProject(values, key)].sort());

const semanticFactEqual = (left: AstSemanticFact, right: AstSemanticFact): boolean => relationEqual(semanticFactKey(left), semanticFactKey(right));

const appendFacts = (left: AstSemanticFacts, right: AstSemanticFacts): AstSemanticFacts => astSemanticFacts([
  ...left.items,
  ...right.items,
]);

const ruleMatches = (facts: AstSemanticFacts, rule: AstSemanticRule): boolean => relationAll(
  relationProject(rule.premises, premise => relationAny(relationProject(facts.items, fact => semanticFactEqual(premise, fact)))),
);

type AstSemanticClosureState = Readonly<{
  facts: AstSemanticFacts;
  derivations: readonly AstSemanticClosureDerivation[];
  round: number;
}>;

const ruleDerivation = (
  rule: AstSemanticRule,
  round: number,
  conclusions: readonly AstSemanticFact[],
): AstSemanticClosureDerivation => Object.freeze({
  kind: 'ast_semantic_derivation',
  rule: rule.name,
  round: astSemanticRoundCount(round),
  witness: Object.freeze({
    kind: 'ast_witness',
    value: stringValue.create(`${rule.name.value.value}@round:${round}`),
  }),
  premises: Object.freeze(relationProject(rule.premises, fact => Object.freeze({
    kind: 'ast_semantic_premise' as const,
    fact,
  }))),
  conclusions: Object.freeze(conclusions),
});

const deriveRuleApplications = (
  facts: AstSemanticFacts,
  rules: readonly AstSemanticRule[],
  round: number,
): AstSemanticClosureState => {
  const matched = relationSelect(rules, rule => ruleMatches(facts, rule));
  const applications = relationProject(matched, rule => {
    const freshConclusions = relationSelect(rule.conclusions, conclusion =>
      !relationAny(relationProject(facts.items, existing => semanticFactEqual(existing, conclusion))),
    );
    return Object.freeze({
      facts: astSemanticFacts(freshConclusions),
      derivation: freshConclusions.length > 0 ? ruleDerivation(rule, round, freshConclusions) : undefined,
    });
  });
  return relationFold(applications, Object.freeze({ facts: astSemanticFacts([]), derivations: Object.freeze([]), round }) as AstSemanticClosureState,
    (state, application) => Object.freeze({
      facts: appendFacts(state.facts, application.facts),
      derivations: application.derivation === undefined
        ? state.derivations
        : Object.freeze([...state.derivations, application.derivation]),
      round: state.round,
    }));
};

const sameIdentity = (left: { readonly value?: StringValue; readonly canonicalForm?: StringValue }, right: { readonly value?: StringValue; readonly canonicalForm?: StringValue }): boolean =>
  (left.value?.value ?? left.canonicalForm?.value) === (right.value?.value ?? right.canonicalForm?.value);

const verifyClosure = (
  request: AstSemanticClosureRequest,
  closure: AstSemanticClosure,
): AstSemanticClosureVerification => {
  if (closure.status !== 'closed') {
    return Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'incomplete_closure' });
  }
  const requestedRoundLimit = request.roundLimit.value.value;
  const completedRounds = closure.rounds.value.value;
  if (!Number.isSafeInteger(requestedRoundLimit) || requestedRoundLimit < 1
    || !Number.isSafeInteger(completedRounds) || completedRounds < 1 || completedRounds > requestedRoundLimit) {
    return Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'invalid_closed_round_bound' });
  }
  if (!sameIdentity(request.requestIdentity, closure.requestIdentity)) {
    return Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'request_identity_mismatch' });
  }
  const expectedSeed = astSemanticSeedSnapshotIdentity(canonicalSetIdentity(request.seed.items, semanticFactKey));
  if (!sameIdentity(expectedSeed, closure.seedSnapshotIdentity)) {
    return Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'seed_snapshot_mismatch' });
  }
  const expectedRules = astSemanticRuleSetIdentity(canonicalSetIdentity(request.rules, rule => JSON.stringify([rule.name, rule.stage, canonicalSetIdentity(rule.premises, semanticFactKey), canonicalSetIdentity(rule.conclusions, semanticFactKey)])));
  if (!sameIdentity(expectedRules, closure.ruleSetIdentity)) {
    return Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'rule_set_mismatch' });
  }
  if (relationAny(relationProject(request.seed.items, seedFact => !relationAny(relationProject(closure.facts.items, fact => semanticFactEqual(seedFact, fact)))))) {
    return Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'seed_fact_missing_from_closure' });
  }
  const expectedFacts = astSemanticFactSetIdentity(canonicalSetIdentity(closure.facts.items, semanticFactKey));
  if (!sameIdentity(expectedFacts, closure.factSetIdentity)) {
    return Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'fact_set_mismatch' });
  }
  const expectedLedger = astSemanticDerivationLedgerIdentity(JSON.stringify(relationProject(closure.derivations, derivation => JSON.stringify([derivation.rule, derivation.round, derivation.witness, relationProject(derivation.premises, premise => semanticFactKey(premise.fact)), relationProject(derivation.conclusions, semanticFactKey)]))));
  if (!sameIdentity(expectedLedger, closure.derivationLedgerIdentity)) {
    return Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'derivation_ledger_mismatch' });
  }
  const certificate = closure.certificate;
  if (
    !sameIdentity(certificate.requestIdentity, closure.requestIdentity) ||
    !sameIdentity(certificate.seedSnapshotIdentity, closure.seedSnapshotIdentity) ||
    !sameIdentity(certificate.ruleSetIdentity, closure.ruleSetIdentity) ||
    !sameIdentity(certificate.factSetIdentity, closure.factSetIdentity) ||
    !sameIdentity(certificate.derivationLedgerIdentity, closure.derivationLedgerIdentity) ||
    certificate.stableFacts !== true || certificate.rulesExhausted !== true
  ) {
    return Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'certificate_binding_mismatch' });
  }
  const ruleNames = relationProject(request.rules, rule => rule.name.value.value);
  if (new Set(ruleNames).size !== ruleNames.length) {
    return Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'duplicate_rule_identity' });
  }

  // Replay the derivation ledger from the seed, round by round. A fact derived
  // in round N cannot justify a premise until round N+1; this prevents cyclic
  // or otherwise unsupported facts from being accepted merely because they
  // appear in the final fact set.
  const derivationKey = (rule: AstRuleName, round: number): string =>
    JSON.stringify([rule.value.value, round]);
  const recordedByKey = new Map<string, AstSemanticClosureDerivation>();
  for (const derivation of closure.derivations) {
    const round = derivation.round.value.value;
    if (!Number.isSafeInteger(round) || round < 1 || round > completedRounds) {
      return Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'derivation_replay_mismatch' });
    }
    const key = derivationKey(derivation.rule, round);
    if (recordedByKey.has(key)) {
      return Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'derivation_replay_mismatch' });
    }
    recordedByKey.set(key, derivation);
  }

  let replayFacts = request.seed;
  const replayedDerivationKeys = new Set<string>();
  for (let round = 1; round <= completedRounds; round += 1) {
    const roundStartFacts = replayFacts;
    const roundConclusions: AstSemanticFact[] = [];
    for (const rule of request.rules) {
      if (!ruleMatches(roundStartFacts, rule)) continue;
      const freshConclusions = relationSelect(rule.conclusions, conclusion =>
        !relationAny(relationProject(roundStartFacts.items, existing => semanticFactEqual(existing, conclusion))),
      );
      if (freshConclusions.length === 0) continue;
      const key = derivationKey(rule.name, round);
      const derivation = recordedByKey.get(key);
      if (derivation === undefined) {
        return Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'derivation_replay_mismatch' });
      }
      const expectedPremises = canonicalSetIdentity(rule.premises, semanticFactKey);
      const recordedPremises = canonicalSetIdentity(relationProject(derivation.premises, premise => premise.fact), semanticFactKey);
      const expectedConclusions = canonicalSetIdentity(freshConclusions, semanticFactKey);
      const recordedConclusions = canonicalSetIdentity(derivation.conclusions, semanticFactKey);
      const expectedWitness = `${rule.name.value.value}@round:${round}`;
      if (
        derivation.rule.value.value !== rule.name.value.value ||
        expectedPremises !== recordedPremises ||
        expectedConclusions !== recordedConclusions ||
        derivation.witness.value.value !== expectedWitness
      ) {
        return Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'derivation_replay_mismatch' });
      }
      replayedDerivationKeys.add(key);
      roundConclusions.push(...freshConclusions);
    }
    replayFacts = appendFacts(roundStartFacts, astSemanticFacts(roundConclusions));
  }
  if (
    replayedDerivationKeys.size !== recordedByKey.size ||
    canonicalSetIdentity(replayFacts.items, semanticFactKey) !== canonicalSetIdentity(closure.facts.items, semanticFactKey)
  ) {
    return Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'derivation_replay_mismatch' });
  }
  // A claimed fixed point must have no enabled rule with a missing conclusion.
  if (relationAny(relationProject(request.rules, rule =>
    ruleMatches(closure.facts, rule) && relationAny(relationProject(rule.conclusions, conclusion =>
      !relationAny(relationProject(closure.facts.items, fact => semanticFactEqual(fact, conclusion))),
    )),
  ))) {
    return Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'derivation_replay_mismatch' });
  }
  return Object.freeze({
    kind: 'ast_semantic_closure_verification',
    status: 'verified',
    requestIdentity: closure.requestIdentity,
    seedSnapshotIdentity: closure.seedSnapshotIdentity,
    ruleSetIdentity: closure.ruleSetIdentity,
    factSetIdentity: closure.factSetIdentity,
    derivationLedgerIdentity: closure.derivationLedgerIdentity,
  });
};

const closeFacts = (request: AstSemanticClosureRequest): AstSemanticClosure => {
  const { seed, rules, requestIdentity } = request;
  const roundLimit = request.roundLimit.value.value;
  const seedSnapshotIdentity = astSemanticSeedSnapshotIdentity(canonicalSetIdentity(seed.items, semanticFactKey));
  const ruleSetIdentity = astSemanticRuleSetIdentity(canonicalSetIdentity(rules, rule => JSON.stringify([rule.name, rule.stage, canonicalSetIdentity(rule.premises, semanticFactKey), canonicalSetIdentity(rule.conclusions, semanticFactKey)])));
  const closureIdentity = (facts: AstSemanticFacts, derivations: readonly AstSemanticClosureDerivation[]) => Object.freeze({
    requestIdentity,
    seedSnapshotIdentity,
    ruleSetIdentity,
    factSetIdentity: astSemanticFactSetIdentity(canonicalSetIdentity(facts.items, semanticFactKey)),
    derivationLedgerIdentity: astSemanticDerivationLedgerIdentity(JSON.stringify(relationProject(derivations, derivation => JSON.stringify([derivation.rule, derivation.round, derivation.witness, relationProject(derivation.premises, premise => semanticFactKey(premise.fact)), relationProject(derivation.conclusions, semanticFactKey)])))),
  });
  if (!Number.isSafeInteger(roundLimit) || roundLimit < 1) {
    return Object.freeze({
      kind: 'ast_semantic_closure',
      status: 'incomplete',
      ...closureIdentity(seed, Object.freeze([])),
      reason: 'invalid_round_limit',
      facts: seed,
      derivations: Object.freeze([]),
      rounds: astSemanticRoundCount(0),
      roundLimit: request.roundLimit,
    });
  }
  const fixed = relationFixedPoint(
    Object.freeze({ facts: seed, derivations: Object.freeze([]), round: 0 }) as AstSemanticClosureState,
    (current: AstSemanticClosureState) => {
      const nextRound = current.round + 1;
      const applications = deriveRuleApplications(current.facts, rules, nextRound);
      return Object.freeze({
        facts: appendFacts(current.facts, applications.facts),
        derivations: Object.freeze([...current.derivations, ...applications.derivations]),
        round: nextRound,
      });
    },
    (left: AstSemanticClosureState, right: AstSemanticClosureState) => relationEqual(
      JSON.stringify(relationProject(left.facts.items, semanticFactKey)),
      JSON.stringify(relationProject(right.facts.items, semanticFactKey)),
    ),
    roundLimit - 1,
  );
  return fixed.converged
    ? Object.freeze({
        kind: 'ast_semantic_closure',
        status: 'closed',
        ...closureIdentity(fixed.value.facts, fixed.value.derivations),
        facts: fixed.value.facts,
        derivations: fixed.value.derivations,
        rounds: astSemanticRoundCount(fixed.rounds + 1),
        certificate: Object.freeze({
          kind: 'ast_semantic_fixed_point_certificate',
          stableFacts: true as const,
          rulesExhausted: true as const,
          ...closureIdentity(fixed.value.facts, fixed.value.derivations),
        }),
      })
    : Object.freeze({
        kind: 'ast_semantic_closure',
        status: 'incomplete',
        ...closureIdentity(fixed.value.facts, fixed.value.derivations),
        reason: 'round_limit_reached',
        facts: fixed.value.facts,
        derivations: fixed.value.derivations,
        rounds: astSemanticRoundCount(fixed.rounds + 1),
        roundLimit: request.roundLimit,
      });
};

export const createAstSemanticJudgment = (
  node: AstNodeIdentity,
  stage: AstSemanticStage,
  facts: AstSemanticFacts,
  status: AstResolutionStatus,
  diagnostics: readonly AstDiagnostic[],
  derivation: AstDerivation,
): AstSemanticJudgment => Object.freeze({
  kind: 'ast_semantic_judgment',
  node,
  stage,
  facts,
  status,
  diagnostics: Object.freeze(diagnostics),
  derivation,
});

const astSemanticReasoning = semanticReasoningContract('declarative_relation_rewrite_fixed_point');

const closeAndVerify = (request: AstSemanticClosureRequest): AstSemanticClosureAssessment => {
  const closure = closeFacts(request);
  const verification = verifyClosure(request, closure);
  if (closure.status === 'closed' && verification.status === 'verified') {
    return Object.freeze({
      kind: 'ast_semantic_closure_assessment',
      status: 'accepted',
      closure,
      verification,
      reasoning: astSemanticReasoning,
    });
  }
  if (verification.status === 'rejected') {
    return Object.freeze({
      kind: 'ast_semantic_closure_assessment',
      status: 'rejected',
      closure,
      verification,
      reasoning: astSemanticReasoning,
    });
  }
  // A closed closure cannot be rejected by this branch with a verified proof;
  // the discriminated result remains explicit if the contract evolves.
  return Object.freeze({
    kind: 'ast_semantic_closure_assessment',
    status: 'rejected',
    closure,
    verification: Object.freeze({ kind: 'ast_semantic_closure_verification', status: 'rejected', reason: 'incomplete_closure' }),
    reasoning: astSemanticReasoning,
  });
};

export const astSemanticInterface: AstSemanticInterface = Object.freeze({
  reasoning: astSemanticReasoning,
  fact: astSemanticFact,
  judgment: createAstSemanticJudgment,
  close: closeFacts,
  verifyClosure,
  closeVerified: closeAndVerify,
  project: facts => Object.freeze({
    kind: 'ast_semantic_projection',
    stage: 'target_projection',
    facts,
  }),
});

export const astSemanticNodeTerm = (value: AstNodeIdentity): AstSemanticTerm => ({ kind: 'node', value });
export const astSemanticSourceTerm = (value: SourceSpan): AstSemanticTerm => ({ kind: 'source', value });
export const astSemanticRuleTerm = (value: AstRuleName): AstSemanticTerm => ({ kind: 'rule', value });
export const astSemanticWitnessTerm = (value: AstWitnessName): AstSemanticTerm => ({ kind: 'witness', value });
export const astSemanticStageTerm = (value: AstSemanticStage): AstSemanticTerm => ({ kind: 'stage', value });
export const astSemanticTextTerm = (value: string): AstSemanticTerm => ({ kind: 'text', value });
export const astSemanticSyntaxTerm = (value: PhpAstExpressionKind): AstSemanticTerm => ({ kind: 'syntax', value });

const astSemanticTermFromRelation = (term: AstRelationTerm): AstSemanticTerm =>
  relationVariantFold(term, 'ast_term_node',
    () => relationVariantFold(term, 'ast_term_source',
      () => relationVariantFold(term, 'ast_term_rule',
        () => relationVariantFold(term, 'ast_term_witness',
          () => relationVariantFold(term, 'ast_term_surface',
            () => astSemanticTextTerm('invalid_ast_relation_term'),
            value => astSemanticTextTerm(value.value.domain),
          ),
          value => astSemanticWitnessTerm(value.value),
        ),
        value => astSemanticRuleTerm(value.value),
      ),
      value => astSemanticSourceTerm(value.value),
    ),
    value => astSemanticNodeTerm(value.value),
  );

export const astSemanticFactFromRelation = (
  stage: AstSemanticStage,
  relation: AstRelationFact,
): AstSemanticFact => astSemanticFact(
  stage,
  relation.relation,
  astSemanticTermFromRelation(relation.subject),
  astSemanticTermFromRelation(relation.object),
);

const astSemanticFactsFromSequence = (
  stage: AstSemanticStage,
  sequence: AstRelationFactSequence,
  output: readonly AstSemanticFact[] = [],
): AstSemanticFacts => relationVariantFold(sequence, 'ast_sequence_empty',
  () => astSemanticFacts(output),
  () => relationVariantFold(sequence, 'ast_sequence_cons',
    () => astSemanticFacts(output),
    current => astSemanticFactsFromSequence(stage, current.tail, [...output, astSemanticFactFromRelation(stage, current.head)]),
  ),
);

export const astSemanticFactsFromRelations = (
  stage: AstSemanticStage,
  relations: AstRelationFacts,
): AstSemanticFacts => astSemanticFactsFromSequence(stage, relations.items);

export const emptyAstSemanticFacts = (): AstSemanticFacts => astSemanticFacts([]);

export interface AstSemanticRelationSequenceFactoryInterface {
  readonly empty: () => AstRelationFactSequence;
  readonly cons: (head: AstRelationFact, tail: AstRelationFactSequence) => AstRelationFactSequence;
  readonly consWithEmptyTail: (head: AstRelationFact) => AstRelationFactSequence;
}

export const astSemanticRelationSequenceFactory: AstSemanticRelationSequenceFactoryInterface = Object.freeze({
  empty: () => astSequenceOperations.emptyRelationFacts(),
  cons: (head: AstRelationFact, tail: AstRelationFactSequence): AstRelationFactSequence => astSequenceOperations.consRelationFact(head, tail),
  consWithEmptyTail: (head: AstRelationFact): AstRelationFactSequence => astSequenceOperations.consRelationFactWithEmptyTail(head),
});
