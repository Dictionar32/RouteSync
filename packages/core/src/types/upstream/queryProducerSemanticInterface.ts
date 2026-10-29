import type { Expression, ModelStaticOperation, OrderDirection, QueryDatePart, QueryDateRelative, QueryGrouping, QueryJoin, QueryRelationAggregate, QueryRelationAggregateFunction } from './expression';
import type { QueryOperationAst } from './query';
import type { MethodName, ModelName, PropertyName, RelationName } from './names';
import type { DescriptionText, NumberValue } from './valueObjects';
import type { SourceSpan } from './provenance';
type RelationNoneValue = unknown;

export type QueryJoinMethodName =
  | 'join' | 'leftJoin' | 'rightJoin' | 'crossJoin'
  | 'joinSub' | 'leftJoinSub' | 'rightJoinSub' | 'crossJoinSub'
  | 'joinLateral' | 'leftJoinLateral' | 'straightJoin' | 'straightJoinSub';

export type QueryArgumentPosition = Readonly<{ readonly kind: 'query_argument_position'; readonly value: NumberValue }>;

export type QueryJoinDescriptor = Readonly<{
  readonly target: 'table' | 'subquery' | 'lateral';
  readonly type: 'inner' | 'left' | 'right' | 'cross' | 'straight';
  readonly aliasIndex: RelationOption<QueryArgumentPosition>;
  readonly constraintIndex: RelationOption<QueryArgumentPosition>;
}>;

/** Closed lookup result: unknown Laravel query vocabulary is not a partial value. */
export type QuerySemanticDiagnostic = Readonly<{ readonly kind: 'query_semantic_diagnostic'; readonly message: DescriptionText }>;

export type QueryProducerSemanticJudgment<T> =
  | Readonly<{ readonly kind: 'not_applicable' }>
  | Readonly<{ readonly kind: 'resolved'; readonly value: T }>
  | Readonly<{ readonly kind: 'malformed'; readonly diagnostic: QuerySemanticDiagnostic }>;

/** Typed evidence for one source-level named query operation. */
export type QueryOperationEvidence = Readonly<{
  readonly methodName: MethodName;
  readonly arguments: readonly Expression[];
}>;

/**
 * Provenance-complete source evidence for the interface-owned semantic model.
 * The payload preserves the existing operation evidence shape while the span
 * travels with it as one indivisible source-evidence value.
 */
export type QueryOperationSemanticSourceEvidence = Readonly<{
  readonly kind: 'source_query_operation_evidence';
  readonly span: SourceSpan;
  readonly operation: QueryOperationEvidence;
}>;

/** Closed identities for semantic rule families; these are not source strings. */
export type QueryOperationSemanticRule =
  | Readonly<{ readonly kind: 'query_basic_condition_rule' }>
  | Readonly<{ readonly kind: 'query_join_rule' }>
  | Readonly<{ readonly kind: 'query_range_condition_rule' }>
  | Readonly<{ readonly kind: 'query_membership_condition_rule' }>
  | Readonly<{ readonly kind: 'query_null_condition_rule' }>
  | Readonly<{ readonly kind: 'query_column_range_condition_rule' }>
  | Readonly<{ readonly kind: 'query_value_range_condition_rule' }>
  | Readonly<{ readonly kind: 'query_null_safe_equality_rule' }>
  | Readonly<{ readonly kind: 'query_date_part_condition_rule' }>
  | Readonly<{ readonly kind: 'query_date_relative_condition_rule' }>
  | Readonly<{ readonly kind: 'query_exists_condition_rule' }>
  | Readonly<{ readonly kind: 'query_like_condition_rule' }>
  | Readonly<{ readonly kind: 'query_full_text_condition_rule' }>
  | Readonly<{ readonly kind: 'query_row_value_condition_rule' }>
  | Readonly<{ readonly kind: 'query_column_comparison_condition_rule' }>
  | Readonly<{ readonly kind: 'query_json_condition_rule' }>
  | Readonly<{ readonly kind: 'unclaimed_query_operation_rule' }>;

/** Semantic obligations that a rule must discharge before producing its conclusion. */
export type QueryOperationSemanticPremise =
  | 'method_vocabulary_claimed'
  | 'argument_shape_valid'
  | 'property_or_relation_evidence_resolved'
  | 'operator_evidence_supported'
  | 'nested_query_evidence_validated';

export type QueryOperationSemanticConstraint =
  | 'arity'
  | 'literal_domain'
  | 'operator_domain'
  | 'property_identity'
  | 'relation_identity'
  | 'join_shape'
  | 'nested_query_shape';

/**
 * Evidence anchors accepted by the semantic contract. A receipt must point to
 * source evidence, an authoritative rule declaration, or a nested judgment;
 * a bare boolean cannot establish why an obligation was discharged.
 */
export type QueryOperationSemanticEvidenceAnchor =
  | Readonly<{ readonly kind: 'source_span'; readonly span: SourceSpan }>
  | Readonly<{ readonly kind: 'rule_declaration'; readonly rule: QueryOperationSemanticRuleFamily }>
  | Readonly<{ readonly kind: 'nested_query_judgment'; readonly rule: QueryOperationSemanticRuleFamily; readonly methodName: string }>;

