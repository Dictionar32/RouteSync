/**
 * Declarative relation sequence primitives.
 *
 * Collections are traversed as recursive relation closure. Presence is a
 * witness relation.
 */
import {
  RELATION_NONE,
  relationAny,
  relationEqual,
  relationNotEqual,
  relationGate,
  relationResolve,
  relationNone,
  relationSome,
  relationOptionFold,
  relationIsSome,
  relationIsNone,
  relationIsPresent,
  type RelationOption,
  type RelationMaybe,
} from './relationFoundation';
import { relationUnique, relationIndexAdd, relationIndexLookup, type RelationIndex } from './relationMembership';
import type { Sequence } from '../../types/upstream/collections';

export {
  RELATION_NONE, relationAny, relationEqual, relationGate, relationResolve,
  relationNone, relationSome, relationOptionFold, relationIsSome, relationIsNone, relationIsPresent, relationNotEqual,
  relationUnique, relationIndexAdd, relationIndexLookup,
};
export type { RelationOption, RelationMaybe, RelationNone, RelationSome, RelationIndex };

export type RelationPredicate<T> = (value: T, index: number) => boolean;
export type RelationRefinement<T, U extends T> = (value: T, index: number) => value is U;
export type RelationProject<T, U> = (value: T, index: number) => U;
export type RelationFolder<T, A> = (accumulator: A, value: T, index: number) => A;

export type RelationRightFolder<T, A> = (value: T, accumulator: A, index: number) => A;

export const relationRange = <T>(
  source: readonly T[],
  start: number,
  end: number,
  index = 0,
  output: readonly T[] = [],
): readonly T[] =>
  relationResolve(
    relationAny([index >= end, start + index >= source.length]),
    () => output,
    () => relationRange(source, start, end, relationAdvanceIndex(index, 1), [...output, source[start + index]]),
  );

export function relationSelect<T, U extends T>(
  source: readonly T[],
  predicate: RelationRefinement<T, U>,
): readonly U[];
export function relationSelect<T>(
  source: readonly T[],
  predicate: RelationPredicate<T>,
): readonly T[];
export function relationSelect<T>(
  source: readonly T[],
  predicate: RelationPredicate<T>,
): readonly T[] {
  return relationSelectClosure(source, predicate, 0, []);
}

const relationSelectClosure = <T>(
  source: readonly T[],
  predicate: RelationPredicate<T>,
  index: number,
  output: readonly T[],
): readonly T[] => relationResolve(
  index < source.length,
  () => {
    const value = source[index];
    const next = relationResolve(predicate(value, index), () => [...output, value], () => output);
    return relationSelectClosure(source, predicate, relationAdvanceIndex(index, 1), next);
  },
  () => output,
);

export const relationProject = <T, U>(
  source: readonly T[],
  projection: RelationProject<T, U>,
  index = 0,
  output: readonly U[] = [],
): readonly U[] =>
  relationResolve(
    index < source.length,
    () => relationProject(source, projection, relationAdvanceIndex(index, 1), [...output, projection(source[index], index)]),
    () => output,
  );

export const relationExpand = <T, U>(
  source: readonly T[],
  expansion: (value: T, index: number) => readonly U[],
  index = 0,
  output: readonly U[] = [],
): readonly U[] =>
  relationResolve(
    index < source.length,
    () => relationExpand(source, expansion, relationAdvanceIndex(index, 1), [...output, ...expansion(source[index], index)]),
    () => output,
  );

export const expandRelation = relationExpand;

export const relationFoldRight = <T, A>(
  source: readonly T[],
  initial: A,
  folder: RelationRightFolder<T, A>,
  index = source.length - 1,
): A =>
  relationResolve(
    index < 0,
    () => initial,
    () => relationFoldRight(source, folder(source[index], initial, index), folder, relationAdvanceIndex(index, -1)),
  );

export const relationFold = <T, A>(
  source: readonly T[],
  initial: A,
  folder: RelationFolder<T, A>,
  index = 0,
): A =>
  relationResolve(
    index < source.length,
    () => relationFold(source, folder(initial, source[index], index), folder, relationAdvanceIndex(index, 1)),
    () => initial,
  );

