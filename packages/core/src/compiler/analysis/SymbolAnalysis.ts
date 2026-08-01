/**
 * @file SymbolAnalysis.ts
 * @description Symbol database dan reference tracking
 */

/**
 * Symbol node dalam program symbol graph
 * 
 * Represents class, method, atau property declaration dengan:
 * - Unique identifier
 * - Symbol kind (class/method/property)
 * - Name dan namespace
 * - Hierarchical relationships (parent, extends, implements)
 */
export interface SymbolNode {
    /** Unique symbol identifier */
    readonly id: string;

    /** Symbol kind */
    readonly kind: 'class' | 'method' | 'property';

    /** Symbol name */
    readonly name: string;

    /** Namespace atau package name */
    readonly namespace: string;

    /** Parent symbol ID (untuk nested symbols) */
    readonly parentId?: string;

    /** Extended class symbol ID */
    readonly extendsId?: string;

    /** Implemented interface symbol IDs */
    readonly implementsIds: readonly string[];
}

/**
 * Symbol database dengan reference tracking
 * 
 * Maintains:
 * - Symbol registry (ID -> SymbolNode)
 * - Reference graph (from symbol -> to symbols)
 * 
 * Used untuk:
 * - Cross-reference analysis
 * - Dependency tracking
 * - Symbol lookup
 * - Unused code detection
 * 
 * @example
 * ```typescript
 * const db = new SymbolDatabase();
 * 
 * // Register symbols
 * db.registerSymbol({
 *   id: 'UserClass',
 *   kind: 'class',
 *   name: 'User',
 *   namespace: 'App\\Models',
 *   implementsIds: ['Authenticatable']
 * });
 * 
 * // Add reference
 * db.addReference('UserController', 'UserClass');
 * 
 * // Query
 * const symbol = db.getSymbol('UserClass');
 * const refs = db.getReferences('UserController');
 * ```
 */
export class SymbolDatabase {
    /** Map dari symbol ID ke symbol node */
    private symbols = new Map<string, SymbolNode>();

    /** Reference graph: from symbol ID -> set of referenced symbol IDs */
    private referenceGraph = new Map<string, Set<string>>();

    /**
     * Register symbol dalam database
     * 
     * @param node - Symbol node to register
     */
    public registerSymbol(node: SymbolNode): void {
        this.symbols.set(node.id, node);
    }

    /**
     * Add reference dari one symbol ke another
     * 
     * @param fromId - Source symbol ID
     * @param toId - Target symbol ID
     */
    public addReference(fromId: string, toId: string): void {
        const refs = this.referenceGraph.get(fromId) ?? new Set();
        refs.add(toId);
        this.referenceGraph.set(fromId, refs);
    }

    /**
     * Get symbol by ID
     * 
     * @param id - Symbol ID
     * @returns Symbol node atau undefined jika tidak found
     */
    public getSymbol(id: string): SymbolNode | undefined {
        return this.symbols.get(id);
    }

    /**
     * Get all symbols referenced oleh given symbol
     * 
     * @param fromId - Source symbol ID
     * @returns Set of referenced symbol IDs
     */
    public getReferences(fromId: string): ReadonlySet<string> {
        return this.referenceGraph.get(fromId) ?? new Set();
    }

    /**
     * Find all symbols referencing given symbol
     * 
     * @param symbolId - Target symbol ID
     * @returns Set of symbol IDs yang reference target
     */
    public findReferencingSymbols(symbolId: string): ReadonlySet<string> {
        const referencers = new Set<string>();

        for (const [fromId, refs] of this.referenceGraph) {
            if (refs.has(symbolId)) {
                referencers.add(fromId);
            }
        }

        return referencers;
    }

    /**
     * Get symbols by kind
     * 
     * @param kind - Symbol kind to filter
     * @returns Array of symbols with given kind
     */
    public getSymbolsByKind(kind: SymbolNode['kind']): readonly SymbolNode[] {
        return Array.from(this.symbols.values()).filter(s => s.kind === kind);
    }

    /**
     * Get symbols dalam namespace
     * 
     * @param namespace - Namespace to filter
     * @returns Array of symbols dalam namespace
     */
    public getSymbolsInNamespace(namespace: string): readonly SymbolNode[] {
        return Array.from(this.symbols.values()).filter(s => s.namespace === namespace);
    }

    /**
     * Get child symbols dari parent
     * 
     * @param parentId - Parent symbol ID
     * @returns Array of child symbols
     */
    public getChildren(parentId: string): readonly SymbolNode[] {
        return Array.from(this.symbols.values()).filter(s => s.parentId === parentId);
    }

    /**
     * Get class hierarchy (extends chain)
     * 
     * @param classId - Class symbol ID
     * @returns Array of symbol IDs dalam inheritance chain
     */
    public getClassHierarchy(classId: string): readonly string[] {
        const hierarchy: string[] = [classId];
        let current = this.getSymbol(classId);

        while (current?.extendsId) {
            hierarchy.push(current.extendsId);
            current = this.getSymbol(current.extendsId);

            // Prevent infinite loop
            if (hierarchy.length > 100) break;
        }

        return hierarchy;
    }

    /**
     * Check apakah symbol is unused
     * 
     * @param symbolId - Symbol ID to check
     * @returns True jika symbol tidak referenced oleh symbol lain
     */
    public isUnused(symbolId: string): boolean {
        const referencers = this.findReferencingSymbols(symbolId);
        return referencers.size === 0;
    }

    /**
     * Clear database
     */
    public clear(): void {
        this.symbols.clear();
        this.referenceGraph.clear();
    }

    /**
     * Get statistics
     */
    public getStats(): {
        totalSymbols: number;
        classes: number;
        methods: number;
        properties: number;
        totalReferences: number;
    } {
        const symbols = Array.from(this.symbols.values());
        let totalRefs = 0;

        for (const refs of this.referenceGraph.values()) {
            totalRefs += refs.size;
        }

        return {
            totalSymbols: symbols.length,
            classes: symbols.filter(s => s.kind === 'class').length,
            methods: symbols.filter(s => s.kind === 'method').length,
            properties: symbols.filter(s => s.kind === 'property').length,
            totalReferences: totalRefs
        };
    }
}
