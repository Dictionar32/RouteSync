import { visitRelation } from '../../../relational/sequence';
import { relationOptionalFold } from '../../../../semantic/kernel/relationalSequence';
/**
 * Phase 267 — construct-free semantic behavior kernel.
 *
 * This is the canonical semantic layer. Source constructs are evidence only;
 * they are deliberately absent from this ontology. A behavior is described by
 * relations and constraints, then closed by the generic relation solver.
 *
 * The kernel intentionally does NOT contain source control constructs as semantic
 * concepts. Such constructs may be reconstructed only by a target-specific
 * lowering after semantic closure.
 */
import { solveSemanticRelationsDetailed, type SemanticRelation, type SemanticRelationDerivation, } from './semanticRewriteEngine';
import { solveSemanticConstraintProgram } from './semanticConstraintCalculus';
import { semanticTheoryFact, validateSemanticTheoryFact } from './semanticRelationTheory';
import { SEMANTIC_BEHAVIOR_RULES, SEMANTIC_BEHAVIOR_PROGRAM, SEMANTIC_BEHAVIOR_CONSTRAINT_RULES, } from './semanticRelationalBehaviorCatalog';
import type { SemanticBehaviorRelation } from './semanticRelationalBehaviorCatalog';
export { SEMANTIC_BEHAVIOR_SCHEMAS, SEMANTIC_BEHAVIOR_RULES, SEMANTIC_BEHAVIOR_PROGRAM, SEMANTIC_BEHAVIOR_CONSTRAINT_RULES, type SemanticBehaviorSchema, type SemanticBehaviorRelation, type SemanticBehaviorFact, } from './semanticRelationalBehaviorCatalog';
export interface SemanticBehaviorClosure {
    readonly facts: readonly SemanticRelation<SemanticBehaviorRelation>[];
    readonly derivations: readonly SemanticRelationDerivation<SemanticBehaviorRelation>[];
    readonly rounds: number;
    readonly saturated: boolean;
}
/**
 * The only semantic entry point used by behavior reasoning. It accepts facts,
 * not syntax nodes. The solver performs relational closure; no source control
 * construct is inspected here.
 */
export const solveSemanticBehavior = (seed: readonly SemanticRelation<SemanticBehaviorRelation>[], maxRounds = 64): SemanticBehaviorClosure => {
    visitRelation(seed, fact => validateSemanticTheoryFact(semanticTheoryFact(fact.relation, fact.arguments)));
    const constraintClosure = solveSemanticConstraintProgram(seed, { rules: relationOptionalFold(SEMANTIC_BEHAVIOR_PROGRAM.constraints, () => [], value => value) }, maxRounds);
    const relationClosure = solveSemanticRelationsDetailed(constraintClosure.facts, SEMANTIC_BEHAVIOR_PROGRAM.rules, maxRounds);
    return Object.freeze({
        facts: relationClosure.facts,
        derivations: relationClosure.derivations,
        rounds: relationClosure.rounds,
        saturated: relationClosure.saturated,
    });
};
