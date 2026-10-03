/**
 * Typed relational semantic theory.
 *
 * The semantic authority is a validated relation theory. Source syntax is
 * evidence only; semantic consumers receive canonical facts and witnesses.
 */
import { relationResolve } from '../../../relational/sequence';
import { project, visit } from './semanticRelationalCollections';
import { semanticNullAtom, type SemanticNullAtom } from './semanticRewriteEngine';
import { relationResolve } from '../../../../semantic/kernel/relationalSequence';
import { relationEqual, relationNotEqual } from '../../../../semantic/kernel/semanticRelations';

export type SemanticTheoryAtom = string | number | boolean | SemanticNullAtom;
export type SemanticTheorySort = 'entity' | 'predicate' | 'value' | 'effect' | 'resource' | 'state' | 'relation-target';
export interface SemanticTheoryTerm { readonly sort: SemanticTheorySort; readonly value: SemanticTheoryAtom }
export type SemanticTheoryRelation = 'entity' | 'condition' | 'candidate' | 'requires' | 'permits' | 'excludes' | 'precedes' | 'reaches' | 'converges' | 'recurs' | 'invariant' | 'depends' | 'produces' | 'consumes' | 'transfers' | 'effects';
export interface SemanticTheorySignature { readonly relation: SemanticTheoryRelation; readonly arguments: readonly SemanticTheorySort[] }
export const SEMANTIC_THEORY_SIGNATURES: readonly SemanticTheorySignature[] = Object.freeze([
  { relation: 'entity', arguments: ['entity', 'relation-target'] },
  { relation: 'condition', arguments: ['entity', 'predicate'] },
  { relation: 'candidate', arguments: ['entity', 'entity'] },
  { relation: 'requires', arguments: ['entity', 'predicate'] },
  { relation: 'permits', arguments: ['entity', 'entity'] },
  { relation: 'excludes', arguments: ['entity', 'predicate'] },
  { relation: 'precedes', arguments: ['entity', 'entity'] },
  { relation: 'reaches', arguments: ['entity', 'entity'] },
  { relation: 'converges', arguments: ['entity', 'entity', 'entity'] },
  { relation: 'recurs', arguments: ['entity', 'entity'] },
  { relation: 'invariant', arguments: ['entity', 'predicate'] },
  { relation: 'depends', arguments: ['entity', 'entity'] },
  { relation: 'produces', arguments: ['entity', 'value'] },
  { relation: 'consumes', arguments: ['entity', 'value'] },
  { relation: 'transfers', arguments: ['entity', 'entity', 'value'] },
  { relation: 'effects', arguments: ['entity', 'effect', 'entity'] },
]);
export interface SemanticTheoryFact { readonly relation: SemanticTheoryRelation; readonly arguments: readonly SemanticTheoryAtom[]; readonly terms?: readonly SemanticTheoryTerm[]; readonly provenance?: readonly string[] }

const signatureOf = (relation: SemanticTheoryRelation, index = 0): SemanticTheorySignature =>
  relationResolve(relationEqual(SEMANTIC_THEORY_SIGNATURES[index]?.relation, relation), () => SEMANTIC_THEORY_SIGNATURES[index], () => signatureOf(relation, index + 1));

const validateTerm = (fact: SemanticTheoryFact, signature: SemanticTheorySignature, term: SemanticTheoryTerm, index: number): void => {
  relationResolve(
    relationNotEqual(term.sort, signature.arguments[index]),
    () => { throw Error(`Invalid relation sort ${fact.relation}[${index}]: expected ${signature.arguments[index]}, received ${term.sort}`); },
    () => relationResolve(
      relationNotEqual(JSON.stringify(term.value), JSON.stringify(fact.arguments[index])),
      () => { throw Error(`Term/value mismatch: ${fact.relation}[${index}]`); },
      () => true,
    ),
  );
};

export const validateSemanticTheoryFact = (fact: SemanticTheoryFact): void => {
  const signature = signatureOf(fact.relation);
  relationResolve(
    relationNotEqual(fact.arguments.length, signature.arguments.length),
    () => { throw Error(`Invalid relation arity ${fact.relation}: expected ${signature.arguments.length}, received ${fact.arguments.length}`); },
    () => relationResolve(
      relationAll([Boolean(fact.terms), relationNotEqual(fact.terms?.length, signature.arguments.length)]),
      () => { throw Error(`Invalid relation term count ${fact.relation}`); },
      () => relationResolve(
        Boolean(fact.terms),
        () => {
          const terms = relationResolve(Array.isArray(fact.terms), () => fact.terms, () => []);
          return visit(terms, (term, index) => validateTerm(fact, signature, term, index));
        },
        () => true,
      ),
    ),
  );
};

export const assertCanonicalSemanticRelationName = (relation: string): asserts relation is SemanticTheoryRelation =>
  relationResolve(
    SEMANTIC_THEORY_SIGNATURES.some(signature => relationEqual(signature.relation, relation)),
    () => true,
    () => { throw Error(`Non-canonical semantic relation '${relation}'. Project source/control evidence into the relational theory first.`); },
  );

export const semanticTheoryFact = (
  relation: SemanticTheoryRelation,
  arguments_: readonly SemanticTheoryAtom[],
  provenance: readonly string[] = [],
): SemanticTheoryFact => {
  const signature = signatureOf(relation);
  const terms = project(arguments_, (value, index) => ({ sort: signature.arguments[index], value }));
  const fact: SemanticTheoryFact = Object.freeze({ relation, arguments: Object.freeze([...arguments_]), terms: Object.freeze(terms), provenance: Object.freeze([...provenance]) });
  validateSemanticTheoryFact(fact);
  return fact;
};

export { semanticNullAtom };
export type { SemanticNullAtom };
