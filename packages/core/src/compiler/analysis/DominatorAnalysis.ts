/**
 * @file DominatorAnalysis.ts
 * @description Dominator tree computation dan dominance analysis
 */

import type { ControlFlowGraph } from '../utils/ControlFlowGraph';

/**
 * Dominator tree untuk CFG analysis
 * 
 * Computes dominance relationships dalam control flow graph.
 * Node A dominates node B jika semua paths dari entry ke B harus melalui A.
 * 
 * Uses Lengauer-Tarjan algorithm variant untuk efficient computation.
 * 
 * @example
 * ```typescript
 * const dom = new DominatorTree();
 * dom.compute(cfg);
 * 
 * // Check dominance
 * if (dom.dominates(ancestorId, descendantId)) {
 *   console.log('Ancestor dominates descendant');
 * }
 * 
 * // Get immediate dominator
 * const idom = dom.getImmediateDominator(blockId);
 * 
 * // Get dominated children
 * const children = dom.getChildren(blockId);
 * ```
 */
export class DominatorTree {
    /** Immediate dominator map: blockId -> immediate dominator blockId */
    private idoms = new Map<number, number>();

    /** Dominator tree structure: blockId -> set of immediately dominated children */
    private domTree = new Map<number, Set<number>>();

    /**
     * Compute dominator tree untuk given CFG
     * 
     * Uses iterative data-flow algorithm dengan reverse postorder traversal
     * untuk efficient convergence.
     * 
     * @param cfg - Control flow graph to analyze
     */
    public compute(cfg: ControlFlowGraph): void {
        const blocks = Array.from(cfg.blocks.values());
        if (blocks.length === 0) return;

        const startNode = cfg.entryBlock;
        // Entry node dominates itself
        this.idoms.set(startNode, startNode);

        // Compute in reverse postorder untuk faster convergence
        const rpo = this.computeRPO(cfg);

        // Iterative fixed-point computation
        let changed = true;
        while (changed) {
            changed = false;

            for (const blockId of rpo) {
                if (blockId === startNode) continue;

                const block = cfg.blocks.get(blockId)!;

                // Only consider predecessors yang sudah punya dominator
                const processedPreds = block.predecessors.filter(p => this.idoms.has(p));
                if (processedPreds.length === 0) continue;

                // Find common dominator dari semua predecessors
                let newIdom = processedPreds[0]!;
                for (let i = 1; i < processedPreds.length; i++) {
                    const pred = processedPreds[i]!;
                    newIdom = this.intersect(pred, newIdom, rpo);
                }

                // Update jika berubah
                if (this.idoms.get(blockId) !== newIdom) {
                    this.idoms.set(blockId, newIdom);
                    changed = true;
                }
            }
        }

        // Build dominator tree structure
        for (const [node, idom] of this.idoms) {
            if (node === startNode) continue;
            const children = this.domTree.get(idom) ?? new Set();
            children.add(node);
            this.domTree.set(idom, children);
        }
    }

    /**
     * Find intersection (common dominator) dari dua blocks
     * 
     * @param b1 - First block ID
     * @param b2 - Second block ID
     * @param rpo - Reverse postorder sequence
     * @returns Common dominator block ID
     */
    private intersect(b1: number, b2: number, rpo: readonly number[]): number {
        let finger1 = b1;
        let finger2 = b2;
        const rpoIndex = new Map<number, number>(rpo.map((id, idx) => [id, idx]));

        // Walk up dominator tree sampai find common ancestor
        while (finger1 !== finger2) {
            const idx1 = rpoIndex.get(finger1) ?? -1;
            const idx2 = rpoIndex.get(finger2) ?? -1;

            if (idx1 > idx2) {
                finger1 = this.idoms.get(finger1)!;
            } else {
                finger2 = this.idoms.get(finger2)!;
            }
        }

        return finger1;
    }

