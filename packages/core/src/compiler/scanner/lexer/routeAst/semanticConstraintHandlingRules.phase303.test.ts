import { solveConstraintHandlingRules, type ConstraintHandlingRule } from './semanticConstraintHandlingRules';
import type { SemanticRelationPattern } from './semanticRewriteEngine';

type R = 'requires' | 'entity' | 'obsolete' | 'active' | 'resolved';
const variable = (name: string) => ({ variable: name } as const);
const pattern = (relation: R, ...arguments_: readonly (string | number | boolean | null | ReturnType<typeof variable>)[]): SemanticRelationPattern<R> => ({ relation, arguments: arguments_ });
const has = (facts: readonly { readonly relation: R; readonly arguments: readonly unknown[] }[], key: string): boolean => facts.some(fact => `${fact.relation}:${fact.arguments.join(':')}` === key);

const propagation: ConstraintHandlingRule<R> = {
  id: 'requires-propagates-entity', priority: 100, mode: 'propagation',
  keep: Object.freeze([pattern('requires', variable('entity'), 'predicate')]), remove: Object.freeze([]),
  then: Object.freeze([pattern('entity', variable('entity'), 'derived')]),
};
const simplification: ConstraintHandlingRule<R> = {
  id: 'obsolete-simplifies-to-resolved', priority: 90, mode: 'simplification',
  keep: Object.freeze([]), remove: Object.freeze([pattern('obsolete', variable('entity'))]),
  then: Object.freeze([pattern('resolved', variable('entity'), 'yes')]),
};
const simpagation: ConstraintHandlingRule<R> = {
  id: 'entity-simpagates-obsolete', priority: 80, mode: 'simpagation',
  keep: Object.freeze([pattern('entity', variable('entity'), 'source')]), remove: Object.freeze([pattern('obsolete', variable('entity'))]),
  then: Object.freeze([pattern('active', variable('entity'), 'source')]),
};

const propagationResult = solveConstraintHandlingRules<R>([{ relation: 'requires', arguments: ['A', 'predicate'] }], [propagation]);
if (!has(propagationResult.facts, 'entity:A:derived')) throw new Error('Propagation did not derive entity.');

const simplificationResult = solveConstraintHandlingRules<R>([{ relation: 'obsolete', arguments: ['A'] }], [simplification]);
if (!has(simplificationResult.facts, 'resolved:A:yes')) throw new Error('Simplification did not derive resolution.');
if (has(simplificationResult.facts, 'obsolete:A')) throw new Error('Simplification did not remove obsolete relation.');

const simpagationResult = solveConstraintHandlingRules<R>([
  { relation: 'entity', arguments: ['A', 'source'] }, { relation: 'obsolete', arguments: ['A'] },
], [simpagation]);
if (!has(simpagationResult.facts, 'active:A:source')) throw new Error('Simpagation did not derive active relation.');
if (has(simpagationResult.facts, 'obsolete:A')) throw new Error('Simpagation did not remove obsolete relation.');
console.log('PHASE303-CHR-RELATION-PASS');
