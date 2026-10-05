/** Loop facts represented as relation memberships. */
import type { RelationMembership } from '../../../semantic/foundation/relationMembership';
export interface LoopInfo {
    readonly header: number;
    readonly backEdges: readonly number[];
    readonly loopBlocks: RelationMembership<number>;
}

export interface LoopRelations { readonly loops: readonly LoopInfo[]; }
