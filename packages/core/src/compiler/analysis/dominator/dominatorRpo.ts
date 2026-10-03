/** Reverse-postorder traversal as recursive relation closure. */
import type { ControlFlowGraph } from '../../utils/ControlFlowGraph';
import { basicBlockLookup } from '../../utils/ControlFlowGraph';
import { relationContains } from '../../../semantic/kernel/relationMembership';
import { relationOptionFold, relationResolve } from '../../../semantic/kernel/relationalSequence';

export function computeRPO(cfg: ControlFlowGraph): readonly number[] {
    const visit = (node: number, visited: readonly number[], order: readonly number[]): readonly number[] => {
        const seen = relationResolve(relationContains(visited, node), () => visited, () => Object.freeze([...visited, node]));
        return relationOptionFold(
            basicBlockLookup(cfg.blocks, node),
            () => Object.freeze([node, ...order]),
            block => {
                const descend = (successors: readonly number[], index: number, state: readonly [readonly number[], readonly number[]]): readonly [readonly number[], readonly number[]] => relationResolve(
                    index >= successors.length,
                    () => state,
                    () => {
                        const nextNode = successors[index];
                        const nextState = relationResolve(
                            relationContains(state[0], nextNode),
                            () => state,
                            () => [Object.freeze([...state[0], nextNode]), visit(nextNode, state[0], state[1])] as const,
                        );
                        return descend(successors, index + 1, nextState);
                    },
                );
                const state = descend(block.successors, 0, [seen, order]);
                return Object.freeze([node, ...state[1]]);
            },
        );
    };
    return Object.freeze([...visit(cfg.entryBlock, [], [])].reverse());
}
