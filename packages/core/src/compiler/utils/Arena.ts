/**
 * @file Arena.ts
 * @description Arena allocator untuk efficient memory management dan ID-based referencing
 */

import type { FileSpan } from '../types/FileSpan';

/**
 * Generic arena allocator untuk type-safe storage dengan ID-based access
 * 
 * @template T - Type of items stored in arena
 * 
 * @example
 * ```typescript
 * const arena = new Arena<string>();
 * const id = arena.allocate("hello");
 * console.log(arena.get(id)); // "hello"
 * ```
 */
export class Arena<T> {
    private items: T[] = [];

    /**
     * Allocate item dalam arena dan return ID-nya
     * 
     * @param item - Item untuk di-allocate
     * @returns Unique ID untuk item
     */
    public allocate(item: T): number {
        const id = this.items.length;
        this.items.push(item);
        return id;
    }

    /**
     * Retrieve item dari arena by ID
     * 
     * @param id - ID dari item
     * @returns Item yang di-allocate
     * @throws Error jika ID invalid
     */
    public get(id: number): T {
        const item = this.items[id];
        if (item === undefined) {
            throw new Error(`Invalid Arena ID: ${id}`);
        }
        return item;
    }

    /**
     * Get total number of items dalam arena
     */
    public get size(): number {
        return this.items.length;
    }

    /**
     * Clear semua items dari arena
     */
    public clear(): void {
        this.items = [];
    }
}

/**
 * Unique identifier untuk AST node dalam arena
 */
export type ASTNodeId = number;

/**
 * Data structure untuk single AST node
 */
export interface ASTNodeData {
    /** Type/kind dari AST node (e.g., 'PropertyDecl', 'MethodDecl') */
    readonly kind: string;

    /** Source location span untuk AST node */
    readonly span: FileSpan;

    /** IDs dari child nodes */
    readonly children: readonly ASTNodeId[];
}

/**
 * Arena allocator khusus untuk AST nodes
 * Provides type-safe storage dan retrieval untuk AST nodes by ID
 * 
 * @example
 * ```typescript
 * const arena = new ASTArena();
 * const childId = arena.allocateNode('Identifier', span, []);
 * const parentId = arena.allocateNode('PropertyDecl', span, [childId]);
 * 
 * const node = arena.getNode(parentId);
 * console.log(node.kind); // 'PropertyDecl'
 * console.log(node.children); // [childId]
 * ```
 */
export class ASTArena {
    private nodes: ASTNodeData[] = [];

    /**
     * Allocate new AST node dalam arena
     * 
     * @param kind - Type/kind dari node
     * @param span - Source location span
     * @param children - Array dari child node IDs
     * @returns Unique ID untuk node
     */
    public allocateNode(
        kind: string,
        span: FileSpan,
        children: readonly ASTNodeId[]
    ): ASTNodeId {
        const id = this.nodes.length;
        this.nodes.push({ kind, span, children });
        return id;
    }

    /**
     * Retrieve AST node data by ID
     * 
     * @param id - AST node ID
     * @returns Node data
     * @throws Error jika ID invalid
     */
    public getNode(id: ASTNodeId): ASTNodeData {
        const node = this.nodes[id];
        if (!node) {
            throw new Error(`Invalid ASTNodeId: ${id}`);
        }
        return node;
    }

    /**
     * Get total number of nodes dalam arena
     */
    public get size(): number {
        return this.nodes.length;
    }

    /**
     * Clear semua nodes dari arena
     */
    public clear(): void {
        this.nodes = [];
    }

    /**
     * Iterate over semua nodes dalam arena
     * 
     * @param callback - Function to call untuk setiap node
     */
    public forEach(callback: (node: ASTNodeData, id: ASTNodeId) => void): void {
        this.nodes.forEach((node, id) => callback(node, id));
    }
}
