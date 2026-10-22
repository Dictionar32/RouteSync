/** Explicit presence ADT. Absence is data, never represented by a host sentinel. */
export type Presence<T> =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly value: T };

export const absent = <T>(): Presence<T> => ({ kind: 'absent' });
export const present = <T>(value: T): Presence<T> => ({ kind: 'present', value });

export const isPresent = <T>(value: Presence<T>): boolean => value.kind === 'present';

export const isAbsent = <T>(value: Presence<T>): boolean => value.kind === 'absent';

export type Cardinality = 'empty' | 'non_empty';
export type FlagPresence = { readonly kind: 'absent' } | { readonly kind: 'present' };

export const fromBooleanFlag = (value: boolean): FlagPresence => {
  switch (value) {
    case true:
      return Object.freeze({ kind: 'present' });
    case false:
      return Object.freeze({ kind: 'absent' });
  }
};

export const cardinalityOf = <T>(values: readonly T[]): Cardinality =>
  values.length === 0 ? 'empty' : 'non_empty';

export const presenceOf = <T>(value: T | void): Presence<T> => {
  if (value === undefined) {
    return absent<T>();
  }
  return present(value);
};

export const mapPresenceValue = <T, U>(value: T | void, map: (value: T) => U): Presence<U> => {
  if (value === undefined) {
    return absent<U>();
  }
  return present(map(value));
};

export const presenceFold = <T, R>(
  value: Presence<T>,
  absentBranch: () => R,
  presentBranch: (item: T) => R,
): R => {
  switch (value.kind) {
    case 'absent':
      return absentBranch();
    case 'present':
      return presentBranch(value.value);
  }
};

export const mapPresence = <T, U>(value: Presence<T>, map: (value: T) => U): Presence<U> =>
  presenceFold(value, () => absent<U>(), entry => present(map(entry)));

export const bindPresence = <T, U>(value: Presence<T>, map: (value: T) => Presence<U>): Presence<U> =>
  presenceFold(value, () => absent<U>(), map);
