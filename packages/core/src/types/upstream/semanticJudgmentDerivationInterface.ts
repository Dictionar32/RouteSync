/**
 * Framework-neutral contract for declarative semantic judgment derivations.
 *
 * Literal vocabulary is caller-owned and generic. This contract deliberately has no
 * dependency on the legacy relation-engine location; a runtime adapter is responsible for translating
 * the declared domain into whichever execution protocol it uses.
 */
export type SemanticJudgmentRuleTerm<TAtom = unknown> =
  | Readonly<{ readonly kind: 'variable'; readonly name: string }>
  | Readonly<{ readonly kind: 'literal'; readonly value: TAtom }>;

export interface SemanticJudgmentRelationPattern<
  R extends string = string,
  TAtom = unknown,
> {
  readonly relation: R;
  readonly arguments: readonly SemanticJudgmentRuleTerm<TAtom>[];
  readonly polarity: 'positive' | 'negative';
}

export interface SemanticJudgmentDerivationProgram<
  R extends string = string,
  TAtom = unknown,
> {
  readonly kind: 'semantic_judgment_derivation_program';
  readonly premises: readonly SemanticJudgmentRelationPattern<R, TAtom>[];
  readonly conclusions: readonly SemanticJudgmentRelationPattern<R, TAtom>[];
  readonly proof: Readonly<{
    readonly retainPremiseWitnesses: true;
    readonly retainBindings: true;
  }>;
}

export interface SemanticJudgmentRuleDefinition<
  R extends string = string,
  TAtom = unknown,
> {
  readonly id: string;
  readonly priority: number;
  readonly derivation: SemanticJudgmentDerivationProgram<R, TAtom>;
}

/**
 * High-level semantic laws. Domain models declare semantic relationships; they do
 * not assemble relation-pattern instructions or compiler templates. The generic
 * compiler owns the lowering of these reusable laws into executable rule IR.
 */
export type SemanticJudgmentLaw<R extends string = string, TAtom = unknown> =
  | Readonly<{
      readonly kind: 'evidence-presence';
      readonly id: string;
      readonly requested: R;
      readonly evidence: R;
      readonly missing: R;
      readonly priority: number;
    }>
  | Readonly<{
      readonly kind: 'evidence-backed-identity';
      readonly id: string;
      readonly requested: R;
      readonly evidence: R;
      readonly evidenceRole: TAtom;
      readonly candidateEvidence: R;
      readonly resolution: R;
      readonly established: R;
      readonly priority: number;
    }>
  | Readonly<{
      readonly kind: 'uniqueness';
      readonly id: string;
      readonly candidates: R;
      readonly distinctness: R;
      readonly ambiguity: R;
      readonly priority: number;
    }>
  | Readonly<{
      readonly kind: 'ordered-correspondence';
      readonly id: string;
      readonly unresolvedId: string;
      readonly owner: R;
      readonly sourceItems: R;
      readonly targetItems: R;
      readonly targetIndexes: R;
      readonly correspondence: R;
      readonly unresolved: R;
      readonly priority: number;
    }>
  | Readonly<{
      readonly kind: 'effect-projection';
      readonly id: string;
      readonly owner: R;
      readonly sourceEffects: R;
      readonly effectKinds: R;
      readonly projection: R;
      readonly selectedKinds: readonly TAtom[];
      readonly priority: number;
    }>
  | Readonly<{
      readonly kind: 'absence-obligation';
      readonly id: string;
      readonly requested: R;
      readonly evidence: R;
      readonly established: R;
      readonly missing: R;
      readonly priority: number;
    }>;

export interface SemanticJudgmentModel<R extends string = string, TAtom = unknown> {
  readonly kind: 'semantic_judgment_model';
  readonly laws: readonly SemanticJudgmentLaw<R, TAtom>[];
}
