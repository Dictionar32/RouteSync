/**
 * memoizedDatabase.ts
 *
 * Implements MemoizedQueryDatabase with dependency tracking and revision validation.
 *
 * @module core/compiler/query/database
 */

import { TypedCache, type MemoizedQueryKey, createMemoizedQueryKey } from '../TypedCache';
import { type QueryCell, createPendingCell, createReadyCell, isReady, addDependency } from '../QueryCell';

export class MemoizedQueryDatabase {
  private readonly cells = new TypedCache();
  private activeStack: string[] = [];

  public runQuery<I, O>(
    key: MemoizedQueryKey<O>,
    compute: (input: I) => O,
    input: I,
    revision: string
  ): O {
    const queryId = key.id;

    if (this.activeStack.length > 0) {
      const parent = this.activeStack[this.activeStack.length - 1]!;
      const parentCellKey = createMemoizedQueryKey<QueryCell<unknown>>(parent);
      const parentCell = this.cells.get(parentCellKey);

      if (parentCell) {
        const updatedParent = addDependency(parentCell, queryId);
        this.cells.set(parentCellKey, updatedParent);
      }
    }

    const cellKey = createMemoizedQueryKey<QueryCell<O>>(queryId);
    const cached = this.cells.get(cellKey);

    if (cached && isReady(cached) && cached.verifiedAtRevision === revision) {
      return cached.value;
    }

    this.activeStack.push(queryId);
    this.cells.set(cellKey, createPendingCell(revision));

    try {
      const value = compute(input);

      const cell = this.cells.get(cellKey);
      if (cell) {
        this.cells.set(cellKey, createReadyCell(value, revision, cell.dependencies));
      }

      return value;
    } finally {
      this.activeStack.pop();
    }
  }

  public clear(): void {
    this.cells.clear();
    this.activeStack = [];
  }

  public getActiveStack(): readonly string[] {
    return this.activeStack;
  }

  public getStats(): { size: number; activeQueries: number } {
    return {
      size: this.cells.size,
      activeQueries: this.activeStack.length
    };
  }
}
