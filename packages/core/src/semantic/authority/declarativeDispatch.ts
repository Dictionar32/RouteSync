import { relationResolve, relationFirstOption, relationOptionFold, type RelationOption } from '../kernel/relationalSequence';
import { relationEqual } from '../kernel/semanticRelations';

export type DispatchCase<K extends string, V> = Readonly<{
  readonly key: K;
  readonly value: V;
}>;

export const dispatch = <K extends string, V>(
  cases: readonly DispatchCase<K, V>[],
  key: K,
): RelationOption<V> => relationFirstOption(cases, entry => relationEqual(entry.key, key));

export const dispatchValue = <K extends string, V>(
  cases: Readonly<Record<K, V>>,
  key: K,
  fallback: V,
): V => relationResolve(
  Object.prototype.hasOwnProperty.call(cases, key),
  () => cases[key],
  () => fallback,
);

export const dispatchOptionValue = <K extends string, V>(
  cases: readonly DispatchCase<K, V>[],
  key: K,
  fallback: V,
): V => relationOptionFold(dispatch(cases, key), () => fallback, value => value);
