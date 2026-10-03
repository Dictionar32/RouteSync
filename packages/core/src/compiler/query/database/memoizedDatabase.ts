/** Relation-backed memoized query database. */
import type { MemoizedQueryKey } from '../TypedCache';
import { createMemoizedQueryKey, createTypedCache, type TypedCache } from '../TypedCache';
import { type QueryCell, createPendingCell, createReadyCell, addDependency } from '../QueryCell';
import { relationOptionFold, relationGate, relationFirst, relationAll } from '../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../semantic/kernel/relationFoundation';

export interface MemoizedQueryDatabase {
  readonly runQuery: <I, O>(key: MemoizedQueryKey<O>, compute: (input: I) => O, input: I, revision: string) => O;
  readonly clear: () => void;
  readonly getActiveStack: () => readonly string[];
  readonly getStats: () => { readonly size: number; readonly activeQueries: number };
}

export const createMemoizedQueryDatabase = (): MemoizedQueryDatabase => {
  const cells: TypedCache = createTypedCache();
  let activeStack: readonly string[] = Object.freeze([]);
  const runQuery = <I, O>(key: MemoizedQueryKey<O>, compute: (input: I) => O, input: I, revision: string): O => {
    const queryId = key.id;
    relationGate(activeStack.length > 0, () => {
      const parent = relationFirst(activeStack.slice(-1), () => true);
      relationOptionFold(parent, () => {}, parentId => {
        const parentCellKey = createMemoizedQueryKey<QueryCell<unknown>>(parentId);
        relationOptionFold(cells.get(parentCellKey), () => {}, parentCell => cells.set(parentCellKey, addDependency(parentCell, queryId)));
      });
    }, () => {});
    const cellKey = createMemoizedQueryKey<QueryCell<O>>(queryId);
    const cached = cells.get(cellKey);
    return relationOptionFold(cached,
      () => computeFresh(),
      cell => relationGate(relationAllReady(cell, revision), () => (cell as Extract<QueryCell<O>, { kind: 'Ready' }>).value, () => computeFresh()),
    );
    function relationAllReady(cell: QueryCell<O>, expectedRevision: string): boolean {
      return relationAll([relationEqual(cell.kind, 'Ready'), relationEqual(cell.verifiedAtRevision, expectedRevision)]);
    }
    function computeFresh(): O {
      activeStack = Object.freeze([...activeStack, queryId]);
      cells.set(cellKey, createPendingCell<O>(revision));
      try {
        const value = compute(input);
        relationOptionFold(cells.get(cellKey), () => {}, cellValue => { cells.set(cellKey, createReadyCell(value, revision, cellValue.dependencies)); });
        return value;
      } finally {
        activeStack = Object.freeze(activeStack.slice(0, -1));
      }
    }
  };
  return {
    runQuery,
    clear: (): void => { cells.clear(); activeStack = Object.freeze([]); },
    getActiveStack: (): readonly string[] => activeStack,
    getStats: () => ({ size: cells.size, activeQueries: activeStack.length }),
  };
};
