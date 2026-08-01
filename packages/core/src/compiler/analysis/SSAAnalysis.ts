/**
 * @file SSAAnalysis.ts
 * @description SSA (Static Single Assignment) form construction dan analysis
 */

import type { ControlFlowGraph, BasicBlock, Instruction, Operand } from '../utils/ControlFlowGraph';
import type { DominatorTree, DominanceFrontier } from './DominatorAnalysis';

/**
 * SSA basic block type
 * Currently aliases BasicBlock - SSA form uses same structure
 */
export type SSABasicBlock = BasicBlock;

/**
 * SSA representation dari program
 * 
 * In SSA form:
 * - Each variable defined exactly once
 * - Each use refers to single definition
 * - Phi functions at join points untuk merge values
 * 
 * @example
 * ```typescript
 * const ssa = new SSARepresentation(entryBlockId, ssaBlocks);
 * 
 * // Access SSA blocks
 * const block = ssa.blocks.get(blockId);
 * console.log('Block instructions:', block?.instructions);
 * ```
 */
export class SSARepresentation {
    constructor(
        /** Entry block ID */
        public readonly entryBlock: number,

        /** Map of block ID -> SSA basic block */
        public readonly blocks: ReadonlyMap<number, SSABasicBlock>
    ) { }

    /**
     * Get block by ID
     */
    public getBlock(id: number): SSABasicBlock | undefined {
        return this.blocks.get(id);
    }

    /**
     * Get all block IDs
     */
    public get blockIds(): readonly number[] {
        return Array.from(this.blocks.keys());
    }
}

/**
 * SSA construction via phi insertion dan variable renaming
 * 
 * Implements classic algorithm:
 * 1. Insert phi nodes at dominance frontiers
 * 2. Rename variables untuk SSA form
 * 
 * @example
 * ```typescript
 * // Insert phi nodes
 * const cfgWithPhis = SSABuilder.insertPhiNodes(cfg, dominanceFrontier, variables);
 * 
 * // Then rename
 * const dom = new DominatorTree();
 * dom.compute(cfgWithPhis);
 * const renamer = new SSARenamer();
 * const ssaCfg = renamer.rename(cfgWithPhis, dom);
 * ```
 */
export class SSABuilder {
    /**
     * Insert phi nodes untuk SSA construction
     * 
     * Places phi nodes at join points (dominance frontiers) untuk each variable.
     * 
     * @param cfg - Control flow graph
     * @param df - Dominance frontier
     * @param variables - Variable IDs to process
     * @returns CFG with phi nodes inserted
     */
    public static insertPhiNodes(
        cfg: ControlFlowGraph,
        df: DominanceFrontier,
        variables: readonly number[]
    ): ControlFlowGraph {
        const blocks = new Map<number, BasicBlock>(cfg.blocks);

        for (const varId of variables) {
            // Find blocks yang define this variable
            const defBlocks = new Set<number>();

            for (const [blockId, block] of cfg.blocks) {
                for (const inst of block.instructions) {
                    if (inst.kind === 'Assign' && inst.target === varId) {
                        defBlocks.add(blockId);
                    }
                }
            }

            // Iteratively place phi nodes at frontiers
            const worklist = Array.from(defBlocks);
            const addedPhis = new Set<number>();

            while (worklist.length > 0) {
                const x = worklist.shift()!;

                // For each block dalam dominance frontier
                for (const y of df.getFrontier(x)) {
                    if (!addedPhis.has(y)) {
                        const block = blocks.get(y);
                        if (block) {
                            // Create phi node dengan incoming dari each predecessor
                            const incoming = new Map<number, Operand>();
                            for (const pred of block.predecessors) {
                                incoming.set(pred, { kind: 'Variable', id: varId });
                            }

                            const phiInst: Instruction = {
                                kind: 'Phi',
                                target: varId,
                                incoming
                            };

                            // Insert phi at beginning of block
                            blocks.set(y, {
                                ...block,
                                instructions: [phiInst, ...block.instructions]
                            });

                            addedPhis.add(y);

                            // If this block wasn't already a def block, add to worklist
                            if (!defBlocks.has(y)) {
                                worklist.push(y);
                            }
                        }
                    }
                }
            }
        }

        return new ControlFlowGraph(cfg.entryBlock, cfg.exitBlock, blocks);
    }
}

/**
 * SSA variable renaming
 * 
 * Renames variables dalam SSA form sehingga each definition gets unique name.
 * Implements algorithm dari Cytron et al.
 * 
 * @example
 * ```typescript
 * const renamer = new SSARenamer();
 * const ssaCfg = renamer.rename(cfgWithPhis, dominatorTree);
 * 
 * // Now each variable definition has unique version number
 * ```
 */
