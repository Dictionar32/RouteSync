/**
 * ContractGraph.ts
 * Contract graph representation and builder
 */

import type { SemanticType } from '../types/SemanticType';
import { ImmutableMap } from '../utils/ImmutableCollections';
import type { SemanticOrigin } from './SemanticIR';

export interface NodeId {
    readonly layer: 'entity' | 'schema' | 'endpoint' | 'relation';
    readonly name: string;
}

export interface ContractBaseNode {
    readonly id: NodeId;
    readonly name: string;
    readonly versionHash: string;
    readonly origin?: SemanticOrigin;
    accept<T>(visitor: ContractVisitor<T>): T;
}

export class EntityNode implements ContractBaseNode {
    readonly kind = 'entity';
    constructor(
        readonly id: NodeId,
        readonly name: string,
        readonly versionHash: string,
        readonly properties: ImmutableMap<string, SemanticType>,
        readonly origin?: SemanticOrigin
    ) { }
    public accept<T>(visitor: ContractVisitor<T>): T {
        return visitor.visitEntity(this);
    }
}

export class SchemaNode implements ContractBaseNode {
    readonly kind = 'schema';
    constructor(
        readonly id: NodeId,
        readonly name: string,
        readonly versionHash: string,
        readonly schema: SemanticType,
        readonly origin?: SemanticOrigin
    ) { }
    public accept<T>(visitor: ContractVisitor<T>): T {
        return visitor.visitSchema(this);
    }
}

export class RelationNode implements ContractBaseNode {
    readonly kind = 'relation';
    constructor(
        readonly id: NodeId,
        readonly name: string,
        readonly versionHash: string,
        readonly source: NodeId,
        readonly target: NodeId,
        readonly origin?: SemanticOrigin
    ) { }
    public accept<T>(visitor: ContractVisitor<T>): T {
        return visitor.visitRelation(this);
    }
}

export type ContractNode =
    | EntityNode
    | SchemaNode
    | RelationNode;

export class ContractGraph {
    constructor(public readonly nodes: ImmutableMap<string, ContractNode>) {
        Object.freeze(this);
    }

    public node(id: NodeId): ContractNode | undefined {
        return this.nodes.get(`${id.layer}:${id.name}`);
    }
}

export class ContractGraphBuilder {
    private nodes = new Map<string, ContractNode>();

    public addNode(node: ContractNode): this {
        this.nodes.set(`${node.id.layer}:${node.id.name}`, node);
        return this;
    }

    public build(): ContractGraph {
        return new ContractGraph(new ImmutableMap(this.nodes));
    }
}

export interface ContractVisitor<T> {
    visitEntity(node: EntityNode): T;
    visitSchema(node: SchemaNode): T;
    visitRelation(node: RelationNode): T;
}
