/**
 * salsaTypes.ts
 *
 * Core types and interfaces for the Salsa incremental query engine.
 *
 * @module core/compiler/query/salsa/salsaTypes
 */

import type { FileSpan } from '../../types/FileSpan';
import type { MemoizedQueryKey } from '../TypedCache';

export interface QueryKey<O> extends MemoizedQueryKey<O> {
    readonly queryName: string;
    readonly targetId: string;
    readonly optionsHash: string;

    derive(targetId: string, optionsHash?: string): QueryKey<O>;
}

export interface QueryNode {
    readonly keyId: string;
    readonly dependencies: ReadonlySet<string>;
    readonly dependents: ReadonlySet<string>;
    readonly lastChangedRevision: number;
    readonly lastVerifiedRevision: number;
}

export interface QueryContext {
    readonly packageId?: string;
    readonly moduleId?: string;
    readonly symbolId?: string;
}

export interface QueryFrame {
    readonly key: QueryKey<unknown>;
    readonly queryKind: string;
    readonly context?: QueryContext;
    readonly span?: FileSpan;
}

export class QueryCycleError extends Error {
    constructor(
        message: string,
        public readonly queryStack: readonly QueryFrame[],
    ) {
        super(message);
        this.name = 'QueryCycleError';
    }
}

export interface ActiveQueryFrame {
    readonly keyId: string;
}

export interface SalsaCompilerStats {
    readonly totalQueries: number;
    readonly activeQueries: number;
    readonly graphSize: number;
}