/** Closed result algebra for one premise or constraint obligation. */
export type QueryOperationSemanticObligationReceipt<Obligation extends string> =
  | Readonly<{ readonly obligation: Obligation; readonly result: 'satisfied'; readonly evidence: QueryOperationSemanticEvidenceAnchor }>
  | Readonly<{ readonly obligation: Obligation; readonly result: 'violated'; readonly evidence: QueryOperationSemanticEvidenceAnchor; readonly diagnostic: QuerySemanticDiagnostic }>
  | Readonly<{ readonly obligation: Obligation; readonly result: 'unproven'; readonly evidence: QueryOperationSemanticEvidenceAnchor; readonly diagnostic: QuerySemanticDiagnostic }>;

export type QueryOperationSemanticSatisfiedReceipt<Obligation extends string> = Readonly<{
  readonly obligation: Obligation;
  readonly result: 'satisfied';
  readonly evidence: QueryOperationSemanticEvidenceAnchor;
}>;

export type QueryOperationSemanticEvaluatedReceipt<Obligation extends string> =
  | QueryOperationSemanticSatisfiedReceipt<Obligation>
  | Extract<QueryOperationSemanticObligationReceipt<Obligation>, { readonly result: 'violated' }>;

export type QueryOperationSemanticPremiseFor<Rule extends QueryOperationSemanticRuleFamily> =
  QueryOperationSemanticRequiredPremises<Rule>[number];
export type QueryOperationSemanticConstraintFor<Rule extends QueryOperationSemanticRuleFamily> =
  QueryOperationSemanticRequiredConstraints<Rule>[number];

/**
 * Total, family-indexed obligation ledger. Mapped keys make omission of any
 * required premise or constraint visible in the type contract. The ledger is
 * a model for derivation evidence, not a claim that existing evaluators already
 * produce these receipts.
 */
export type QueryOperationSemanticObligationLedgerFor<Rule extends QueryOperationSemanticRuleFamily> = Readonly<{
  readonly premises: Readonly<{
    [Premise in QueryOperationSemanticPremiseFor<Rule> as `premise:${Premise}`]: QueryOperationSemanticObligationReceipt<Premise>;
  }>;
  readonly constraints: Readonly<{
    [Constraint in QueryOperationSemanticConstraintFor<Rule> as `constraint:${Constraint}`]: QueryOperationSemanticObligationReceipt<Constraint>;
  }>;
}>;

export type QueryOperationSemanticSatisfiedObligationLedgerFor<Rule extends QueryOperationSemanticRuleFamily> = Readonly<{
  readonly premises: Readonly<{
    [Premise in QueryOperationSemanticPremiseFor<Rule> as `premise:${Premise}`]: QueryOperationSemanticSatisfiedReceipt<Premise>;
  }>;
  readonly constraints: Readonly<{
    [Constraint in QueryOperationSemanticConstraintFor<Rule> as `constraint:${Constraint}`]: QueryOperationSemanticSatisfiedReceipt<Constraint>;
  }>;
}>;

export type QueryOperationSemanticEvaluatedObligationLedgerFor<Rule extends QueryOperationSemanticRuleFamily> = Readonly<{
  readonly premises: Readonly<{
    [Premise in QueryOperationSemanticPremiseFor<Rule> as `premise:${Premise}`]: QueryOperationSemanticEvaluatedReceipt<Premise>;
  }>;
  readonly constraints: Readonly<{
    [Constraint in QueryOperationSemanticConstraintFor<Rule> as `constraint:${Constraint}`]: QueryOperationSemanticEvaluatedReceipt<Constraint>;
  }>;
}>;

/**
 * Interface-level derivation judgment algebra. A resolved judgment requires a
 * fully satisfied ledger; malformed judgments carry an evaluated ledger and a
 * diagnostic; undetermined judgments explicitly retain unproven obligations.
 * This is a target contract for semantic reasoning, separate from runtime
 * evaluator implementation and migration status.
 */
/**
 * Provenance-carrying judgment contract. Unlike the legacy judgment shape,
 * this contract cannot represent source evidence without its source span.
 */
export type QueryOperationSemanticProvenanceJudgmentFor<Rule extends QueryOperationSemanticRuleFamily> =
  | Readonly<{
      readonly kind: 'resolved';
      readonly rule: Rule;
      readonly evidence: QueryOperationSemanticSourceEvidence;
      readonly contract: QueryOperationSemanticRuleDeclarationFor<Rule>;
      readonly obligations: QueryOperationSemanticSatisfiedObligationLedgerFor<Rule>;
      readonly conclusion: Readonly<{
        readonly kind: 'query_operation_ast';
        readonly family: Rule;
        readonly operation: QueryOperationAst;
      }>;
    }>
  | Readonly<{
      readonly kind: 'malformed';
      readonly rule: Rule;
      readonly evidence: QueryOperationSemanticSourceEvidence;
      readonly contract: QueryOperationSemanticRuleDeclarationFor<Rule>;
      readonly obligations: QueryOperationSemanticEvaluatedObligationLedgerFor<Rule>;
      readonly conclusion: QuerySemanticDiagnostic;
    }>
  | Readonly<{
      readonly kind: 'undetermined';
      readonly rule: Rule;
      readonly evidence: QueryOperationSemanticSourceEvidence;
      readonly contract: QueryOperationSemanticRuleDeclarationFor<Rule>;
      readonly obligations: QueryOperationSemanticObligationLedgerFor<Rule>;
      readonly diagnostic: QuerySemanticDiagnostic;
    }>;

export type QueryOperationSemanticProvenanceJudgment = {
  [Rule in QueryOperationSemanticRuleFamily]: QueryOperationSemanticProvenanceJudgmentFor<Rule>
}[QueryOperationSemanticRuleFamily];

