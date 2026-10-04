/**
 * RouteSync AST semantic interface — highest compiler boundary.
 *
 * The AST judgment remains the SSOT. Scanner evidence, upstream mapping,
 * resolver graph, analysis, semantic-type lowering, and target projection all
 * speak through this closed relation algebra. No layer owns semantic meaning
 * through traversal state or host-language absence.
 */

import type { SourceSpan } from './provenance';
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
  AstSequence,
  AstWitnessName,
} from './ast';
import {
  astSequenceCons,
  emptyAstSequence,
} from './ast';
import {
  relationAny,
  relationAll,
  relationEqual,
  relationFixedPoint,
  relationFold,
  relationProject,
  relationResolve,
  relationVariantFold,
} from '../../semantic/kernel/relationalSequence';
import { relationUnique } from '../../semantic/kernel/relationMembership';

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
  | { readonly kind: 'text'; readonly value: string };

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

export type AstSemanticClosure = {
  readonly kind: 'ast_semantic_closure';
  readonly facts: AstSemanticFacts;
  readonly derivations: readonly AstSemanticDerivation[];
  readonly rounds: number;
  readonly converged: boolean;
};

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
  readonly close: (
    seed: AstSemanticFacts,
    rules: readonly AstSemanticRule[],
    maxRounds: number,
  ) => AstSemanticClosure;
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

const semanticFactEqual = (left: AstSemanticFact, right: AstSemanticFact): boolean => relationEqual(semanticFactKey(left), semanticFactKey(right));

const appendFacts = (left: AstSemanticFacts, right: AstSemanticFacts): AstSemanticFacts => astSemanticFacts([
  ...left.items,
  ...right.items,
]);

const ruleMatches = (facts: AstSemanticFacts, rule: AstSemanticRule): boolean => relationAll(
  relationProject(rule.premises, premise => relationAny(relationProject(facts.items, fact => semanticFactEqual(premise, fact)))),
);

const applyRules = (facts: AstSemanticFacts, rules: readonly AstSemanticRule[]): AstSemanticFacts => {
  const emissions = relationProject(
    rules,
    rule => relationResolve(
      ruleMatches(facts, rule),
      () => astSemanticFacts(rule.conclusions),
      () => astSemanticFacts([]),
    ),
  );
  return relationFold(emissions, astSemanticFacts([]), (state, entry) => appendFacts(state, entry));
};

const closeFacts = (
  seed: AstSemanticFacts,
  rules: readonly AstSemanticRule[],
  maxRounds: number,
): AstSemanticClosure => {
  const fixed = relationFixedPoint(
    seed,
    current => appendFacts(current, applyRules(current, rules)),
    (left, right) => relationEqual(
      JSON.stringify(relationProject(left.items, semanticFactKey)),
      JSON.stringify(relationProject(right.items, semanticFactKey)),
    ),
    maxRounds,
  );
  return Object.freeze({
    kind: 'ast_semantic_closure',
    facts: fixed.value,
    derivations: Object.freeze([]),
    rounds: fixed.rounds,
    converged: fixed.converged,
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

export const astSemanticInterface: AstSemanticInterface = Object.freeze({
  fact: astSemanticFact,
  judgment: createAstSemanticJudgment,
  close: closeFacts,
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
  sequence: AstSequence<AstRelationFact>,
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
export const emptyAstSemanticSequence = <T>(): AstSequence<T> => emptyAstSequence<T>();
export const astSemanticSequenceCons = <T>(head: T, tail: AstSequence<T>): AstSequence<T> => astSequenceCons(head, tail);
