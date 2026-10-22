/** Canonical semantic relation facade. */
export {
  relationAny,
  relationAll,
  relationEqual,
  relationNotEqual,
  relationSome,
  relationNone,
  relationIsSome,
  relationIsNone,
  relationGate,
  relationResolve,
  relationOptionFold,
} from './relationFoundation';
export type { RelationOption, RelationSome, RelationNone } from './relationFoundation';

export {
  relationProject,
  relationSelect,
  relationExpand,
  relationFoldRight,
  relationFold,
  relationAsyncFold,
  relationIndexOf,
  relationLastIndexOf,
  relationAnyMatch,
  relationEvery,
  relationFixedPoint,
  relationLatticeFixedPoint,
  relationLookup,
  relationFirstOption,
  relationOptionValue,
  relationFirst,
  relationFirstValue,
  relationFirstOr,
  relationMapValueOr,
  relationAt,
  relationTextEnclosedFields,
  relationTextFind,
  relationTextReplaceEnclosed,
  relationTextRemoveSuffix,
  relationTextRemovePrefix,
  relationRefine,
  relationOptionMap,
  relationRange,
  relationSlice,
  relationSequenceToArray,
  relationAdvanceIndex,
  relationCount,
  relationTextLength,
  relationTextIsUpperIdentifier,
} from './relationalSequence';

import { relationAny, relationEqual, relationGate } from './relationFoundation';

const relationWhitespace = (value: string, index: number): boolean =>
  relationGate(index >= value.length, () => false, () => relationAny([
    relationEqual(value.charCodeAt(index), 9),
    relationEqual(value.charCodeAt(index), 10),
    relationEqual(value.charCodeAt(index), 13),
    relationEqual(value.charCodeAt(index), 32),
  ]));

const relationNormalizeStart = (value: string, index = 0, output = ''): string =>
  relationGate(index >= value.length, () => output, () => relationGate(relationWhitespace(value, index), () => relationNormalizeStart(value, index + 1, output), () => {
    const collect = (cursor: number, result: string): string =>
      relationGate(cursor >= value.length, () => result, () => collect(cursor + 1, result + value.charAt(cursor)));
    return collect(index, output);
  }));

export const relationNormalizeWhitespace = (value: string): string => {
  const start = relationNormalizeStart(value);
  const finish = (index: number, output = ''): string =>
    relationGate(index < 0, () => output, () => relationGate(relationWhitespace(start, index), () => finish(index - 1, output), () => finish(index - 1, start.charAt(index) + output)));
  return finish(start.length - 1);
};