export type RelationAsyncFolder<T, A> = (accumulator: A, value: T, index: number) => Promise<A>;

export const relationAsyncFold = async <T, A>(
  source: readonly T[],
  initial: A,
  folder: RelationAsyncFolder<T, A>,
  index = 0,
): Promise<A> =>
  relationResolve(
    index < source.length,
    () => folder(initial, source[index], index).then(next => relationAsyncFold(source, next, folder, relationAdvanceIndex(index, 1))),
    () => Promise.resolve(initial),
  );

export const relationIndexOf = <T>(
  source: readonly T[],
  predicate: RelationPredicate<T>,
  index = 0,
): number =>
  relationResolve(
    index < source.length,
    () => relationResolve(predicate(source[index], index), () => index, () => relationIndexOf(source, predicate, relationAdvanceIndex(index, 1))),
    () => -1,
  );

export const relationLastIndexOf = <T>(
  source: readonly T[],
  predicate: RelationPredicate<T>,
  index = source.length - 1,
): number =>
  relationResolve(
    index >= 0,
    () => relationResolve(predicate(source[index], index), () => index, () => relationLastIndexOf(source, predicate, index - 1)),
    () => -1,
  );

export const relationAnyMatch = <T>(
  source: readonly T[],
  predicate: RelationPredicate<T>,
  index = 0,
): boolean =>
  relationResolve(
    index < source.length,
    () => relationResolve(predicate(source[index], index), () => true, () => relationAnyMatch(source, predicate, relationAdvanceIndex(index, 1))),
    () => false,
  );

export const relationEvery = <T>(
  source: readonly T[],
  predicate: RelationPredicate<T>,
  index = 0,
): boolean =>
  relationResolve(
    index < source.length,
    () => relationResolve(predicate(source[index], index), () => relationEvery(source, predicate, relationAdvanceIndex(index, 1)), () => false),
    () => true,
  );


export type RelationFixedPoint<T> = Readonly<{
  readonly value: T;
  readonly rounds: number;
  readonly converged: boolean;
}>;

export type RelationLattice<T> = Readonly<{
  readonly bottom: T;
  readonly join: (left: T, right: T) => T;
  readonly equal: (left: T, right: T) => boolean;
}>;

/** Least-fixed-point evaluation over an explicit join-semilattice.
 * The transfer result is joined with the current approximation, so monotone
 * analyses cannot retract established facts during closure.
 */
export const relationLatticeFixedPoint = <T>(
  lattice: RelationLattice<T>,
  seed: T,
  transfer: (value: T) => T,
  maxRounds = 128,
): RelationFixedPoint<T> => {
  const settle = (value: T, round: number): RelationFixedPoint<T> => {
    const next = lattice.join(value, transfer(value));
    const stable = lattice.equal(value, next);
    return relationResolve(
      relationAny([stable, relationEqual(round, maxRounds)]),
      () => ({ value: next, rounds: round, converged: stable }),
      () => settle(next, round + 1),
    );
  };
  return settle(lattice.join(lattice.bottom, seed), 0);
};

export const relationFixedPoint = <T>(
  seed: T,
  step: (value: T) => T,
  equal: (left: T, right: T) => boolean,
  maxRounds = 128,
): RelationFixedPoint<T> => {
  const settle = (value: T, round: number): RelationFixedPoint<T> => {
    const next = step(value);
    const stable = equal(value, next);
    return relationResolve(
      relationAny([stable, relationEqual(round, maxRounds)]),
      () => ({ value: next, rounds: round, converged: stable }),
      () => settle(next, round + 1),
    );
  };
  return settle(seed, 0);
};

export const relationAll = (conditions: readonly boolean[], index = 0): boolean =>
  relationResolve(
    index >= conditions.length,
    () => true,
    () => relationResolve(conditions[index], () => relationAll(conditions, relationAdvanceIndex(index, 1)), () => false),
  );

export const relationLookup = <K, V>(
  entries: readonly (readonly [K, V])[],
  key: K,
  index = 0,
): RelationOption<V> => relationGate(
  index >= entries.length,
  () => relationNone<V>(),
  () => relationGate(
    relationEqual(entries[index][0], key),
    () => relationSome(entries[index][1]),
    () => relationLookup(entries, key, relationAdvanceIndex(index, 1)),
  ),
);

