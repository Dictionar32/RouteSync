/** Immutable relational sequence primitives used by compiler infrastructure. */
export type RelationStep<T> =
  | { readonly kind: 'emit'; readonly value: T }
  | { readonly kind: 'skip' }
  | { readonly kind: 'stop' };

export function relationResolve<R>(condition: boolean, yes: () => R, no: () => R): R;
export function relationResolve<R, S>(condition: boolean, yes: () => R, no: () => S): R | S;
export function relationResolve<R, S>(condition: boolean, yes: () => R, no: () => S): R | S {
  const branches: readonly [() => S, () => R] = [no, yes];
  return branches[Number(condition)]();
}

export function relationGate<R>(condition: boolean, yes: () => R, no: () => R): R;
export function relationGate<R, S>(condition: boolean, yes: () => R, no: () => S): R | S;
export function relationGate<R, S>(condition: boolean, yes: () => R, no: () => S): R | S {
  return [no, yes][Number(condition)]();
}

export const walkRelation = <T, R>(
  source: readonly T[],
  step: (value: T, index: number) => RelationStep<R>,
  index = 0,
  output: readonly R[] = Object.freeze([]),
): readonly R[] => {
  const terminal = index >= source.length;
  const current = source[index] as T;
  const relationStep: RelationStep<R> = relationResolve(terminal, () => ({ kind: 'stop' as const }), () => step(current, index));
  const readers = Object.freeze({
    emit: (entry: RelationStep<R> & { readonly kind: 'emit' }) => walkRelation(source, step, index + 1, Object.freeze([...output, entry.value])),
    skip: () => walkRelation(source, step, index + 1, output),
    stop: () => output,
  });
  return relationResolve(Object.is(relationStep.kind, 'emit'),
    () => readers.emit(relationStep as Extract<RelationStep<R>, { readonly kind: 'emit' }>),
    () => relationResolve(Object.is(relationStep.kind, 'skip'), () => readers.skip(), () => readers.stop()),
  );
};

export const projectRelation = <T, R>(source: readonly T[], project: (value: T, index: number) => R): readonly R[] =>
  walkRelation(source, (value, index) => ({ kind: 'emit', value: project(value, index) }));

export function selectRelation<T, S extends T>(source: readonly T[], predicate: (value: T, index: number) => value is S): readonly S[];
export function selectRelation<T>(source: readonly T[], predicate: (value: T, index: number) => boolean): readonly T[];
export function selectRelation<T>(source: readonly T[], predicate: (value: T, index: number) => boolean): readonly T[] {
  return walkRelation(source, (value, index) => relationResolve<RelationStep<T>>(predicate(value, index), () => ({ kind: 'emit', value }), () => ({ kind: 'skip' })));
}

export const expandRelation = <T, R>(source: readonly T[], expand: (value: T, index: number) => readonly R[], index = 0, output: readonly R[] = Object.freeze([])): readonly R[] =>
  relationResolve(index >= source.length, () => output, () => expandRelation(source, expand, index + 1, Object.freeze([...output, ...expand(source[index] as T, index)])));

export const distinctRelation = <T>(source: readonly T[], key: (value: T) => string): readonly T[] => {
  const seen = new Set<string>();
  return walkRelation(source, value => {
    const identifier = key(value);
    const fresh = !seen.has(identifier);
    seen.add(identifier);
    return relationResolve<RelationStep<T>>(fresh, () => ({ kind: 'emit', value }), () => ({ kind: 'skip' }));
  });
};

export const visitRelation = <T>(source: readonly T[], visit: (value: T, index: number, source: readonly T[]) => void): void => {
  walkRelation(source, (value, index) => {
    visit(value, index, source);
    return { kind: 'skip' as const };
  });
};

export const accumulateRelation = <T, R>(
  source: readonly T[],
  seed: R,
  step: (accumulator: R, value: T, index: number, source: readonly T[]) => R,
): R => {
  const walk = (index: number, accumulator: R): R =>
    relationResolve(index >= source.length, () => accumulator, () => walk(index + 1, step(accumulator, source[index] as T, index, source)));
  return walk(0, seed);
};

export const relationAt = <T>(source: readonly T[], index: number): RelationStep<T> =>
  relationResolve(index >= source.length, () => ({ kind: 'stop' as const }), () => ({ kind: 'emit' as const, value: source[index] as T }));

export const firstRelation = <T>(source: readonly T[], predicate: (value: T, index: number) => boolean, index = 0): RelationStep<T> =>
  relationResolve(index >= source.length, () => ({ kind: 'stop' as const }), () => {
    const value = source[index] as T;
    return relationResolve(predicate(value, index), () => ({ kind: 'emit' as const, value }), () => firstRelation(source, predicate, index + 1));
  });

export {
  relationOptionFold, relationFirstOption, relationProject, relationSelect, relationAll, relationAny,
  relationEqual, relationNotEqual, relationIsSome, relationIsNone, relationFixedPoint, relationResolve as semanticRelationResolve,
} from '../../semantic/kernel/relationalSequence';
