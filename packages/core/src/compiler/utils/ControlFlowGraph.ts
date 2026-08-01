import { BasicBlock } from "../ir";

/**
 * Control Flow Graph - represents program structure as basic blocks.
 * 
 * @example
 * ```typescript
 * const cfg: ControlFlowGraph = {
 *   entry: 0,
 *   blocks: new Map([
 *     [0, entryBlock],
 *     [1, loopBlock],
 *     [2, exitBlock]
 *   ])
 * };
 * ```
 */
export class ControlFlowGraph {
    constructor(
        public readonly entryBlock: number,
        public readonly exitBlock: number,
        public readonly blocks: ReadonlyMap<number, BasicBlock>
    ) { }
}