export type QueryOperationSemanticDerivationJudgmentFor<Rule extends QueryOperationSemanticRuleFamily> =
  | Readonly<{
      readonly kind: 'resolved';
      readonly rule: Rule;
      readonly evidence: QueryOperationEvidence;
      readonly contract: QueryOperationSemanticRuleDeclarationFor<Rule>;
      readonly obligations: QueryOperationSemanticSatisfiedObligationLedgerFor<Rule>;
      readonly conclusion: Readonly<{ readonly kind: 'query_operation_ast'; readonly family: Rule }>;
    }>
  | Readonly<{
      readonly kind: 'malformed';
      readonly rule: Rule;
      readonly evidence: QueryOperationEvidence;
      readonly contract: QueryOperationSemanticRuleDeclarationFor<Rule>;
      readonly obligations: QueryOperationSemanticEvaluatedObligationLedgerFor<Rule>;
      readonly conclusion: QuerySemanticDiagnostic;
    }>
  | Readonly<{
      readonly kind: 'undetermined';
      readonly rule: Rule;
      readonly evidence: QueryOperationEvidence;
      readonly contract: QueryOperationSemanticRuleDeclarationFor<Rule>;
      readonly obligations: QueryOperationSemanticObligationLedgerFor<Rule>;
      readonly diagnostic: QuerySemanticDiagnostic;
    }>;

export type QueryOperationSemanticDerivationJudgment = {
  [Rule in QueryOperationSemanticRuleFamily]: QueryOperationSemanticDerivationJudgmentFor<Rule>
}[QueryOperationSemanticRuleFamily];

/**
 * Rule-specific obligations are part of the semantic model, not optional
 * documentation. A declaration cannot claim a rule family while omitting the
 * minimum premises and constraints that give that family its meaning.
 */
const freezeSemanticTuple = <const Values extends readonly unknown[]>(values: Values): Readonly<Values> =>
  Object.freeze(values);

const queryOperationRuleRequirement = <
  const Premises extends readonly QueryOperationSemanticPremise[],
  const Constraints extends readonly QueryOperationSemanticConstraint[],
>(
  premises: Premises,
  constraints: Constraints,
) => Object.freeze({
  // Preserve tuple-level knowledge and runtime immutability: rule obligations
  // are part of the type contract, not merely arrays checked after startup.
  premises: freezeSemanticTuple(premises),
  constraints: freezeSemanticTuple(constraints),
});

export interface QueryOperationSemanticRuleRequirementsInterface {
  readonly [rule: string]: Readonly<{
    readonly premises: readonly QueryOperationSemanticPremise[];
    readonly constraints: readonly QueryOperationSemanticConstraint[];
  }>;
}

export const queryOperationSemanticRuleRequirements: QueryOperationSemanticRuleRequirementsInterface = Object.freeze({
  query_join_rule: queryOperationRuleRequirement(['method_vocabulary_claimed', 'argument_shape_valid'], ['arity', 'join_shape', 'nested_query_shape']),
  query_basic_condition_rule: queryOperationRuleRequirement(['method_vocabulary_claimed', 'argument_shape_valid', 'property_or_relation_evidence_resolved', 'operator_evidence_supported'], ['arity', 'literal_domain', 'operator_domain', 'property_identity']),
  query_range_condition_rule: queryOperationRuleRequirement(['method_vocabulary_claimed', 'argument_shape_valid', 'property_or_relation_evidence_resolved', 'operator_evidence_supported'], ['arity', 'property_identity', 'literal_domain']),
  query_membership_condition_rule: queryOperationRuleRequirement(['method_vocabulary_claimed', 'argument_shape_valid', 'property_or_relation_evidence_resolved', 'operator_evidence_supported'], ['arity', 'property_identity', 'literal_domain']),
  query_null_condition_rule: queryOperationRuleRequirement(['method_vocabulary_claimed', 'argument_shape_valid', 'property_or_relation_evidence_resolved'], ['arity', 'property_identity']),
  query_column_range_condition_rule: queryOperationRuleRequirement(['method_vocabulary_claimed', 'argument_shape_valid', 'property_or_relation_evidence_resolved', 'operator_evidence_supported'], ['arity', 'property_identity', 'operator_domain']),
  query_value_range_condition_rule: queryOperationRuleRequirement(['method_vocabulary_claimed', 'argument_shape_valid', 'property_or_relation_evidence_resolved', 'operator_evidence_supported'], ['arity', 'property_identity', 'operator_domain', 'literal_domain']),
  query_null_safe_equality_rule: queryOperationRuleRequirement(['method_vocabulary_claimed', 'argument_shape_valid', 'property_or_relation_evidence_resolved', 'operator_evidence_supported'], ['arity', 'property_identity', 'operator_domain']),
  query_date_part_condition_rule: queryOperationRuleRequirement(['method_vocabulary_claimed', 'argument_shape_valid', 'property_or_relation_evidence_resolved', 'operator_evidence_supported'], ['arity', 'property_identity', 'operator_domain', 'literal_domain']),
  query_date_relative_condition_rule: queryOperationRuleRequirement(['method_vocabulary_claimed', 'argument_shape_valid', 'property_or_relation_evidence_resolved'], ['arity', 'property_identity']),
  query_exists_condition_rule: queryOperationRuleRequirement(['method_vocabulary_claimed', 'argument_shape_valid', 'nested_query_evidence_validated'], ['arity', 'relation_identity', 'nested_query_shape']),
  query_like_condition_rule: queryOperationRuleRequirement(['method_vocabulary_claimed', 'argument_shape_valid', 'property_or_relation_evidence_resolved', 'operator_evidence_supported'], ['arity', 'property_identity', 'literal_domain']),
  query_full_text_condition_rule: queryOperationRuleRequirement(['method_vocabulary_claimed', 'argument_shape_valid', 'property_or_relation_evidence_resolved', 'operator_evidence_supported'], ['arity', 'property_identity', 'literal_domain']),
  query_row_value_condition_rule: queryOperationRuleRequirement(['method_vocabulary_claimed', 'argument_shape_valid', 'property_or_relation_evidence_resolved', 'operator_evidence_supported'], ['arity', 'property_identity', 'literal_domain']),
  query_column_comparison_condition_rule: queryOperationRuleRequirement(['method_vocabulary_claimed', 'argument_shape_valid', 'property_or_relation_evidence_resolved', 'operator_evidence_supported'], ['arity', 'property_identity', 'operator_domain']),
  query_json_condition_rule: queryOperationRuleRequirement(['method_vocabulary_claimed', 'argument_shape_valid', 'property_or_relation_evidence_resolved', 'operator_evidence_supported'], ['arity', 'property_identity', 'literal_domain', 'operator_domain']),
}) satisfies Readonly<Record<Exclude<QueryOperationSemanticRule['kind'], 'unclaimed_query_operation_rule'>, Readonly<{
  premises: readonly QueryOperationSemanticPremise[];
  constraints: readonly QueryOperationSemanticConstraint[];
}>>>;

