/**
 * Phase 270 — proof-carrying semantic closure.
 *
 * The canonical semantic pipeline is now one construct-free closure operation:
 * typed relations -> constraints -> logical saturation -> rewrite saturation.
 * Source control constructs are not accepted by this API.
 *
 * The engine records provenance of each derived relation so a target lowering
 * can explain not only WHAT is true, but WHY it became true.
 */
import { solveSemanticBehavior, type SemanticBehaviorClosure, type SemanticBehaviorRelation, } from './semanticRelationalBehaviorKernel';
import type { SemanticRelation } from '../../semantic/relations/semanticRewriteEngine';
import { project, retain, visit } from '../../semantic/relations/semanticRelationalCollections';
import { semanticTheoryFact, validateSemanticTheoryFact, type SemanticTheoryFact, type SemanticTheoryAtom } from './semanticRelationTheory';
export interface SemanticClosureEvidence {
    readonly fact: SemanticRelation<SemanticBehaviorRelation>;
    readonly source: 'seed' | 'constraint' | 'rewrite';
    readonly ruleId?: string;
    readonly premises?: readonly SemanticRelation<SemanticBehaviorRelation>[];
}
type SemanticClosureResultBase = Readonly<{
    readonly facts: readonly SemanticRelation<SemanticBehaviorRelation>[];
    readonly evidence: readonly SemanticClosureEvidence[];
    readonly rounds: number;
}>;
export type SemanticClosureResult =
    | (SemanticClosureResultBase & Readonly<{
        readonly status: 'closed';
        readonly closure: 'least_fixed_point';
        readonly saturated: true;
    }>)
    | (SemanticClosureResultBase & Readonly<{
        readonly status: 'incomplete';
        readonly closure: 'round_limit_reached';
        readonly saturated: false;
        readonly phase: 'constraints' | 'rewrite';
        readonly reason: 'max_rounds_exceeded';
    }>);

const canonicalSemanticRelationNames: ReadonlySet<string> = new Set<SemanticBehaviorRelation>([
  'entity', 'condition', 'candidate', 'requires', 'permits', 'excludes', 'precedes', 'reaches',
  'converges', 'recurs', 'invariant', 'depends', 'produces', 'consumes', 'transfers', 'effects',
]);

export type CanonicalSemanticRelationNameJudgment =
  | Readonly<{ kind: 'canonical'; relation: SemanticBehaviorRelation; continueWith: <Output>(branches: Readonly<{ canonical: (relation: SemanticBehaviorRelation) => Output; nonCanonical: (value: string) => Output }>) => Output }>
  | Readonly<{ kind: 'non_canonical'; value: string; continueWith: <Output>(branches: Readonly<{ canonical: (relation: SemanticBehaviorRelation) => Output; nonCanonical: (value: string) => Output }>) => Output }>;

export interface SemanticClosureRuntimeOperationsInterface {
  readonly judgeRelationName: (value: string) => CanonicalSemanticRelationNameJudgment;
  readonly createFact: (relation: SemanticBehaviorRelation, arguments_: readonly SemanticTheoryAtom[]) => SemanticTheoryFact;
  readonly closeRelations: (seed: readonly SemanticTheoryFact[], maxRounds?: number) => SemanticClosureResult;
  readonly closeTheory: (facts: readonly SemanticTheoryFact[], maxRounds?: number) => SemanticClosureResult;
}

const canonicalSemanticRelationNameJudgment = (value: string): CanonicalSemanticRelationNameJudgment => {
  if (canonicalSemanticRelationNames.has(value)) {
    const relation = value as SemanticBehaviorRelation;
    return Object.freeze({ kind: 'canonical', relation, continueWith: <Output>(branches: Readonly<{ canonical: (relation: SemanticBehaviorRelation) => Output; nonCanonical: (value: string) => Output }>) => branches.canonical(relation) });
  }
  return Object.freeze({ kind: 'non_canonical', value, continueWith: <Output>(branches: Readonly<{ canonical: (relation: SemanticBehaviorRelation) => Output; nonCanonical: (value: string) => Output }>) => branches.nonCanonical(value) });
};
const canonicalize = (facts: readonly SemanticTheoryFact[]): readonly SemanticRelation<SemanticBehaviorRelation>[] => {
    const output: SemanticRelation<SemanticBehaviorRelation>[] = [];
    visit(facts, fact => {
        canonicalSemanticRelationNameJudgment(fact.relation).continueWith({
          canonical: relation => {
            validateSemanticTheoryFact(fact);
            output.push(Object.freeze({ relation, arguments: Object.freeze([...fact.arguments]) }));
          },
          nonCanonical: value => { throw Error(`Non-canonical semantic relation '${value}'.`); },
        });
    });
    return Object.freeze(output);
};
/**
 * Execute the entire canonical semantic closure.
 *
 * This is deliberately the only high-level behavior API downstream lowering
 * needs. It consumes relations, never syntax nodes or control constructs.
 */
const closeCanonicalSemanticRelationsImpl = (seed: readonly SemanticTheoryFact[], maxRounds = 64): SemanticClosureResult => {
    const canonicalSeed = canonicalize(seed);
    const closure: SemanticBehaviorClosure = solveSemanticBehavior(canonicalSeed, maxRounds);
    const evidence: SemanticClosureEvidence[] = project(canonicalSeed, fact => ({ fact, source: 'seed' }));
    visit(closure.derivations, derivation => {
        evidence.push({
            fact: derivation.fact,
            source: derivation.stage,
            ruleId: derivation.ruleId,
            premises: derivation.premises,
        });
    });
    const base = {
        facts: closure.facts,
        evidence: Object.freeze(evidence),
        rounds: closure.rounds,
    };
    return closure.status === 'closed'
        ? Object.freeze({ ...base, status: 'closed', closure: 'least_fixed_point', saturated: true })
        : Object.freeze({ ...base, status: 'incomplete', closure: 'round_limit_reached', saturated: false, phase: closure.phase, reason: 'max_rounds_exceeded' });
};

/**
 * Convenience bridge from the canonical model's typed theory facts.
 */
const closeCanonicalSemanticTheoryImpl = (facts: readonly SemanticTheoryFact[], maxRounds = 64): SemanticClosureResult => closeCanonicalSemanticRelationsImpl(facts, maxRounds);
/**
 * A canonical fact constructor that makes the intended boundary explicit to
 * callers and keeps source/control vocabulary out of semantic APIs.
 */
const createCanonicalSemanticFact = (relation: SemanticBehaviorRelation, arguments_: readonly SemanticTheoryAtom[]): SemanticTheoryFact => semanticTheoryFact(relation, arguments_);

export const semanticClosureRuntimeOperations: SemanticClosureRuntimeOperationsInterface = Object.freeze({
  judgeRelationName: canonicalSemanticRelationNameJudgment,
  createFact: createCanonicalSemanticFact,
  closeRelations: closeCanonicalSemanticRelationsImpl,
  closeTheory: closeCanonicalSemanticTheoryImpl,
});
