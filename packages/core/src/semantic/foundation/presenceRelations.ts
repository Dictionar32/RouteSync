/** Phase 345 — typed presence relation. Absence is a relation witness, not a sentinel. */

export type Presence<T> =
  | { readonly relation: 'absent'; readonly fold: <R>(onAbsent: () => R, onPresent: (value: T) => R) => R }
  | { readonly relation: 'present'; readonly value: T; readonly fold: <R>(onAbsent: () => R, onPresent: (value: T) => R) => R };

export const absent = <T>(): Presence<T> => {
  const value: Presence<T> = Object.freeze({
    relation: 'absent',
    fold: <R>(onAbsent: () => R) => onAbsent(),
  });
  return value;
};

export const present = <T>(value: T): Presence<T> => {
  const result: Presence<T> = Object.freeze({
    relation: 'present',
    value,
    fold: <R>(_onAbsent: () => R, onPresent: (entry: T) => R) => onPresent(value),
  });
  return result;
};

export const presenceFold = <T, R>(
  value: Presence<T>,
  onAbsent: () => R,
  onPresent: (entry: T) => R,
): R => value.fold(onAbsent, onPresent);

export const presenceProject = <T, R>(
  value: Presence<T>,
  project: (entry: T) => R,
): Presence<R> => presenceFold(value, absent, entry => present(project(entry)));
