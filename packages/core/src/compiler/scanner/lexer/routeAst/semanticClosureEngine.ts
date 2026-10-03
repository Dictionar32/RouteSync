import { relationResolve } from '../../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';
import { relationContains, relationUnique } from '../../../../semantic/kernel/relationMembership';
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
import type { SemanticRelation } from './semanticRewriteEngine';
import { project, retain, visit } from './semanticRelationalCollections';
import { semanticTheoryFact, validateSemanticTheoryFact, type SemanticTheoryFact, type SemanticTheoryAtom } from './semanticRelationTheory';
export interface SemanticClosureEvidence {
    readonly fact: SemanticRelation<SemanticBehaviorRelation>;
    readonly source: 'seed' | 'constraint' | 'rewrite';
    readonly ruleId?: string;
    readonly premises?: readonly SemanticRelation<SemanticBehaviorRelation>[];
}
export interface SemanticClosureResult {
    readonly facts: readonly SemanticRelation<SemanticBehaviorRelation>[];
    readonly evidence: readonly SemanticClosureEvidence[];
    readonly rounds: number;
    readonly saturated: boolean;
}
const isCanonicalSemanticRelationName = (relation: string): relation is SemanticBehaviorRelation => ['entity', 'condition', 'candidate', 'requires', 'permits', 'excludes', 'precedes', 'reaches', 'converges', 'recurs', 'invariant', 'depends', 'produces', 'consumes', 'transfers', 'effects'].some(candidate => relationEqual(candidate, relation));
const relationKey = (fact: SemanticRelation<SemanticBehaviorRelation>): string => `${fact.relation}(${project(fact.arguments, value => JSON.stringify(value)).join(',')})`;
const canonicalize = (facts: readonly SemanticTheoryFact[]): readonly SemanticRelation<SemanticBehaviorRelation>[] => {
    const output: SemanticRelation<SemanticBehaviorRelation>[] = [];
    visit(facts, fact => {
        relationResolve(isCanonicalSemanticRelationName(fact.relation), () => {
            validateSemanticTheoryFact(fact);
            output.push(Object.freeze({ relation: fact.relation, arguments: Object.freeze([...fact.arguments]) }));
        }, () => { throw Error(`Non-canonical semantic relation '${fact.relation}'.`); });
    });
    return Object.freeze(output);
};
/**
 * Execute the entire canonical semantic closure.
 *
 * This is deliberately the only high-level behavior API downstream lowering
 * needs. It consumes relations, never syntax nodes or control constructs.
 */
export const closeCanonicalSemanticRelations = (seed: readonly SemanticTheoryFact[], maxRounds = 64): SemanticClosureResult => {
    const canonicalSeed = canonicalize(seed);
    const closure: SemanticBehaviorClosure = solveSemanticBehavior(canonicalSeed, maxRounds);
    const seedKeys = relationUnique(project(canonicalSeed, relationKey));
    const evidence: SemanticClosureEvidence[] = project(canonicalSeed, fact => ({
        fact,
        source: 'seed',
    }));
    visit(closure.derivations, derivation => {
        const fact = derivation.fact;
        evidence.push({
            fact,
            source: relationResolve(relationContains(seedKeys, relationKey(fact)), () => 'seed', () => 'rewrite'),
            ruleId: derivation.ruleId,
            premises: derivation.premises,
        });
    });
    return Object.freeze({
        facts: closure.facts,
        evidence: Object.freeze(evidence),
        rounds: closure.rounds,
        saturated: closure.saturated,
    });
};
/**
 * Convenience bridge from the canonical model's typed theory facts.
 */
export const closeCanonicalSemanticTheory = (facts: readonly SemanticTheoryFact[], maxRounds = 64): SemanticClosureResult => closeCanonicalSemanticRelations(facts, maxRounds);
/**
 * A canonical fact constructor that makes the intended boundary explicit to
 * callers and keeps source/control vocabulary out of semantic APIs.
 */
export const canonicalSemanticFact = (relation: SemanticBehaviorRelation, arguments_: readonly SemanticTheoryAtom[]): SemanticTheoryFact => semanticTheoryFact(relation, arguments_);