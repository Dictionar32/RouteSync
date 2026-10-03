/**
 * Phase 278 — declarative semantic behavior catalog.
 *
 * This module is the semantic program. It contains only typed relation schemas,
 * relation patterns, constraints, and rewrites. It deliberately has no source
 * syntax dispatch and no construct-shaped control ontology.
 */
import type { SemanticConstraintRule } from './semanticConstraintCalculus';
import type { SemanticRelationPattern, SemanticRelationRewrite, SemanticRelationAtom } from './semanticRewriteEngine';
import { assertSemanticRelationProgram, type SemanticRelationProgram } from './semanticRelationProgram';

export type SemanticBehaviorRelation =
  | 'entity'
  | 'condition'
  | 'candidate'
  | 'requires'
  | 'permits'
  | 'excludes'
  | 'precedes'
  | 'reaches'
  | 'converges'
  | 'recurs'
  | 'invariant'
  | 'depends'
  | 'produces'
  | 'consumes'
  | 'transfers'
  | 'effects';

export interface SemanticBehaviorFact {
  readonly relation: SemanticBehaviorRelation;
  readonly arguments: readonly SemanticRelationAtom[];
}

export interface SemanticBehaviorSchema {
  readonly relation: SemanticBehaviorRelation;
  readonly arity: number;
}

export const SEMANTIC_BEHAVIOR_SCHEMAS: readonly SemanticBehaviorSchema[] = Object.freeze([
  { relation: 'entity', arity: 2 },
  { relation: 'condition', arity: 2 },
  { relation: 'candidate', arity: 2 },
  { relation: 'requires', arity: 2 },
  { relation: 'permits', arity: 2 },
  { relation: 'excludes', arity: 2 },
  { relation: 'precedes', arity: 2 },
  { relation: 'reaches', arity: 2 },
  { relation: 'converges', arity: 3 },
  { relation: 'recurs', arity: 2 },
  { relation: 'invariant', arity: 2 },
  { relation: 'depends', arity: 2 },
  { relation: 'produces', arity: 2 },
  { relation: 'consumes', arity: 2 },
  { relation: 'transfers', arity: 3 },
  { relation: 'effects', arity: 3 },
]);

const variable = (name: string) => ({ variable: name } as const);
const pattern = (
  relation: SemanticBehaviorRelation,
  ...arguments_: readonly (SemanticRelationAtom | ReturnType<typeof variable>)[]
): SemanticRelationPattern<SemanticBehaviorRelation> => Object.freeze({
  relation,
  arguments: Object.freeze(arguments_),
});

export const SEMANTIC_BEHAVIOR_RULES: readonly SemanticRelationRewrite<SemanticBehaviorRelation>[] = Object.freeze([
  Object.freeze({
    id: 'condition-permits-candidate',
    priority: 300,
    constraints: Object.freeze([]),
    when: Object.freeze([
      pattern('condition', variable('condition'), variable('predicate')),
      pattern('candidate', variable('condition'), variable('candidate')),
      pattern('requires', variable('candidate'), variable('predicate')),
    ]),
    then: Object.freeze([pattern('permits', variable('condition'), variable('candidate'))]),
  }),
  Object.freeze({
    id: 'requires-excludes-conflict',
    priority: 290,
    constraints: Object.freeze([]),
    when: Object.freeze([
      pattern('requires', variable('left'), variable('predicate')),
      pattern('excludes', variable('right'), variable('predicate')),
    ]),
    then: Object.freeze([pattern('effects', variable('left'), 'conflict', variable('right'))]),
  }),
  Object.freeze({
    id: 'dependency-precedes-production',
    priority: 280,
    constraints: Object.freeze([]),
    when: Object.freeze([
      pattern('depends', variable('consumer'), variable('producer')),
      pattern('produces', variable('producer'), variable('value')),
      pattern('consumes', variable('consumer'), variable('value')),
    ]),
    then: Object.freeze([pattern('precedes', variable('producer'), variable('consumer'))]),
  }),
  Object.freeze({
    id: 'dependency-cycle-reachability',
    priority: 275,
    constraints: Object.freeze([]),
    when: Object.freeze([
      pattern('depends', variable('left'), variable('right')),
      pattern('depends', variable('right'), variable('left')),
    ]),
    then: Object.freeze([
      pattern('reaches', variable('left'), variable('left')),
      pattern('reaches', variable('right'), variable('right')),
    ]),
  }),
  Object.freeze({
    id: 'precedence-reachability',
    priority: 270,
    constraints: Object.freeze([]),
    when: Object.freeze([
      pattern('precedes', variable('left'), variable('middle')),
      pattern('precedes', variable('middle'), variable('right')),
    ]),
    then: Object.freeze([pattern('reaches', variable('left'), variable('right'))]),
  }),
  Object.freeze({
    id: 'recurrent-reachability',
    priority: 260,
    constraints: Object.freeze([]),
    when: Object.freeze([pattern('reaches', variable('entity'), variable('entity'))]),
    then: Object.freeze([pattern('recurs', variable('entity'), variable('entity'))]),
  }),
  Object.freeze({
    id: 'fixed-point-convergence',
    priority: 255,
    constraints: Object.freeze([]),
    when: Object.freeze([pattern('reaches', variable('entity'), variable('entity'))]),
    then: Object.freeze([pattern('converges', variable('entity'), variable('entity'), variable('entity'))]),
  }),
]);

export const SEMANTIC_BEHAVIOR_CONSTRAINT_RULES: readonly SemanticConstraintRule<SemanticBehaviorRelation>[] = Object.freeze([
  Object.freeze({
    id: 'condition-candidate-requires-matching-predicate',
    priority: 200,
    when: Object.freeze([
      pattern('condition', variable('condition'), variable('predicate')),
      pattern('candidate', variable('condition'), variable('candidate')),
      pattern('requires', variable('candidate'), variable('requiredPredicate')),
    ]),
    constraints: Object.freeze([
      { kind: 'equals' as const, left: variable('predicate'), right: variable('requiredPredicate') },
    ]),
    then: Object.freeze([pattern('permits', variable('condition'), variable('candidate'))]),
  }),
]);
export const SEMANTIC_BEHAVIOR_PROGRAM: SemanticRelationProgram<SemanticBehaviorRelation> = Object.freeze({
  schemas: SEMANTIC_BEHAVIOR_SCHEMAS,
  constraints: SEMANTIC_BEHAVIOR_CONSTRAINT_RULES,
  rules: SEMANTIC_BEHAVIOR_RULES,
});

assertSemanticRelationProgram(SEMANTIC_BEHAVIOR_PROGRAM);