/**
 * Declarative semantic rule contract. The rule model states its domain, proof
 * obligations, constraints, and conclusion; an executor may implement those
 * obligations, but must not invent a different rule identity or conclusion.
 */
export type QueryOperationSemanticRuleFamily = Exclude<
  QueryOperationSemanticRule['kind'],
  'unclaimed_query_operation_rule'
>;

type QueryOperationSemanticRequiredPremises<Rule extends QueryOperationSemanticRuleFamily> =
  Rule extends QueryOperationSemanticRuleFamily
    ? typeof queryOperationSemanticRuleRequirements[Rule]['premises']
    : never;
type QueryOperationSemanticRequiredConstraints<Rule extends QueryOperationSemanticRuleFamily> =
  Rule extends QueryOperationSemanticRuleFamily
    ? typeof queryOperationSemanticRuleRequirements[Rule]['constraints']
    : never;

/**
 * Family-indexed declaration contract. A rule declaration must carry every
 * premise and constraint required by its own family at compile time; runtime
 * catalog validation remains a second line of defense for dynamic data.
 */
export type QueryOperationSemanticRuleDeclarationFor<
  Rule extends QueryOperationSemanticRuleFamily,
> = Readonly<{
  readonly rule: Rule;
  readonly methods: readonly string[];
  readonly evidence: Readonly<{
    readonly kind: 'query_operation_evidence';
    readonly fields: readonly ['methodName', 'arguments'];
  }>;
  readonly premises: readonly [
    ...QueryOperationSemanticRequiredPremises<Rule>,
    ...QueryOperationSemanticPremise[],
  ];
  readonly constraints: readonly [
    ...QueryOperationSemanticRequiredConstraints<Rule>,
    ...QueryOperationSemanticConstraint[],
  ];
  readonly conclusion: Readonly<{
    readonly kind: 'query_operation_ast';
    readonly family: Rule;
  }>;
  readonly outcomes: readonly ['resolved', 'malformed', 'undetermined'];
}>;

/** Closed algebraic union: the rule tag determines its mandatory obligations. */
export type QueryOperationSemanticRuleDeclaration = {
  [Rule in QueryOperationSemanticRuleFamily]: QueryOperationSemanticRuleDeclarationFor<Rule>
}[QueryOperationSemanticRuleFamily];

/**
 * Catalog validation is part of the semantic model, not a scanner concern.
 * A catalog is authoritative only when every declaration is complete and no
 * source method is claimed by more than one rule.
 */
export type QueryOperationSemanticRuleCatalogValidation =
  | Readonly<{ readonly kind: 'valid'; readonly methodCount: number; readonly ruleCount: number }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly violations: readonly Readonly<{
        readonly kind: 'empty_rule_methods' | 'duplicate_method_claim' | 'rule_conclusion_mismatch' | 'missing_premise' | 'missing_constraint' | 'missing_rule_obligation' | 'invalid_evidence_contract' | 'invalid_outcome_contract';
        readonly rule: string;
        readonly method?: string;
        readonly obligation?: 'premise' | 'constraint';
        readonly name?: string;
      }>[];
    }>;