export function relationFirstOption<T, U extends T>(
  source: readonly T[],
  predicate: RelationRefinement<T, U>,
): RelationOption<U>;
export function relationFirstOption<T>(
  source: readonly T[],
  predicate: RelationPredicate<T>,
): RelationOption<T>;
export function relationFirstOption<T>(
  source: readonly T[],
  predicate: RelationPredicate<T>,
): RelationOption<T> {
  return relationFirstOptionClosure(source, predicate, 0);
}

const relationFirstOptionClosure = <T>(
  source: readonly T[],
  predicate: RelationPredicate<T>,
  index: number,
): RelationOption<T> => relationResolve(
  index < source.length,
  () => relationResolve(
    predicate(source[index], index),
    () => relationSome(source[index]),
    () => relationFirstOptionClosure(source, predicate, relationAdvanceIndex(index, 1)),
  ),
  () => relationNone(),
);

export const relationOptionValue = <T>(option: RelationOption<T>, fallback: T): T =>
  relationOptionFold(option, () => fallback, value => value);

export const relationFirst = <T>(
  source: readonly T[],
  predicate: RelationPredicate<T>,
): RelationOption<T> => relationFirstOption(source, predicate);

export const relationFirstValue = <T>(source: readonly T[], predicate: RelationPredicate<T>): RelationMaybe<T> =>
  relationOptionFold(relationFirst(source, predicate), () => RELATION_NONE, value => value);

export const relationFirstOr = <T>(
  source: readonly T[],
  predicate: RelationPredicate<T>,
  fallback: T,
): T => relationOptionValue(relationFirst(source, predicate), fallback);

export const relationMapValueOr = <K, V>(
  source: readonly (readonly [K, V])[],
  key: K,
  fallback: V,
): V => relationOptionValue(
  relationOptionMap(
    relationFirst(source, ([candidate]) => relationEqual(candidate, key)),
    ([, value]) => value,
  ),
  fallback,
);

export const relationCatalogValueOr = <K, V>(
  source: readonly (readonly [K, V])[],
  key: K,
  fallback: V,
): V => relationOptionValue(
  relationOptionMap(
    relationFirst(source, ([candidate]) => relationEqual(candidate, key)),
    ([, value]) => value,
  ),
  fallback,
);


export const relationSequenceToArray = <T>(
  source: Sequence<T>,
  output: readonly T[] = [],
): readonly T[] => relationGate(
  relationEqual(source.kind, 'cons'),
  () => relationSequenceConsToArray(source as Extract<Sequence<T>, { readonly kind: 'cons' }>, output),
  () => output,
);

const relationSequenceConsToArray = <T>(
  source: Extract<Sequence<T>, { readonly kind: 'cons' }>,
  output: readonly T[],
): readonly T[] => relationSequenceToArray(source.tail, [...output, source.head]);

export const relationAdvanceIndex = (index: number, offset: number): number => index + offset;

export const relationCount = <T>(source: readonly T[]): number => relationFold(source, 0, count => count + 1);

export const relationTextLength = (source: string): number => source.length;

export const relationTextIsUpperIdentifier = (source: string, index = 0): boolean => relationResolve(
  index >= source.length,
  () => relationNotEqual(index, 0),
  () => {
    const code = source.charCodeAt(index);
    const letter = relationAll([code >= 65, code <= 90]);
    const digit = relationAll([code >= 48, code <= 57]);
    const underscore = relationEqual(code, 95);
    return relationResolve(
      relationAll([relationEqual(index, 0), relationNotEqual(letter, true)]),
      () => false,
      () => relationResolve(relationAny([letter, digit, underscore]), () => relationTextIsUpperIdentifier(source, relationAdvanceIndex(index, 1)), () => false),
    );
  },
);

export const relationSlice = <T>(source: readonly T[], start: number, end = source.length, index = 0, output: readonly T[] = Object.freeze([])): readonly T[] =>
  relationGate(index >= source.length, () => output, () => relationGate(index >= end, () => output, () => relationSlice(source, start, end, relationAdvanceIndex(index, 1), relationGate(index >= start, () => [...output, source[index]], () => output))));