    /**
     * Compute reverse postorder traversal dari CFG
     * 
     * RPO ensures bahwa dominators are processed before dominated nodes,
     * leading to faster convergence.
     * 
     * @param cfg - Control flow graph
     * @returns Array of block IDs dalam reverse postorder
     */
    private computeRPO(cfg: ControlFlowGraph): readonly number[] {
        const visited = new Set<number>();
        const order: number[] = [];

        // Depth-first search untuk postorder
        const dfs = (nodeId: number) => {
            visited.add(nodeId);
            const block = cfg.blocks.get(nodeId);

            if (block) {
                for (const succ of block.successors) {
                    if (!visited.has(succ)) {
                        dfs(succ);
                    }
                }
            }

            // Add after visiting successors (postorder)
            order.push(nodeId);
        };

        dfs(cfg.entryBlock);

        // Reverse untuk get RPO
        return order.reverse();
    }

    /**
     * Get immediate dominator dari given block
     * 
     * @param blockId - Block ID to query
     * @returns Immediate dominator block ID, atau undefined jika tidak ada
     */
    public getImmediateDominator(blockId: number): number | undefined {
        return this.idoms.get(blockId);
    }

    /**
     * Get semua blocks yang immediately dominated oleh given block
     * 
     * @param blockId - Block ID to query
     * @returns Set of immediately dominated block IDs
     */
    public getChildren(blockId: number): ReadonlySet<number> {
        return this.domTree.get(blockId) ?? new Set();
    }

    /**
     * Check apakah ancestor dominates descendant
     * 
     * Node A dominates node B jika semua paths dari entry ke B pass through A.
     * 
     * @param ancestor - Potential dominating block ID
     * @param descendant - Block ID to check
     * @returns True jika ancestor dominates descendant
     */
    public dominates(ancestor: number, descendant: number): boolean {
        let current: number | undefined = descendant;

        // Walk up dominator tree
        while (current !== undefined) {
            if (current === ancestor) return true;

            const next: number | undefined = this.getImmediateDominator(current);

            // Prevent infinite loop (self-domination)
            if (next === current) break;

            current = next;
        }

        return false;
    }

    /**
     * Clear semua dominator information
     */
    public clear(): void {
        this.idoms.clear();
        this.domTree.clear();
    }
}

/**
 * Dominance frontier computation
 * 
 * Dominance frontier dari node N adalah set of nodes where:
 * - N dominates predecessor dari node
 * - N tidak strictly dominate node itu sendiri
 * 
 * Used dalam SSA construction untuk phi node placement.
 * 
 * @example
 * ```typescript
 * const df = new DominanceFrontier();
 * df.compute(cfg, dominatorTree);
 * 
 * const frontier = df.getFrontier(blockId);
 * console.log('Dominance frontier:', Array.from(frontier));
 * ```
 */
export class DominanceFrontier {
    /** Dominance frontier map: blockId -> set of frontier blocks */
    private frontiers = new Map<number, Set<number>>();

    /**
     * Compute dominance frontiers untuk all blocks dalam CFG
     * 
     * @param cfg - Control flow graph
     * @param dom - Computed dominator tree
     */
    public compute(cfg: ControlFlowGraph, dom: DominatorTree): void {
        // Initialize empty frontiers
        for (const [blockId] of cfg.blocks) {
            this.frontiers.set(blockId, new Set());
        }

        // Compute frontiers
        for (const [blockId, block] of cfg.blocks) {
            // Only process join points (multiple predecessors)
            if (block.predecessors.length >= 2) {
                for (const predId of block.predecessors) {
                    let runner = predId;
                    const idom = dom.getImmediateDominator(blockId);

                    // Walk up dominator tree sampai reach immediate dominator
                    while (runner !== idom && runner !== undefined) {
                        this.frontiers.get(runner)?.add(blockId);

                        const next = dom.getImmediateDominator(runner);

                        // Prevent infinite loop
                        if (next === runner) break;

                        runner = next!;
                    }
                }
            }
        }
    }

    /**
     * Get dominance frontier untuk given block
     * 
     * @param blockId - Block ID to query
     * @returns Set of block IDs dalam dominance frontier
     */
    public getFrontier(blockId: number): ReadonlySet<number> {
        return this.frontiers.get(blockId) ?? new Set();
    }

    /**
     * Clear semua frontier information
     */
    public clear(): void {
        this.frontiers.clear();
    }
}