export const validateQueryOperationSemanticRuleCatalog = (
  declarations: readonly QueryOperationSemanticRuleDeclaration[],
): QueryOperationSemanticRuleCatalogValidation => {
  const violations: Array<{
    readonly kind: 'empty_rule_methods' | 'duplicate_method_claim' | 'rule_conclusion_mismatch' | 'missing_premise' | 'missing_constraint' | 'missing_rule_obligation' | 'invalid_evidence_contract' | 'invalid_outcome_contract';
    readonly rule: string;
    readonly method?: string;
    readonly obligation?: 'premise' | 'constraint';
    readonly name?: string;
  }> = [];
  const methodOwners = new Map<string, string>();
  let methodCount = 0;
  for (const declaration of declarations) {
    if (declaration.methods.length === 0) {
      violations.push({ kind: 'empty_rule_methods', rule: declaration.rule });
    }
    if (declaration.conclusion.family !== declaration.rule) {
      violations.push({ kind: 'rule_conclusion_mismatch', rule: declaration.rule });
    }
    if (declaration.premises.length === 0) {
      violations.push({ kind: 'missing_premise', rule: declaration.rule });
    }
    if (declaration.constraints.length === 0) {
      violations.push({ kind: 'missing_constraint', rule: declaration.rule });
    }
    const requirements = queryOperationSemanticRuleRequirements[declaration.rule];
    for (const premise of requirements.premises) {
      if (!declaration.premises.includes(premise)) {
        violations.push({ kind: 'missing_rule_obligation', rule: declaration.rule, obligation: 'premise', name: premise });
      }
    }
    for (const constraint of requirements.constraints) {
      if (!declaration.constraints.includes(constraint)) {
        violations.push({ kind: 'missing_rule_obligation', rule: declaration.rule, obligation: 'constraint', name: constraint });
      }
    }
    if (declaration.evidence.kind !== 'query_operation_evidence' || declaration.evidence.fields.length !== 2 || declaration.evidence.fields[0] !== 'methodName' || declaration.evidence.fields[1] !== 'arguments') {
      violations.push({ kind: 'invalid_evidence_contract', rule: declaration.rule });
    }
    if (declaration.outcomes.length !== 3 || declaration.outcomes[0] !== 'resolved' || declaration.outcomes[1] !== 'malformed' || declaration.outcomes[2] !== 'undetermined') {
      violations.push({ kind: 'invalid_outcome_contract', rule: declaration.rule });
    }
    for (const method of declaration.methods) {
      const owner = methodOwners.get(method);
      if (owner !== undefined) {
        violations.push({ kind: 'duplicate_method_claim', rule: declaration.rule, method });
      } else {
        methodOwners.set(method, declaration.rule);
        methodCount += 1;
      }
    }
  }
  return violations.length > 0
    ? Object.freeze({ kind: 'invalid' as const, violations: Object.freeze(violations.map(violation => Object.freeze(violation))) })
    : Object.freeze({ kind: 'valid' as const, methodCount, ruleCount: declarations.length });
};

/**
 * A rule-carrying decision. Keeping rule identity beside the outcome prevents
 * the wiring layer from having to infer which semantic rule produced it.
 */
/**
 * Result an executor may return after a rule has already claimed the evidence.
 * `not_applicable` is deliberately excluded: ownership was decided by the
 * interface's method-to-rule relation before execution, so an owned operation
 * must resolve or produce a malformed judgment rather than lose its owner.
 */
export type QueryOperationSemanticRuleExecution =
  | Readonly<{ readonly kind: 'resolved'; readonly operation: QueryOperationAst }>
  | Readonly<{ readonly kind: 'malformed'; readonly diagnostic: QuerySemanticDiagnostic }>;

/**
 * Closed public decision. `not_applicable` means no declared rule owns the
 * method; it is not a third possible outcome of executing an owned rule.
 */
/**
 * Interface-owned derivation lineage for a claimed query operation.
 * This records which declared rule owned the evidence and which closed outcome
 * it produced. It is intentionally a derivation record, not a claim that every
 * premise has a machine-checkable proof yet; evaluator-level proof production
 * remains a migration frontier.
 */
export type QueryOperationSemanticDerivationFor<Rule extends QueryOperationSemanticRuleFamily> =
  | Readonly<{
      readonly kind: 'query_operation_derivation';
      readonly rule: Rule;
      readonly methodName: string;
      readonly argumentCount: number;
      readonly outcome: 'resolved';
      readonly conclusion: Readonly<{ readonly kind: 'query_operation_ast'; readonly family: Rule }>;
    }>
  | Readonly<{
      readonly kind: 'query_operation_derivation';
      readonly rule: Rule;
      readonly methodName: string;
      readonly argumentCount: number;
      readonly outcome: 'malformed';
      readonly conclusion: Readonly<{ readonly kind: 'query_semantic_diagnostic' }>;
    }>;

/** Closed union: derivation identity and AST conclusion share one rule family. */
export type QueryOperationSemanticDerivation = {
  [Rule in QueryOperationSemanticRuleFamily]: QueryOperationSemanticDerivationFor<Rule>
}[QueryOperationSemanticRuleFamily];

/**
 * A decision indexed by its owning rule family. The family parameter correlates
 * rule identity, declaration, derivation, and (for resolved outcomes) AST
 * conclusion. A valid declaration from another family cannot be substituted.
 */
export type QueryOperationSemanticDecisionFor<Rule extends QueryOperationSemanticRuleFamily> =
  | Readonly<{
      readonly kind: 'resolved';
      readonly rule: Readonly<{ readonly kind: Rule }>;
      readonly contract: QueryOperationSemanticRuleDeclarationFor<Rule>;
      readonly operation: QueryOperationAst;
      readonly derivation: Extract<QueryOperationSemanticDerivationFor<Rule>, { readonly outcome: 'resolved' }>;
    }>
  | Readonly<{
      readonly kind: 'malformed';
      readonly rule: Readonly<{ readonly kind: Rule }>;
      readonly contract: QueryOperationSemanticRuleDeclarationFor<Rule>;
      readonly diagnostic: QuerySemanticDiagnostic;
      readonly derivation: Extract<QueryOperationSemanticDerivationFor<Rule>, { readonly outcome: 'malformed' }>;
    }>;

/**
 * Closed public decision. For claimed operations, rule, contract, derivation,
 * and conclusion are correlated by family. `not_applicable` is reserved for
 * evidence for which the upstream interface declares no owner.
 */
