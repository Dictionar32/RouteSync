/**
 * Declarative constraint rules.
 *
 * Constraint state is an immutable relation.  A step returns a new relation
 * plus a monotone-change witness; the host language does not own solver state.
 */
import type { SemanticType } from '../../types/SemanticType';
import { checkAssignable, checkSubtype } from '../../types/system';
import type { TypeHierarchy } from '../../types/TypeHierarchy';
import type { Constraint, ConstraintViolation } from '../Constraint';
import type { VariableState } from '../TypeEnvironment';
import { absent } from '../../../types/upstream/presence';
import { unionFindFind, unionFindUnion, type UnionFind } from '../UnionFind';
import {
  relationContains,
  relationIndexAdd,
  relationIndexLookup,
  relationUnique,
  relationInsert,
  type RelationIndex,
  type RelationMembership,
} from '../../../semantic/foundation/relationMembership';
import { relationAll, relationAny, relationEqual, relationGate } from '../../../semantic/foundation/semanticRelations';
import {
  relationOptionFold,
  relationRefine,
  relationFirstOption,
  relationExpand,
  relationProject,
  relationSelect,
  type RelationOption,
} from '../../../semantic/foundation/relationalSequence';

export type ConstraintStateIndex = RelationIndex<number, VariableState>;
export type ConstraintStep = { readonly changed: boolean; readonly states: ConstraintStateIndex; readonly unionFind: UnionFind };

const emptyState = (): VariableState => ({
  lowerBounds: Object.freeze([] as SemanticType[]),
  upperBounds: Object.freeze([] as SemanticType[]),
});

const rootlessHierarchy: TypeHierarchy = { getParent: () => absent() };
const checkAssignability = (source: SemanticType, target: SemanticType): boolean =>
  checkAssignable(source, target, (left, right) => checkSubtype(left, right, rootlessHierarchy, checkAssignability));

const isObjectType = (type: SemanticType): type is Extract<SemanticType, { kind: 'object' }> =>
  relationEqual(type.kind, 'object');

const stateAt = (states: ConstraintStateIndex, id: number): VariableState =>
  relationOptionFold(relationIndexLookup(states, id), emptyState, value => value);

const primitiveType = (type: SemanticType): type is Extract<SemanticType, { kind: 'primitive' }> => relationEqual(type.kind, 'primitive');
const referenceType = (type: SemanticType): type is Extract<SemanticType, { kind: 'reference' }> => relationEqual(type.kind, 'reference');
const typeName = (type: SemanticType): string =>
  relationOptionFold(
    relationRefine(type, primitiveType),
    () => relationOptionFold(
      relationRefine(type, referenceType),
      () => relationGate(relationEqual(type.kind, 'union'), () => 'union', () => type.kind),
      value => `${value.namespace}\\${value.name}`,
    ),
    value => value.type,
  );

const propertyType = (source: VariableState, property: string): RelationOption<SemanticType> =>
  relationOptionFold(
    relationFirstOption(source.lowerBounds, isObjectType),
    () => ({ kind: 'none' }),
    value => relationOptionFold(
      relationFirstOption(value.properties, item => relationEqual(item.name.value.value, property)),
      () => ({ kind: 'none' }),
      item => ({ kind: 'some', value: item.type }),
    ),
  );

const propertyRule = (
  constraint: Extract<Constraint, { kind: 'PropertyExists' }>,
  states: ConstraintStateIndex,
  uf: UnionFind,
): ConstraintStep =>
  relationOptionFold(
    propertyType(stateAt(states, constraint.source.id), constraint.property),
    () => ({ changed: false, states, unionFind: uf }),
    value => {
      const state = stateAt(states, constraint.expected.id);
      const already = relationContains(state.lowerBounds, value);
      const nextState: VariableState = { ...state, lowerBounds: relationInsert(state.lowerBounds, value) };
      return {
        changed: !already,
        states: relationIndexAdd(states, constraint.expected.id, nextState),
        unionFind: uf,
      };
    },
  );

const equalityRule = (
  constraint: Extract<Constraint, { kind: 'Equality' }>,
  states: ConstraintStateIndex,
  uf: UnionFind,
): ConstraintStep => {
  const rootA = unionFindFind(uf, constraint.source.id);
  const rootB = unionFindFind(uf, constraint.target.id);
  const nextUf = unionFindUnion(uf, constraint.source.id, constraint.target.id);
  const merged: VariableState = {
    lowerBounds: relationUnique([...stateAt(states, rootA).lowerBounds, ...stateAt(states, rootB).lowerBounds]),
    upperBounds: relationUnique([...stateAt(states, rootA).upperBounds, ...stateAt(states, rootB).upperBounds]),
  };
  return {
    changed: !relationEqual(rootA, rootB),
    states: relationIndexAdd(states, unionFindFind(nextUf, constraint.source.id), merged),
    unionFind: nextUf,
  };
};