export const relationTextSlice = (source: string, start: number, end = source.length, index = 0, output = ''): string =>
  relationGate(index >= source.length, () => output, () => relationGate(index >= end, () => output, () => relationTextSlice(source, start, end, relationAdvanceIndex(index, 1), relationGate(index >= start, () => output + source.charAt(index), () => output))));


export const relationTextCharIn = (value: string, chars: readonly string[], index = 0): boolean =>
  relationResolve(index >= chars.length, () => false, () => relationResolve(relationEqual(value, chars[index]), () => true, () => relationTextCharIn(value, chars, relationAdvanceIndex(index, 1))));

export const relationTextDropWhile = (source: string, predicate: (value: string) => boolean, index = 0): string =>
  relationResolve(
    index >= source.length,
    () => '',
    () => relationResolve(predicate(source.charAt(index)), () => relationTextDropWhile(source, predicate, relationAdvanceIndex(index, 1)), () => relationTextSlice(source, index)),
  );

export const relationTextTrimChars = (source: string, chars: readonly string[], start = 0, end = source.length): string =>
  relationResolve(
    start >= end,
    () => '',
    () => relationResolve(
      relationTextCharIn(source.charAt(start), chars),
      () => relationTextTrimChars(source, chars, relationAdvanceIndex(start, 1), end),
      () => relationTextSlice(source, start, end),
    ),
  );

export const relationTextTrimEndChars = (source: string, chars: readonly string[], end = source.length): string =>
  relationResolve(
    end <= 0,
    () => '',
    () => relationResolve(
      relationTextCharIn(source.charAt(end - 1), chars),
      () => relationTextTrimEndChars(source, chars, end - 1),
      () => relationTextSlice(source, 0, end),
    ),
  );

export const relationTextStartsWith = (source: string, prefix: string, index = 0): boolean =>
  relationResolve(
    index >= prefix.length,
    () => true,
    () => relationResolve(
      index >= source.length,
      () => false,
      () => relationResolve(
        relationEqual(source.charAt(index), prefix.charAt(index)),
        () => relationTextStartsWith(source, prefix, relationAdvanceIndex(index, 1)),
        () => false,
      ),
    ),
  );

export const relationTextEndsWith = (source: string, suffix: string, index = 0): boolean =>
  relationGate(source.length >= suffix.length, () => relationTextStartsWith(relationTextSlice(source, source.length - suffix.length), suffix, index), () => false);

export const relationTextLower = (source: string, index = 0, output = ''): string =>
  relationResolve(
    index >= source.length,
    () => output,
    () => relationTextLower(source, relationAdvanceIndex(index, 1), output + source.charAt(index).toLowerCase()),
  );

export const relationTextFields = (source: string, delimiter: string, index = 0, start = 0, output: readonly string[] = []): readonly string[] =>
  relationResolve(
    index >= source.length,
    () => [...output, relationTextSlice(source, start)],
    () => relationResolve(
      relationAll([relationTextStartsWith(relationTextSlice(source, index), delimiter, 0), relationEqual(relationTextSlice(source, index, index + delimiter.length), delimiter)]),
      () => relationTextFields(source, delimiter, relationAdvanceIndex(index, delimiter.length), relationAdvanceIndex(index, delimiter.length), [...output, relationTextSlice(source, start, index)]),
      () => relationTextFields(source, delimiter, relationAdvanceIndex(index, 1), start, output),
    ),
  );

export const relationAt = <T>(source: readonly T[], index: number): RelationOption<T> =>
  relationResolve(
    relationAll([index >= 0, index < source.length]),
    () => relationSome(source[index]),
    () => relationNone(),
  );

export const relationTextNumber = (source: string, fallback = 0): number => {
  const value = Number(source);
  return relationResolve(relationEqual(Number.isNaN(value), false), () => value, () => fallback);
};

