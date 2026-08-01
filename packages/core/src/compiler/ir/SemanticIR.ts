/**
 * SemanticIR.ts
 * Semantic Intermediate Representation
 */

import type { FileSpan } from '../types/FileSpan';
import type { SemanticType } from '../types/SemanticType';

export type SemanticIRNodeKind =
    | 'EntityDeclaration'
    | 'EndpointDeclaration'
    | 'PropertyDeclaration'
    | 'RelationDeclaration';

export type IRNodeId = number;

export interface SemanticOrigin {
    readonly span: FileSpan;
    readonly symbolId?: number;
}

export interface SemanticIRNode {
    readonly id: IRNodeId;
    readonly kind: SemanticIRNodeKind;
    readonly type: SemanticType;
    readonly inputs: readonly IRNodeId[];
    readonly origin?: SemanticOrigin;
    readonly ownerModule: string;
    readonly symbolId: number;
    readonly dependencyEdges: readonly IRNodeId[];
}

export class SemanticIRArena {
    private nodes: SemanticIRNode[] = [];

    public allocate(
        kind: SemanticIRNodeKind,
        type: SemanticType,
        inputs: readonly IRNodeId[],
        origin: SemanticOrigin | undefined,
        ownerModule: string,
        symbolId: number,
        dependencyEdges: readonly IRNodeId[]
    ): IRNodeId {
        const id = this.nodes.length;
        this.nodes.push({ id, kind, type, inputs, origin, ownerModule, symbolId, dependencyEdges });
        return id;
    }

    public get(id: IRNodeId): SemanticIRNode {
        const node = this.nodes[id];
        if (!node) throw new Error(`Invalid IRNodeId: ${id}`);
        return node;
    }
}