export type QueryOperationSemanticDecision = {
  [Rule in QueryOperationSemanticRuleFamily]: QueryOperationSemanticDecisionFor<Rule>
}[QueryOperationSemanticRuleFamily]
  | Readonly<{
      readonly kind: 'not_applicable';
      readonly rule: Readonly<{ readonly kind: 'unclaimed_query_operation_rule' }>;
    }>;

/**
 * Source-bound runtime result. Ownership and proof status are correlated with
 * the decision so an unclaimed method cannot accidentally look like an owned
 * operation whose evaluator merely omitted proof receipts.
 */
export type QueryOperationSemanticEvidenceBoundExecution =
  | Readonly<{
      readonly kind: 'query_operation_evidence_bound_execution';
      readonly ownership: 'claimed';
      readonly evidence: QueryOperationSemanticSourceEvidence;
      readonly decision: Exclude<QueryOperationSemanticDecision, { readonly kind: 'not_applicable' }>;
      /** Honest migration status: evaluator-level obligation receipts are not yet emitted. */
      readonly proofStatus: 'evaluator_obligations_not_yet_emitted';
    }>
  | Readonly<{
      readonly kind: 'query_operation_evidence_bound_execution';
      readonly ownership: 'unclaimed';
      readonly evidence: QueryOperationSemanticSourceEvidence;
      readonly decision: Extract<QueryOperationSemanticDecision, { readonly kind: 'not_applicable' }>;
      /** No executor ran because the interface has not claimed this vocabulary. */
      readonly proofStatus: 'not_applicable_no_executor_invoked';
    }>;

/**
 * Runtime verification result for the source-bound authority envelope. This
 * gate protects the scanner boundary from values constructed outside the
 * typed TypeScript path (JavaScript callers, casts, deserialization, stale
 * generated artifacts). It validates ownership, evidence lineage, and the
 * existing decision contract without pretending evaluator obligations are
 * already proven.
 */
export type QueryOperationSemanticEvidenceBoundExecutionValidation =
  | Readonly<{ readonly kind: 'valid' }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly violations: readonly Readonly<{
        readonly kind:
          | 'execution_kind_mismatch'
          | 'ownership_decision_mismatch'
          | 'proof_status_mismatch'
          | 'decision_contract_invalid';
        readonly detail: string;
      }>[];
    }>;

export const validateQueryOperationSemanticEvidenceBoundExecution = (
  execution: QueryOperationSemanticEvidenceBoundExecution,
): QueryOperationSemanticEvidenceBoundExecutionValidation => {
  const violations: Array<{
    readonly kind: Exclude<QueryOperationSemanticEvidenceBoundExecutionValidation, { readonly kind: 'valid' }>['violations'][number]['kind'];
    readonly detail: string;
  }> = [];

  if (execution.kind !== 'query_operation_evidence_bound_execution') {
    violations.push({ kind: 'execution_kind_mismatch', detail: String(execution.kind) });
  }
  if (execution.ownership === 'claimed') {
    if (execution.decision.kind === 'not_applicable') {
      violations.push({ kind: 'ownership_decision_mismatch', detail: 'claimed execution cannot carry not_applicable' });
    } else {
      const decisionValidation = validateQueryOperationSemanticDecision(execution.evidence.operation, execution.decision);
      if (decisionValidation.kind === 'invalid') {
        violations.push({ kind: 'decision_contract_invalid', detail: decisionValidation.violations.map(violation => `${violation.kind}:${violation.detail}`).join(', ') });
      }
    }
    if (execution.proofStatus !== 'evaluator_obligations_not_yet_emitted') {
      violations.push({ kind: 'proof_status_mismatch', detail: String(execution.proofStatus) });
    }
  } else {
    if (execution.decision.kind !== 'not_applicable') {
      violations.push({ kind: 'ownership_decision_mismatch', detail: 'unclaimed execution must carry not_applicable' });
    }
    if (execution.proofStatus !== 'not_applicable_no_executor_invoked') {
      violations.push({ kind: 'proof_status_mismatch', detail: String(execution.proofStatus) });
    }
  }

  return violations.length === 0
    ? Object.freeze({ kind: 'valid' as const })
    : Object.freeze({ kind: 'invalid' as const, violations: Object.freeze(violations.map(violation => Object.freeze(violation))) });
};

/**
 * Runtime integrity result for a closed semantic decision. Type-level unions
 * prevent many mismatches, while this check protects dynamic catalog/evaluator
 * boundaries where values may have crossed JavaScript or deserialization.
 */
export type QueryOperationSemanticDecisionValidation =
  | Readonly<{ readonly kind: 'valid' }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly violations: readonly Readonly<{
        readonly kind:
          | 'decision_rule_mismatch'
          | 'derivation_rule_mismatch'
          | 'contract_rule_mismatch'
          | 'method_not_owned_by_contract'
          | 'derivation_method_mismatch'
          | 'argument_count_mismatch'
          | 'outcome_mismatch'
          | 'conclusion_mismatch'
          | 'missing_premise'
          | 'missing_constraint';
        readonly detail: string;
      }>[];
    }>;

/**
 * Validate that a decision is a judgment of the exact rule that owns its source
 * evidence. This is deliberately separate from catalog validation: catalog
 * validation checks the rule model; this function checks each execution result.
 */