export const relationTextEnclosedFields = (source: string, open: string, close: string, index = 0, output: readonly string[] = []): readonly string[] =>
  relationResolve(
    index >= source.length,
    () => output,
    () => relationResolve(
      relationEqual(source.charAt(index), open),
      () => {
        const end = relationTextFind(source, close, relationAdvanceIndex(index, 1));
        return relationResolve(
          relationEqual(end, -1),
          () => output,
          () => relationTextEnclosedFields(source, open, close, relationAdvanceIndex(end, 1), [...output, relationTextSlice(source, relationAdvanceIndex(index, 1), end)]),
        );
      },
      () => relationTextEnclosedFields(source, open, close, relationAdvanceIndex(index, 1), output),
    ),
  );

export const relationTextFind = (source: string, needle: string, index = 0): number =>
  relationResolve(
    index >= source.length,
    () => -1,
    () => relationResolve(
      relationTextStartsWith(relationTextSlice(source, index), needle),
      () => index,
      () => relationTextFind(source, needle, relationAdvanceIndex(index, 1)),
    ),
  );

export const relationTextReplaceEnclosed = (source: string, open: string, close: string, replacementPrefix: string, index = 0, output = ''): string =>
  relationResolve(
    index >= source.length,
    () => output,
    () => relationResolve(
      relationEqual(source.charAt(index), open),
      () => {
        const end = relationTextFind(source, close, relationAdvanceIndex(index, 1));
        return relationResolve(
          relationEqual(end, -1),
          () => output + relationTextSlice(source, index),
          () => relationTextReplaceEnclosed(source, open, close, replacementPrefix, relationAdvanceIndex(end, 1), output + replacementPrefix + relationTextSlice(source, relationAdvanceIndex(index, 1), end)),
        );
      },
      () => relationTextReplaceEnclosed(source, open, close, replacementPrefix, relationAdvanceIndex(index, 1), output + source.charAt(index)),
    ),
  );

export const relationTextRemoveSuffix = (source: string, suffix: string): string =>
  relationGate(relationTextEndsWith(source, suffix), () => relationTextSlice(source, 0, relationTextFind(source, suffix)), () => source);

export const relationTextRemovePrefix = (source: string, prefix: string): string =>
  relationGate(relationTextStartsWith(source, prefix), () => relationTextSlice(source, prefix.length), () => source);

export const relationTextFirstField = (source: string, delimiter: string, fallback = ''): string =>
  relationOptionFold(
    relationFirstOption(relationTextFields(source, delimiter), value => value.length > 0),
    () => fallback,
    value => value,
  );

export const relationRefine = <T, S extends T>(value: T, predicate: (candidate: T) => candidate is S): RelationOption<S> =>
  relationFirstOption([value], predicate);

export type RelationVariant<T extends { readonly kind: string }, K extends T['kind']> = T extends { readonly kind: K } ? T : never;

export const relationVariant = <T extends { readonly kind: string }, K extends T['kind']>(
  value: T,
  kind: K,
): RelationOption<RelationVariant<T, K>> =>
  relationRefine(value, (candidate): candidate is RelationVariant<T, K> => relationEqual(candidate.kind, kind));

export const relationVariantValue = <T extends { readonly kind: string }, K extends T['kind']>(
  value: T,
  kind: K,
): RelationVariant<T, K> =>
  relationOptionFold(
    relationVariant(value, kind),
    () => { throw Error(`Missing relation variant ${String(kind)}`); },
    candidate => candidate,
  );

export const relationVariantFold = <T extends { readonly kind: string }, K extends T['kind'], R>(
  value: T,
  kind: K,
  absentBranch: () => R,
  presentBranch: (candidate: RelationVariant<T, K>) => R,
): R => relationOptionFold(relationVariant(value, kind), absentBranch, presentBranch);



export const relationOptionalFold = <T, R>(value: T | void, absentBranch: () => R, presentBranch: (value: T) => R): R =>
  relationResolve(Object.is(value, void 0), absentBranch, () => presentBranch(value as T));

export const relationOptionMap = <T, U>(
  option: RelationOption<T>,
  projection: (value: T) => U,
): RelationOption<U> => relationOptionFold(
  option,
  () => relationNone(),
  value => relationSome(projection(value)),
);