export class SSARenamer {
    /** Counter untuk next version number per variable */
    private count = new Map<number, number>();

    /** Stack of current version numbers per variable */
    private stack = new Map<number, number[]>();

    /**
     * Rename variables dalam CFG untuk SSA form
     * 
     * @param cfg - CFG with phi nodes inserted
     * @param dom - Dominator tree
     * @returns CFG dengan renamed variables
     */
    public rename(cfg: ControlFlowGraph, dom: DominatorTree): ControlFlowGraph {
        const blocks = new Map<number, BasicBlock>(cfg.blocks);

        // Initialize counters dan stacks
        for (const [_, block] of cfg.blocks) {
            for (const inst of block.instructions) {
                if (inst.kind === 'Assign') {
                    this.count.set(inst.target, 0);
                    this.stack.set(inst.target, [0]);
                }
            }
        }

        // Recursive renaming starting dari entry
        this.renameBlock(cfg.entryBlock, blocks, dom, cfg);

        return new ControlFlowGraph(cfg.entryBlock, cfg.exitBlock, blocks);
    }

    /**
     * Rename variables dalam single block dan recursively process children
     */
    private renameBlock(
        blockId: number,
        blocks: Map<number, BasicBlock>,
        dom: DominatorTree,
        cfg: ControlFlowGraph
    ): void {
        const block = blocks.get(blockId);
        if (!block) return;

        const newInstructions: (Instruction)[] = [];

        // First, rename phi instructions
        for (const inst of block.instructions) {
            if (inst.kind === 'Phi') {
                const varId = inst.target;
                const currentCount = (this.count.get(varId) ?? 0) + 1;
                this.count.set(varId, currentCount);
                this.stack.get(varId)?.push(currentCount);

                newInstructions.push({
                    kind: 'Phi',
                    target: currentCount,
                    incoming: inst.incoming
                });
            }
        }

        // Then, rename other instructions
        for (const inst of block.instructions) {
            if (inst.kind === 'Phi') continue;

            let renamedInst = inst;

            if (inst.kind === 'Assign') {
                const varId = inst.target;
                const currentCount = (this.count.get(varId) ?? 0) + 1;
                this.count.set(varId, currentCount);
                this.stack.get(varId)?.push(currentCount);

                renamedInst = {
                    kind: 'Assign',
                    target: currentCount,
                    value: this.renameOperand(inst.value)
                };
            } else if (inst.kind === 'Call') {
                if ('args' in inst) {
                    renamedInst = {
                        ...inst,
                        args: inst.args.map((arg: Operand) => this.renameOperand(arg))
                    };
                }
            } else if (inst.kind === 'Return' && inst.value) {
                renamedInst = {
                    kind: 'Return',
                    value: this.renameOperand(inst.value)
                };
            }

            newInstructions.push(renamedInst);
        }

        blocks.set(blockId, {
            ...block,
            instructions: newInstructions
        });

        // Update phi nodes dalam successors
        for (const succId of block.successors) {
            const succ = blocks.get(succId);
            if (succ) {
                const updatedInsts = succ.instructions.map(inst => {
                    if (inst.kind === 'Phi') {
                        const incoming = new Map<number, Operand>(inst.incoming);

                        for (const [predId, op] of incoming) {
                            if (predId === blockId && op.kind === 'Variable') {
                                const activeVersions = this.stack.get(op.id) ?? [];
                                const activeVersion = activeVersions[activeVersions.length - 1] ?? op.id;
                                incoming.set(predId, { kind: 'SSAValue', id: activeVersion });
                            }
                        }

                        return { ...inst, incoming };
                    }
                    return inst;
                });

                blocks.set(succId, { ...succ, instructions: updatedInsts });
            }
        }

        // Recursively process dominated children
        const children = dom.getChildren(blockId);
        for (const childId of children) {
            this.renameBlock(childId, blocks, dom, cfg);
        }

        // Pop versions after processing block
        for (const inst of block.instructions) {
            if (inst.kind === 'Assign' || inst.kind === 'Phi') {
                const varId = inst.target;
                this.stack.get(varId)?.pop();
            }
        }
    }

    /**
     * Rename operand berdasarkan active version
     */
    private renameOperand(op: Operand): Operand {
        if (op.kind === 'Variable') {
            const activeVersions = this.stack.get(op.id) ?? [];
            const activeVersion = activeVersions[activeVersions.length - 1];

            if (activeVersion !== undefined) {
                return { kind: 'SSAValue', id: activeVersion };
            }
        }

        return op;
    }
}
