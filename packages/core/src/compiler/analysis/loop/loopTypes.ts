/**
 * Loop Types and Contracts.
 *
 * @module compiler/analysis/loop
 */

/**
 * Information tentang detected loop
 */
export interface LoopInfo {
    /** Loop header block ID (dominator dari semua loop blocks) */
    readonly header: number;

    /** Back edge sources (blocks yang jump back ke header) */
    readonly backEdges: readonly number[];

    /** Set of semua blocks dalam loop */
    readonly loopBlocks: ReadonlySet<number>;
}
