/**
 * Phase 301 — declarative syntax/error relation core.
 *
 * Syntax failures are represented as relations and resolved by the same
 * relation solver used by semantic closure.  The error core therefore does
 * not dispatch on parser constructs and does not encode error accumulation as
 * imperative control flow.
 */
import {
  solveSemanticRelationsDetailed,
  type SemanticRelation,
  type SemanticRelationAtom,
  type SemanticRelationPattern,
  type SemanticRelationRewrite,
} from './semanticRelationSolver';
import { projectRelation, selectRelation } from '../../../relational/sequence';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';

export type SyntaxErrorRelation =
  | 'expected'
  | 'observed'
  | 'located'
  | 'severity'
  | 'diagnostic'
  | 'blocks';

export interface SyntaxErrorFact {
  readonly relation: SyntaxErrorRelation;
  readonly arguments: readonly SemanticRelationAtom[];
}

const rulePattern = (relation: SyntaxErrorRelation, ...arguments_: readonly (SemanticRelationAtom | { readonly variable: string })[]): SemanticRelationPattern<SyntaxErrorRelation> => Object.freeze({ relation, arguments: Object.freeze(arguments_) });

export const SYNTAX_ERROR_RULES: readonly SemanticRelationRewrite<SyntaxErrorRelation>[] = Object.freeze([
  Object.freeze({
    id: 'expected-observed-diagnostic',
    priority: 300,
    when: Object.freeze([
      rulePattern('expected', { variable: 'position' }, { variable: 'expected' }),
      rulePattern('observed', { variable: 'position' }, { variable: 'observed' }),
    ]),
    then: Object.freeze([
      rulePattern('diagnostic', { variable: 'position' }, 'syntax-unexpected-token', { variable: 'expected' }, { variable: 'observed' }),
    ]),
  }),
  Object.freeze({
    id: 'diagnostic-blocks-location',
    priority: 290,
    when: Object.freeze([
      rulePattern('diagnostic', { variable: 'position' }, { variable: 'code' }, { variable: 'expected' }, { variable: 'observed' }),
      rulePattern('located', { variable: 'position' }, { variable: 'span' }),
    ]),
    then: Object.freeze([
      rulePattern('blocks', { variable: 'code' }, { variable: 'span' }),
    ]),
  }),
]);

const syntaxErrorRelation = (...arguments_: readonly SemanticRelationAtom[]) =>
  Object.freeze(arguments_);

export const syntaxErrorFact = (
  relation: SyntaxErrorRelation,
  arguments_: readonly SemanticRelationAtom[],
): SyntaxErrorFact => Object.freeze({ relation, arguments: syntaxErrorRelation(...arguments_) });

const toSemanticRelation = (fact: SyntaxErrorFact): SemanticRelation<SyntaxErrorRelation> => Object.freeze({
  relation: fact.relation,
  arguments: syntaxErrorRelation(...fact.arguments),
});

const toFact = (fact: SemanticRelation<SyntaxErrorRelation>): SyntaxErrorFact => Object.freeze({
  relation: fact.relation,
  arguments: syntaxErrorRelation(...fact.arguments),
});

export const solveSyntaxErrorRelations = (
  seed: readonly SyntaxErrorFact[],
  maxRounds = 32,
): readonly SyntaxErrorFact[] => {
  const result = solveSemanticRelationsDetailed(projectRelation(seed, toSemanticRelation), SYNTAX_ERROR_RULES, maxRounds);
  return Object.freeze(projectRelation(result.facts, toFact));
};

export const syntaxErrorDiagnostics = (
  facts: readonly SyntaxErrorFact[],
): readonly SyntaxErrorFact[] => selectRelation(facts, (fact: SyntaxErrorFact) => relationEqual(fact.relation, 'diagnostic'));

export const syntaxErrorRelationPattern = (
  relation: SyntaxErrorRelation,
  ...arguments_: readonly (SemanticRelationAtom | { readonly variable: string })[]
): SemanticRelationPattern<SyntaxErrorRelation> => Object.freeze({
  relation,
  arguments: Object.freeze([...arguments_]),
});
