/**
 * Declarative semantic constraint calculus.
 *
 * Constraints are solved over relation witnesses. Absence is represented by
 * RelationOption and semantic atoms keep semantic absence outside the atom domain.
 */
import { project, retain } from './semanticRelationalCollections';
import { solveSemanticRelationsDetailed, type SemanticRelation, type SemanticRelationAtom, type SemanticRelationPattern, type SemanticRelationRewrite } from './semanticRewriteEngine';
import { relationResolve, relationFirst, relationOptionFold, relationOptionMap, relationOptionalFold, relationRefine, relationVariant, type RelationOption } from '../../../../semantic/kernel/relationalSequence';
import { relationAll, relationAny, relationGate, relationEqual, relationIsSome, relationNone, relationNotEqual, relationSome } from '../../../../semantic/kernel/semanticRelations';

export type { SemanticRelation } from './semanticRewriteEngine';
export type SemanticConstraintTerm = SemanticRelationAtom | Readonly<{ readonly variable: string }>;
export type SemanticConstraint = Readonly<{ readonly kind: 'equals'; readonly left: SemanticConstraintTerm; readonly right: SemanticConstraintTerm }> | Readonly<{ readonly kind: 'not-equals'; readonly left: SemanticConstraintTerm; readonly right: SemanticConstraintTerm }> | Readonly<{ readonly kind: 'truth'; readonly value: SemanticConstraintTerm }>;
export interface SemanticConstraintRule<R extends string = string> { readonly id: string; readonly priority: number; readonly when: readonly SemanticRelationPattern<R>[]; readonly constraints: readonly SemanticConstraint[]; readonly then: readonly SemanticRelationPattern<R>[] }
export interface SemanticConstraintProgram<R extends string = string> { readonly rules: readonly SemanticConstraintRule<R>[] }
export interface SemanticConstraintSolveResult<R extends string = string> { readonly facts: readonly SemanticRelation<R>[]; readonly derivations: readonly { readonly fact: SemanticRelation<R>; readonly ruleId: string }[]; readonly rounds: number; readonly saturated: boolean }

type Bindings = Readonly<Record<string, SemanticRelationAtom>>;
type ConstraintWitness = RelationOption<SemanticRelationAtom>;
const isVariable = (term: SemanticConstraintTerm): term is { readonly variable: string } => relationAll([relationEqual(typeof term, 'object'), Object.prototype.hasOwnProperty.call(term, 'variable')]);
const isAtom = (term: SemanticConstraintTerm): term is SemanticRelationAtom => !isVariable(term);
const resolve = (term: SemanticConstraintTerm, bindings: Bindings): ConstraintWitness =>
  relationOptionFold(
    relationRefine(term, isVariable),
    () => relationOptionFold(relationRefine(term, isAtom), () => relationNone(), atom => relationSome(atom)),
    variable => relationOptionMap(relationFirst(Object.entries(bindings), ([name]) => relationEqual(name, variable.variable)), entry => entry[1]),
  );

const constraintHold = (constraint: SemanticConstraint, bindings: Bindings): boolean => {
  const truth = relationVariant(constraint, 'truth');
  return relationOptionFold(truth, () => {
    const equals = relationVariant(constraint, 'equals');
    return relationOptionFold(equals, () => false, value =>
      relationOptionFold(resolve(value.left, bindings), () => false, leftValue =>
        relationOptionFold(resolve(value.right, bindings), () => false, rightValue => relationEqual(leftValue, rightValue)),
      ),
    );
  }, value => relationOptionFold(resolve(value.value, bindings), () => false, leftValue => relationEqual(leftValue, true)));
};

const constraintsHold = (constraints: readonly SemanticConstraint[], bindings: Bindings, index = 0): boolean => relationResolve(
  index >= constraints.length,
  () => true,
  () => relationResolve(constraintHold(constraints[index], bindings), () => constraintsHold(constraints, bindings, index + 1), () => false),
);

const constraintItems = <R extends string>(rule: SemanticConstraintRule<R>): readonly SemanticConstraint[] =>
  Object.freeze(project(rule.constraints, item => Object.freeze({ ...item })));

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
