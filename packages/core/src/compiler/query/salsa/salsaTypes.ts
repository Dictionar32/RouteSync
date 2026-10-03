/** Core relations and contracts for the incremental query engine. */
import type { FileSpan } from '../../types/FileSpan';
import type { RelationOption } from '../../../semantic/kernel/relationFoundation';
import type { MemoizedQueryKey } from '../TypedCache';

export interface QueryKey<O> extends MemoizedQueryKey<O> {
  readonly queryName: string;
  readonly targetId: string;
  readonly optionsHash: string;
  derive(targetId: string, optionsHash?: string): QueryKey<O>;
}

export interface QueryNode {
  readonly keyId: string;
  readonly dependencies: readonly string[];
  readonly dependents: readonly string[];
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

export interface QueryCycleError extends Error { readonly queryStack: readonly QueryFrame[]; }
export const createQueryCycleError = (message: string, queryStack: readonly QueryFrame[]): QueryCycleError => Object.assign(Error(message), { name: 'QueryCycleError', queryStack });

export interface ActiveQueryFrame { readonly keyId: string; }
export interface SalsaCompilerStats { readonly totalQueries: number; readonly activeQueries: number; readonly graphSize: number; }
export type QueryValue<O> = RelationOption<O>;
