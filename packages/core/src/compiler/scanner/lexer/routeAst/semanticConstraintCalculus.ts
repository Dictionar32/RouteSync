/**
 * Declarative semantic constraint calculus.
 *
 * Constraints are solved over relation witnesses. Absence is represented by
 * RelationOption and semantic atoms keep semantic absence outside the atom domain.
 */
import { relationResolve } from '../../../relational/sequence';
import { project, retain } from './semanticRelationalCollections';
import { solveSemanticRelationsDetailed, type SemanticRelation, type SemanticRelationAtom, type SemanticRelationPattern, type SemanticRelationRewrite } from './semanticRelationSolver';
import { relationResolve, relationFirst, relationOptionFold, relationOptionMap, type RelationOption } from '../../../../semantic/kernel/relationalSequence';
import { relationAny, relationEqual, relationIsSome, relationNone, relationNotEqual, relationSome } from '../../../../semantic/kernel/semanticRelations';

export type { SemanticRelation } from './semanticRelationSolver';
export type SemanticConstraintTerm = SemanticRelationAtom | Readonly<{ readonly variable: string }>;
export type SemanticConstraint = Readonly<{ readonly kind: 'equals'; readonly left: SemanticConstraintTerm; readonly right: SemanticConstraintTerm }> | Readonly<{ readonly kind: 'not-equals'; readonly left: SemanticConstraintTerm; readonly right: SemanticConstraintTerm }> | Readonly<{ readonly kind: 'truth'; readonly value: SemanticConstraintTerm }>;
export interface SemanticConstraintRule<R extends string = string> { readonly id: string; readonly priority: number; readonly when: readonly SemanticRelationPattern<R>[]; readonly constraints?: readonly SemanticConstraint[]; readonly then: readonly SemanticRelationPattern<R>[] }
export interface SemanticConstraintProgram<R extends string = string> { readonly rules: readonly SemanticConstraintRule<R>[] }
export interface SemanticConstraintSolveResult<R extends string = string> { readonly facts: readonly SemanticRelation<R>[]; readonly derivations: readonly { readonly fact: SemanticRelation<R>; readonly ruleId: string }[]; readonly rounds: number; readonly saturated: boolean }

type Bindings = Readonly<Record<string, SemanticRelationAtom>>;
type ConstraintWitness = RelationOption<SemanticRelationAtom>;
const isVariable = (term: SemanticConstraintTerm): term is { readonly variable: string } => relationAll([relationEqual(typeof term, 'object'), Object.prototype.hasOwnProperty.call(term, 'variable')]);
const resolve = (term: SemanticConstraintTerm, bindings: Bindings): ConstraintWitness =>
  relationResolve(isVariable(term), () => relationOptionMap(relationFirst(Object.entries(bindings), ([name]) => relationEqual(name, term.variable)), entry => entry[1]), () => relationSome(term));

const constraintHold = (constraint: SemanticConstraint, bindings: Bindings): boolean => {
  const left = relationResolve(relationEqual(constraint.kind, 'truth'), () => resolve(constraint.value, bindings), () => resolve(constraint.left, bindings));
  return relationOptionFold(left, () => false, leftValue => relationResolve(
    relationEqual(constraint.kind, 'truth'),
    () => relationEqual(leftValue, true),
    () => relationOptionFold(resolve(constraint.right, bindings), () => false, rightValue => relationResolve(
      relationEqual(constraint.kind, 'equals'),
      () => relationEqual(leftValue, rightValue),
      () => relationNotEqual(leftValue, rightValue),
    )),
  ));
};

const constraintsHold = (constraints: readonly SemanticConstraint[], bindings: Bindings, index = 0): boolean => relationResolve(
  index >= constraints.length,
  () => true,
  () => relationResolve(constraintHold(constraints[index], bindings), () => constraintsHold(constraints, bindings, index + 1), () => false),
);

const constraintItems = <R extends string>(rule: SemanticConstraintRule<R>): readonly SemanticConstraint[] => {
  const value = Reflect.get(rule, 'constraints');
  const items = relationResolve(Array.isArray(value), () => value, () => []);
  return Object.freeze(project(items, item => {
    const candidate = Object.freeze({ ...item });
    return candidate;
  }));
};

const relationKey = <R extends string>(fact: SemanticRelation<R>): string => `${fact.relation}(${project(fact.arguments, value => JSON.stringify(value)).join(',')})`;

export const solveSemanticConstraintProgram = <R extends string>(seed: readonly SemanticRelation<R>[], program: SemanticConstraintProgram<R>, maxRounds = 1024): SemanticConstraintSolveResult<R> => {
  const compiled: readonly SemanticRelationRewrite<R>[] = project(program.rules, rule => ({ id: rule.id, priority: rule.priority, when: rule.when, then: rule.then }));
  const ruleById = project(program.rules, rule => [rule.id, rule] as const);
  const settle = (facts: readonly SemanticRelation<R>[], derivations: readonly { readonly fact: SemanticRelation<R>; readonly ruleId: string }[], rounds: number): SemanticConstraintSolveResult<R> => {
    const result = solveSemanticRelationsDetailed(facts, compiled, 1);
    const accepted = retain(
      project(
        retain(result.derivations, derivation => relationOptionFold(
          relationFirst(ruleById, ([id]) => relationEqual(id, derivation.ruleId)),
          () => false,
          ([, rule]) => constraintsHold(constraintItems(rule), derivation.bindings),
        )),
        derivation => ({ fact: derivation.fact, ruleId: derivation.ruleId }),
      ),
      derivation => !facts.some(fact => relationEqual(relationKey(fact), relationKey(derivation.fact))),
    );
    const nextFacts = [...facts, ...project(accepted, item => item.fact)];
    const nextDerivations = [...derivations, ...accepted];
    return relationResolve(
      relationAny([relationEqual(accepted.length, 0), rounds >= maxRounds]),
      () => Object.freeze({ facts: Object.freeze(nextFacts), derivations: Object.freeze(nextDerivations), rounds: rounds + result.rounds, saturated: relationEqual(accepted.length, 0) }),
      () => settle(nextFacts, nextDerivations, rounds + result.rounds),
    );
  };
  return settle(seed, [], 0);
};

export interface SemanticRewriteRule<R extends string = string> { readonly id: string; readonly priority: number; readonly when: readonly SemanticRelationPattern<R>[]; readonly replace: readonly SemanticRelationPattern<R>[] }
export const toSemanticRelationRewrites = <R extends string>(rules: readonly SemanticRewriteRule<R>[]): readonly SemanticRelationRewrite<R>[] => Object.freeze(project(rules, rule => Object.freeze({ id: rule.id, priority: rule.priority, when: rule.when, then: rule.replace })));
