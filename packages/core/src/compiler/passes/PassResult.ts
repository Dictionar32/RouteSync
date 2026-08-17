/**
 * @file PassResult.ts
 * @description Result types for compiler pass execution and typed analysis keys.
 */
import type { DiagnosticBag } from '../diagnostics/DiagnosticBag';
import type { AnalysisRegistry, AnalysisKeyName } from '../analysis/AnalysisRegistry';

declare const analysisKeyBrand: unique symbol;

/**
 * A compile-time analysis key bound to an analysis registry entry.
 *
 * The key name K determines the result type through R[K]. No runtime cast is
 * needed to recover the value type from a stored key.
 */
export class AnalysisKey<
    R extends object,
    K extends AnalysisKeyName<R>,
> {
    declare readonly [analysisKeyBrand]: R[K];

    constructor(public readonly name: K) { }
}

export type DefaultAnalysisKey = AnalysisKey<
    AnalysisRegistry,
    AnalysisKeyName<AnalysisRegistry>
>;

/**
 * Creates keys without repeating the registry generic at every call site.
 */
export function createAnalysisKeyFactory<R extends object>() {
    return <K extends AnalysisKeyName<R>>(name: K): AnalysisKey<R, K> =>
        new AnalysisKey<R, K>(name);
}

export interface PassResult {
    readonly changed: boolean;
    readonly preservedAnalyses: ReadonlySet<DefaultAnalysisKey>;
    readonly diagnostics?: DiagnosticBag;
}