/**
 * Construct-free collection algebra supporting semantic execution.
 *
 * These are relation-engine primitives, not semantic operators. They provide
 * recursion, projection, selection, expansion, accumulation, and visitation
 * over immutable sequences without source-language dispatch constructs.
 */
import { relationResolve } from './relationFoundation';

export const project = <A, B>(
  values: readonly A[], operation: (value: A, index: number) => B,
  index = 0,
  output: B[] = [],
): B[] => relationResolve(
  index >= values.length,
  () => output,
  () => project(values, operation, index + 1, output.concat([operation(values[index], index)])),
);

export const retain = <A>(
  values: readonly A[],
  predicate: (value: A, index: number, source: readonly A[]) => boolean,
  index = 0,
  output: A[] = [],
): A[] => relationResolve(
  index >= values.length,
  () => output,
  () => relationResolve(
    predicate(values[index], index, values),
    () => retain(values, predicate, index + 1, output.concat([values[index]])),
    () => retain(values, predicate, index + 1, output),
  ),
);

export const expand = <A, B>(
  values: readonly A[],
  operation: (value: A, index: number) => readonly B[],
  index = 0,
  output: B[] = [],
): B[] => relationResolve(
  index >= values.length,
  () => output,
  () => expand(values, operation, index + 1, output.concat([...operation(values[index], index)])),
);

export const accumulate = <A, B>(
  values: readonly A[],
  operation: (state: B, value: A, index: number) => B,
  initial: B,
  index = 0,
): B => relationResolve(
  index >= values.length,
  () => initial,
  () => accumulate(values, operation, operation(initial, values[index], index), index + 1),
);

export const visit = <A>(
  values: readonly A[],
  operation: (value: A, index: number) => void,
  index = 0,
): void => relationResolve(
  index >= values.length,
  () => {},
  () => {
    operation(values[index], index);
    visit(values, operation, index + 1);
    return;
  },
);