const conflictDiagnostics = (
  lowers: readonly SemanticType[],
  uppers: readonly SemanticType[],
  span: Constraint['span'],
  diagnostics: ConstraintViolation[],
): void => {
  const conflicts = relationSelect(
    relationExpand(lowers, lower => relationProject(uppers, upper => ({ lower, upper }))),
    pair => relationEqual(checkAssignability(pair.lower, pair.upper), false),
  );
  relationProject(conflicts, pair => diagnostics.push({
    code: 'RS1023',
    message: `Type conflict: Lower bound type '${typeName(pair.lower)}' is incompatible with upper bound type '${typeName(pair.upper)}'.`,
    location: span,
  }));
};

const subtypeRule = (
  constraint: Extract<Constraint, { kind: 'Subtype' }>,
  states: ConstraintStateIndex,
  uf: UnionFind,
  diagnostics: ConstraintViolation[],
): ConstraintStep => {
  const source = stateAt(states, constraint.source.id);
  const target = stateAt(states, constraint.target.id);
  const nextTarget: VariableState = {
    lowerBounds: relationUnique([...target.lowerBounds, ...source.lowerBounds]),
    upperBounds: target.upperBounds,
  };
  const nextSource: VariableState = {
    lowerBounds: source.lowerBounds,
    upperBounds: relationUnique([...source.upperBounds, ...target.upperBounds]),
  };
  const changed = relationAny([
    !relationEqual(nextTarget.lowerBounds.length, target.lowerBounds.length),
    !relationEqual(nextSource.upperBounds.length, source.upperBounds.length),
  ]);
  conflictDiagnostics(nextSource.lowerBounds, nextTarget.upperBounds, constraint.span, diagnostics);
  return {
    changed,
    states: relationIndexAdd(relationIndexAdd(states, constraint.source.id, nextSource), constraint.target.id, nextTarget),
    unionFind: uf,
  };
};

const hasTypeRule = (
  constraint: Extract<Constraint, { kind: 'HasType' }>,
  states: ConstraintStateIndex,
  uf: UnionFind,
): ConstraintStep => {
  const state = stateAt(states, constraint.source.id);
  const nextState: VariableState = {
    lowerBounds: relationInsert(state.lowerBounds, constraint.type),
    upperBounds: relationInsert(state.upperBounds, constraint.type),
  };
  return {
    changed: !relationAll([
      relationEqual(nextState.lowerBounds.length, state.lowerBounds.length),
      relationEqual(nextState.upperBounds.length, state.upperBounds.length),
    ]),
    states: relationIndexAdd(states, constraint.source.id, nextState),
    unionFind: uf,
  };
};

type ConstraintRule = (
  constraint: Constraint,
  states: ConstraintStateIndex,
  uf: UnionFind,
  diagnostics: ConstraintViolation[],
) => ConstraintStep;

const propertyPredicate = (constraint: Constraint): constraint is Extract<Constraint, { kind: 'PropertyExists' }> =>
  relationEqual(constraint.kind, 'PropertyExists');
const equalityPredicate = (constraint: Constraint): constraint is Extract<Constraint, { kind: 'Equality' }> =>
  relationEqual(constraint.kind, 'Equality');
const subtypePredicate = (constraint: Constraint): constraint is Extract<Constraint, { kind: 'Subtype' }> =>
  relationEqual(constraint.kind, 'Subtype');
const hasTypePredicate = (constraint: Constraint): constraint is Extract<Constraint, { kind: 'HasType' }> =>
  relationEqual(constraint.kind, 'HasType');

const refineRule = <T extends Constraint>(
  constraint: Constraint,
  predicate: (candidate: Constraint) => candidate is T,
  rule: (candidate: T, states: ConstraintStateIndex, uf: UnionFind, diagnostics: ConstraintViolation[]) => ConstraintStep,
  states: ConstraintStateIndex,
  uf: UnionFind,
  diagnostics: ConstraintViolation[],
): ConstraintStep =>
  relationOptionFold(
    relationRefine(constraint, predicate),
    () => ({ changed: false, states, unionFind: uf }),
    value => rule(value, states, uf, diagnostics),
  );

const rules: readonly (readonly [Constraint['kind'], ConstraintRule])[] = Object.freeze([
  ['PropertyExists', (constraint, states, uf, diagnostics) => refineRule(constraint, propertyPredicate, propertyRule, states, uf, diagnostics)],
  ['Equality', (constraint, states, uf, diagnostics) => refineRule(constraint, equalityPredicate, (value, current, currentUf) => equalityRule(value, current, currentUf), states, uf, diagnostics)],
  ['Subtype', (constraint, states, uf, diagnostics) => refineRule(constraint, subtypePredicate, subtypeRule, states, uf, diagnostics)],
  ['HasType', (constraint, states, uf, diagnostics) => refineRule(constraint, hasTypePredicate, hasTypeRule, states, uf, diagnostics)],
]);

export function solveConstraintStep(
  constraint: Constraint,
  uf: UnionFind,
  states: ConstraintStateIndex,
  diagnostics: ConstraintViolation[],
): ConstraintStep {
  return relationOptionFold(
    relationFirstOption(rules, entry => relationEqual(entry[0], constraint.kind)),
    () => ({ changed: false, states, unionFind: uf }),
    entry => entry[1](constraint, states, uf, diagnostics),
  );
}