export const validateQueryOperationSemanticDecision = (
  evidence: QueryOperationEvidence,
  decision: QueryOperationSemanticDecision,
): QueryOperationSemanticDecisionValidation => {
  if (decision.kind === 'not_applicable') return Object.freeze({ kind: 'valid' as const });

  const violations: Array<{ readonly kind: Exclude<QueryOperationSemanticDecisionValidation, { readonly kind: 'valid' }>['violations'][number]['kind']; readonly detail: string }> = [];
  const rule = decision.rule.kind;
  if (rule !== decision.contract.rule) {
    violations.push({ kind: 'contract_rule_mismatch', detail: `${rule} != ${decision.contract.rule}` });
  }
  if (rule !== decision.derivation.rule) {
    violations.push({ kind: 'derivation_rule_mismatch', detail: `${rule} != ${decision.derivation.rule}` });
  }
  if (decision.contract.conclusion.family !== rule) {
    violations.push({ kind: 'decision_rule_mismatch', detail: `${rule} != ${decision.contract.conclusion.family}` });
  }
  if (!decision.contract.methods.includes(evidence.methodName.value.value)) {
    violations.push({ kind: 'method_not_owned_by_contract', detail: evidence.methodName.value.value });
  }
  if (decision.derivation.methodName !== evidence.methodName.value.value) {
    violations.push({ kind: 'derivation_method_mismatch', detail: `${decision.derivation.methodName} != ${evidence.methodName.value.value}` });
  }
  if (decision.derivation.argumentCount !== evidence.arguments.length) {
    violations.push({ kind: 'argument_count_mismatch', detail: `${decision.derivation.argumentCount} != ${evidence.arguments.length}` });
  }
  if (decision.derivation.outcome !== decision.kind) {
    violations.push({ kind: 'outcome_mismatch', detail: `${decision.derivation.outcome} != ${decision.kind}` });
  }
  if (decision.kind === 'resolved' && (decision.derivation.conclusion.kind !== 'query_operation_ast' || decision.derivation.conclusion.family !== rule)) {
    violations.push({ kind: 'conclusion_mismatch', detail: `${decision.derivation.conclusion.kind} does not conclude ${rule}` });
  }
  if (decision.kind === 'malformed' && decision.derivation.conclusion.kind !== 'query_semantic_diagnostic') {
    violations.push({ kind: 'conclusion_mismatch', detail: `${decision.derivation.conclusion.kind} is not a diagnostic conclusion` });
  }
  const requirements = queryOperationSemanticRuleRequirements[rule];
  for (const premise of requirements.premises) {
    if (!decision.contract.premises.includes(premise)) violations.push({ kind: 'missing_premise', detail: `${rule}:${premise}` });
  }
  for (const constraint of requirements.constraints) {
    if (!decision.contract.constraints.includes(constraint)) violations.push({ kind: 'missing_constraint', detail: `${rule}:${constraint}` });
  }
  return violations.length === 0
    ? Object.freeze({ kind: 'valid' as const })
    : Object.freeze({ kind: 'invalid' as const, violations: Object.freeze(violations.map(violation => Object.freeze(violation))) });
};


/**
 * Ownership judgment exposed before execution. Consumers can distinguish an
 * unclaimed method from a claimed method without running an evaluator or
 * reconstructing the method-to-rule catalog themselves.
 */
export type QueryOperationSemanticRuleClaim =
  | Readonly<{
      readonly kind: 'claimed';
      readonly contract: QueryOperationSemanticRuleDeclaration;
    }>
  | Readonly<{
      readonly kind: 'unclaimed';
      readonly rule: Readonly<{ readonly kind: 'unclaimed_query_operation_rule' }>;
    }>;

/**
 * Typed hand-off from semantic ownership to an executor. The executor receives
 * source evidence and the exact family-indexed rule contract; it must return a
 * judgment for that same family, rather than reclassifying the method or
 * inventing a second rule catalog.
 *
 * This contract intentionally includes the source span at the execution
 * boundary. QueryOperationEvidence remains the current legacy evidence shape;
 * the authority wiring migration must populate this request from real source
 * provenance before claiming end-to-end proof enforcement.
 */
export type QueryOperationSemanticExecutorRequest<Rule extends QueryOperationSemanticRuleFamily> = Readonly<{
  readonly kind: 'claimed_query_operation_execution';
  readonly evidence: QueryOperationSemanticSourceEvidence;
  readonly contract: QueryOperationSemanticRuleDeclarationFor<Rule>;
}>;

/**
 * Family-indexed executor table: each executor can consume only the contract
 * and evidence for its declared rule family and must preserve that family in
 * its closed judgment. This is the target runtime authority contract, not a
 * claim that the current evaluator table has already migrated to it.
 */
export type QueryOperationSemanticExecutorTable = Readonly<{
  readonly [Rule in QueryOperationSemanticRuleFamily]: (
    request: QueryOperationSemanticExecutorRequest<Rule>
  ) => QueryOperationSemanticProvenanceJudgmentFor<Rule>;
}>;

/**
 * A family-correlated execution plan. The contract, rule identity, source
 * evidence, and executor output are bound together so consumers cannot
 * independently combine a declaration from one family with another input.
 */
export type QueryOperationSemanticOwnedExecutionPlanFor<Rule extends QueryOperationSemanticRuleFamily> = Readonly<{
  readonly kind: 'owned_query_operation_execution_plan';
  readonly rule: Rule;
  /** Exact source evidence used to establish ownership; execution cannot substitute another operation. */
  readonly evidence: QueryOperationSemanticSourceEvidence;
  readonly contract: QueryOperationSemanticRuleDeclarationFor<Rule>;
  /**
   * Evidence and contract are pre-bound by the authority claim. A zero-argument
   * executor prevents callers from pairing this plan with unrelated evidence
   * after ownership has been established.
   */
  readonly execute: () => QueryOperationSemanticProvenanceJudgmentFor<Rule>;
}>;

