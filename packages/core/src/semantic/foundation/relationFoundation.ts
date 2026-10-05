/** Foundational relation predicates, branching and option witnesses. */
export type RelationOption<T> =
  | { readonly kind: 'none' }
  | { readonly kind: 'some'; readonly value: T };

export function relationResolve<T>(condition: boolean, whenTrue: () => T, whenFalse: () => T): T;
export function relationResolve<T, U>(condition: boolean, whenTrue: () => T, whenFalse: () => U): T | U;
export function relationResolve<T, U>(condition: boolean, whenTrue: () => T, whenFalse: () => U): T | U {
  const branches: readonly [() => U, () => T] = [whenFalse, whenTrue];
  return branches[Number(condition)]();
}

export function relationGate<T>(condition: boolean, whenTrue: () => T, whenFalse: () => T): T;
export function relationGate<T, U>(condition: boolean, whenTrue: () => T, whenFalse: () => U): T | U;
export function relationGate<T, U>(condition: boolean, whenTrue: () => T, whenFalse: () => U): T | U {
  return [whenFalse, whenTrue][Number(condition)]();
}

export const relationAny = (predicates: readonly boolean[], index = 0): boolean =>
  relationGate(index >= predicates.length, () => false, () =>
    relationGate(predicates[index], () => true, () => relationAny(predicates, index + 1)));

export const relationAll = (predicates: readonly boolean[], index = 0): boolean =>
  relationGate(index >= predicates.length, () => true, () =>
    relationGate(predicates[index], () => relationAll(predicates, index + 1), () => false));

export const relationEqual = <T>(left: T, right: T): boolean => {
  const leftNumber = Object.is(typeof left, 'number');
  const rightNumber = Object.is(typeof right, 'number');
  const bothNaN = relationAll([leftNumber, rightNumber, Number.isNaN(left), Number.isNaN(right)]);
  const signedZeroPair = relationAny([
    relationAll([Object.is(left, 0), Object.is(right, -0)]),
    relationAll([Object.is(left, -0), Object.is(right, 0)]),
  ]);
  return relationAny([signedZeroPair, relationAll([!bothNaN, Object.is(left, right)])]);
};

export const relationNotEqual = <T>(left: T, right: T): boolean => !relationEqual(left, right);

export const relationSome = <T>(value: T): RelationOption<T> => ({ kind: 'some', value });
export const relationNone = <T>(): RelationOption<T> => ({ kind: 'none' });
export type RelationSome<T> = { readonly kind: 'some'; readonly value: T };
export type RelationNone = { readonly kind: 'none' };
export const relationIsSome = <T>(option: RelationOption<T>): option is RelationSome<T> => relationEqual(option.kind, 'some');
export const relationIsNone = <T>(option: RelationOption<T>): option is RelationNone => relationEqual(option.kind, 'none');

function relationRefineSingleton<T, U extends T>(
  value: T,
  predicate: (candidate: T) => candidate is U,
): readonly U[];
function relationRefineSingleton<T>(
  value: T,
  predicate: (candidate: T) => boolean,
): readonly T[] {
  return relationResolve(predicate(value), () => [value], () => []);
}

export function relationOptionFold<T, R>(
  option: RelationOption<T>,
  noneBranch: () => R,
  someBranch: (value: T) => R,
): R;
export function relationOptionFold<T, R1, R2>(
  option: RelationOption<T>,
  noneBranch: () => R1,
  someBranch: (value: T) => R2,
): R1 | R2;
export function relationOptionFold<T, R1, R2>(
  option: RelationOption<T>,
  noneBranch: () => R1,
  someBranch: (value: T) => R2,
): R1 | R2 {
  const witnesses = relationRefineSingleton(option, relationIsSome);
  return relationResolve(witnesses.length > 0, () => someBranch(witnesses[0].value), noneBranch);
}

export const RELATION_NONE: unique symbol = Symbol('relation-none');
export type RelationNoneValue = typeof RELATION_NONE;
export type RelationMaybe<T> = T | RelationNoneValue;
export const relationMaybeNone = <T>(): RelationMaybe<T> => RELATION_NONE;
export const relationIsMaybeNone = <T>(value: RelationMaybe<T>): value is RelationNoneValue => Object.is(value, RELATION_NONE);
export const relationIsPresent = <T>(value: RelationMaybe<T>): value is T => !relationIsMaybeNone(value);
