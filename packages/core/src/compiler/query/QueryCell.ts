/**
 * @fileoverview Query cell types for incremental computation
 * @module compiler/query/QueryCell
 */

/**
 * State of a query computation cell
 * 
 * A query cell can be in one of two states:
 * - Pending: Computation is in progress or dependencies are being tracked
 * - Ready: Computation is complete and value is available
 * 
 * @template V Type of the query result value
 */
export type QueryCell<V> =
    | {
        readonly kind: 'Pending';
        readonly dependencies: readonly string[];
        readonly verifiedAtRevision: string;
    }
    | {
        readonly kind: 'Ready';
        readonly value: V;
        readonly dependencies: readonly string[];
        readonly verifiedAtRevision: string;
    };

/**
 * Creates a pending query cell
 * 
 * @param revision Current revision
 * @param dependencies Initial dependencies (default: empty)
 * @returns A pending query cell
 * 
 * @example
 * ```typescript
 * const cell = createPendingCell('rev1');
 * ```
 */
export function createPendingCell<V>(
    revision: string,
    dependencies: readonly string[] = []
): QueryCell<V> {
    return {
        kind: 'Pending',
        dependencies,
        verifiedAtRevision: revision
    };
}

/**
 * Creates a ready query cell with a computed value
 * 
 * @param value Computed value
 * @param revision Current revision
 * @param dependencies Query dependencies
 * @returns A ready query cell
 * 
 * @example
 * ```typescript
 * const cell = createReadyCell(42, 'rev1', ['dep1']);
 * ```
 */
export function createReadyCell<V>(
    value: V,
    revision: string,
    dependencies: readonly string[] = []
): QueryCell<V> {
    return {
        kind: 'Ready',
        value,
        dependencies,
        verifiedAtRevision: revision
    };
}

/**
 * Type guard to check if a cell is ready
 * 
 * @param cell Query cell to check
 * @returns True if the cell is ready
 */
export function isReady<V>(cell: QueryCell<V>): cell is Extract<QueryCell<V>, { kind: 'Ready' }> {
    return cell.kind === 'Ready';
}

/**
 * Type guard to check if a cell is pending
 * 
 * @param cell Query cell to check
 * @returns True if the cell is pending
 */
export function isPending<V>(cell: QueryCell<V>): cell is Extract<QueryCell<V>, { kind: 'Pending' }> {
    return cell.kind === 'Pending';
}

/**
 * Adds a dependency to a query cell
 * 
 * @param cell Original cell
 * @param dependency New dependency to add
 * @returns Updated cell with the new dependency
 */
export function addDependency<V>(cell: QueryCell<V>, dependency: string): QueryCell<V> {
    const newDeps = [...cell.dependencies, dependency];

    if (cell.kind === 'Ready') {
        return {
            kind: 'Ready',
            value: cell.value,
            dependencies: newDeps,
            verifiedAtRevision: cell.verifiedAtRevision
        };
    } else {
        return {
            kind: 'Pending',
            dependencies: newDeps,
            verifiedAtRevision: cell.verifiedAtRevision
        };
    }
}