export type QueryOperationSemanticOwnedExecutionPlan = {
  [Rule in QueryOperationSemanticRuleFamily]: QueryOperationSemanticOwnedExecutionPlanFor<Rule>
}[QueryOperationSemanticRuleFamily];

/**
 * Correlated ownership result for the runtime boundary. A claimed result
 * carries its complete family-indexed plan; an unclaimed result carries no
 * executable plan and therefore cannot be dispatched by accident.
 */
export type QueryOperationSemanticRuntimeClaim =
  | {
      [Rule in QueryOperationSemanticRuleFamily]: Readonly<{
        readonly kind: 'claimed';
        readonly rule: Rule;
        readonly plan: QueryOperationSemanticOwnedExecutionPlanFor<Rule>;
      }>
    }[QueryOperationSemanticRuleFamily]
  | Readonly<{
      readonly kind: 'unclaimed';
      readonly rule: Readonly<{ readonly kind: 'unclaimed_query_operation_rule' }>;
    }>;

/**
 * Runtime authority boundary: ownership resolves directly to a correlated
 * execution plan. The plan is the single contract-bearing dispatch capability;
 * consumers do not pair a broad claim union with a separately indexed executor
 * table and risk losing the family relationship between them.
 */
export interface QueryOperationSemanticRuntimeAuthority {
  readonly rules: readonly QueryOperationSemanticRuleDeclaration[];
  /**
   * Claim against the complete source evidence, not a detached method name.
   * A claimed plan must bind this exact evidence and its owning rule contract;
   * an unclaimed result carries no executable capability.
   */
  readonly claim: (evidence: QueryOperationSemanticSourceEvidence) => QueryOperationSemanticRuntimeClaim;
}

export type ResolvedModelStaticOperation = Readonly<{ readonly model: ModelName; readonly operation: ModelStaticOperation }>;

export interface QueryProducerSemanticInterface {
  /**
   * Authoritative, immutable rule model consumed by resolveQueryOperation.
   * Consumers may inspect semantic ownership without importing executor
   * implementation details or reconstructing a second method catalog.
   */
  readonly queryOperationRules: readonly QueryOperationSemanticRuleDeclaration[];
  readonly resolveModelOrigin: (evidence: Expression) => QueryProducerSemanticJudgment<ModelName>;
  readonly resolveModelStaticOperation: (evidence: Expression) => QueryProducerSemanticJudgment<ResolvedModelStaticOperation>;
  readonly resolvePropertyName: (evidence: Expression | RelationNoneValue) => QueryProducerSemanticJudgment<PropertyName>;
  readonly resolveRelationName: (evidence: Expression | RelationNoneValue) => QueryProducerSemanticJudgment<RelationName>;
  readonly resolveOrderingDirection: (evidence: Expression | RelationNoneValue) => QueryProducerSemanticJudgment<OrderDirection>;
  readonly resolveRelationAggregateFunction: (methodName: MethodName) => QueryProducerSemanticJudgment<QueryRelationAggregateFunction>;
  readonly resolveRelationAggregate: (methodName: MethodName, arguments_: readonly Expression[], source: SourceSpan) => QueryProducerSemanticJudgment<QueryRelationAggregate>;
  readonly resolveQueryJoin: (methodName: MethodName, arguments_: readonly Expression[]) => QueryProducerSemanticJudgment<QueryJoin>;
  /**
   * Single interface-first entry point for query operation rule families already
   * owned by upstream algebra. An unclaimed result is explicit and must not be
   * confused with malformed evidence; remaining legacy families are tracked as
   * a migration frontier rather than silently classified here.
   */
  readonly resolveQueryOperationRule: (methodName: MethodName) => QueryOperationSemanticRuleClaim;
  readonly resolveQueryOperation: (evidence: QueryOperationEvidence) => QueryOperationSemanticDecision;
  /** Preferred source-bound entry point for scanner/runtime wiring. */
  readonly resolveQueryOperationEvidence: (evidence: QueryOperationSemanticSourceEvidence) => QueryOperationSemanticEvidenceBoundExecution;
  /** Resolves a source-level query method into a closed operation judgment. */
  readonly resolveQueryJoinOperation: (methodName: MethodName, arguments_: readonly Expression[]) => QueryProducerSemanticJudgment<QueryOperationAst>;
  /** Resolves basic where-family methods into closed query-operation judgments. */
  readonly resolveQueryBasicOperation: (methodName: MethodName, arguments_: readonly Expression[]) => QueryProducerSemanticJudgment<QueryOperationAst>;
  readonly resolveRelationPath: (evidence: Expression | RelationNoneValue) => QueryProducerSemanticJudgment<RelationPath>;
  readonly resolveQueryGrouping: (evidence: readonly Expression[]) => QueryProducerSemanticJudgment<QueryGrouping>;
  readonly resolveQueryDatePart: (methodName: MethodName) => QueryProducerSemanticJudgment<QueryDatePart>;
  readonly resolveQueryDateRelative: (methodName: MethodName) => QueryProducerSemanticJudgment<QueryDateRelative>;
  readonly toLegacyOption: <T>(judgment: QueryProducerSemanticJudgment<T>) => RelationOption<T>;
}
