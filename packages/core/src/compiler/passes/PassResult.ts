/**
 * @file PassResult.ts
 * @description Result types untuk compiler pass execution
 */

import type { DiagnosticBag } from '../diagnostics/DiagnosticBag';

/**
 * Marker type untuk analysis keys
 * Used untuk type-safe analysis key identification
 */
declare const analysisKeyBrand: unique symbol;

/**
 * Type-safe key untuk identifying specific analysis results
 * 
 * @template T - Type of analysis result
 * 
 * @example
 * ```typescript
 * const CFGAnalysisKey = new AnalysisKey<ControlFlowGraph>('CFG');
 * const DominatorsKey = new AnalysisKey<DominatorTree>('Dominators');
 * ```
 */
export interface AnalysisKey<T> {
    readonly [analysisKeyBrand]: T;
}

/**
 * Factory untuk creating type-safe analysis keys
 * 
 * @template T - Type of analysis result
 */
export class AnalysisKey<T> {
    constructor(readonly name: string) { }
}

/**
 * Result dari compiler pass execution
 * 
 * Contains information about:
 * - Whether pass modified IR
 * - Which analyses are still valid
 * - Any diagnostics generated
 * 
 * @example
 * ```typescript
 * const result: PassResult = {
 *   changed: true,
 *   preservedAnalyses: new Set([CFGAnalysisKey]),
 *   diagnostics: diagnosticBag
 * };
 * ```
 */
export interface PassResult {
    /** Whether pass modified the IR */
    readonly changed: boolean;

    /** Set of analyses yang masih valid setelah pass */
    readonly preservedAnalyses: ReadonlySet<AnalysisKey<unknown>>;

    /** Optional diagnostics generated during pass execution */
    readonly diagnostics?: DiagnosticBag;
}
