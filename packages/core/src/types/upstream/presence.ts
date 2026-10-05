import { relationEqual } from '../../semantic/foundation/semanticRelations';
import { relationFirstOption, relationOptionFold, relationOptionalFold, relationVariant } from '../../semantic/foundation/relationalSequence';
/** Explicit presence ADT. Absence is data, never represented by a host sentinel. */
export type Presence<T> =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly value: T };

export const absent = <T>(): Presence<T> => ({ kind: 'absent' });
export const present = <T>(value: T): Presence<T> => ({ kind: 'present', value });

export const isPresent = <T>(value: Presence<T>): boolean =>
  ({ absent: false, present: true } satisfies Record<Presence<T>['kind'], boolean>)[value.kind];

export const isAbsent = <T>(value: Presence<T>): boolean =>
  ({ absent: true, present: false } satisfies Record<Presence<T>['kind'], boolean>)[value.kind];

export type Cardinality = 'empty' | 'non_empty';
export type FlagPresence = { readonly kind: 'absent' } | { readonly kind: 'present' };

const BOOLEAN_PRESENCE: readonly (readonly ['true' | 'false', FlagPresence])[] = [
  ['true', Object.freeze({ kind: 'present' as const })],
  ['false', Object.freeze({ kind: 'absent' as const })],
];

const CARDINALITY_BY_EMPTY = [
  ['true', 'empty'],
  ['false', 'non_empty'],
] as const;

const catalogValue = <K extends string, V>(catalog: readonly (readonly [K, V])[], key: K): V =>
  relationOptionFold(
    relationFirstOption(catalog, item => relationEqual(item[0], key)),
    () => catalog[0][1],
    item => item[1],
  );

const booleanKey = (value: boolean): 'true' | 'false' =>
  ({ true: 'true', false: 'false' } as const)[String(value) as 'true' | 'false'];

export const fromBooleanFlag = (value: boolean): FlagPresence =>
  catalogValue(BOOLEAN_PRESENCE, booleanKey(value));

export const cardinalityOf = <T>(values: readonly T[]): Cardinality =>
  catalogValue(CARDINALITY_BY_EMPTY, String(relationEqual(values.length, 0)) as 'true' | 'false');

export const presenceOf = <T>(value: T | void): Presence<T> =>
  relationOptionalFold(value, () => absent<T>(), entry => present(entry));

export const mapPresenceValue = <T, U>(value: T | void, map: (value: T) => U): Presence<U> =>
  relationOptionalFold(value, () => absent<U>(), entry => present(map(entry)));

export const presenceFold = <T, R>(
  value: Presence<T>,
  absentBranch: () => R,
  presentBranch: (item: T) => R,
): R => relationOptionFold(
  relationVariant(value, 'present'),
  absentBranch,
  item => presentBranch(item.value),
);

export const mapPresence = <T, U>(value: Presence<T>, map: (value: T) => U): Presence<U> =>
  presenceFold(value, () => absent<U>(), entry => present(map(entry)));

export const bindPresence = <T, U>(value: Presence<T>, map: (value: T) => Presence<U>): Presence<U> =>
  presenceFold(value, () => absent<U>(), map);
