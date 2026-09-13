/**
 * @file SymbolAnalysis.ts
 * @description Symbol database and reference tracking orchestrator.
 * Active Consumer delegating to focused symbol sub-domain components.
 *
 * @module compiler/analysis/SymbolAnalysis
 */

import {
    type SymbolNode,
    type SymbolStats,
    SymbolReferenceGraph,
    resolveClassHierarchy,
    filterSymbolsByKind,
    filterSymbolsByNamespace,
    filterSymbolsByParent
} from './symbol';

export { type SymbolNode, type SymbolStats };

export class SymbolDatabase {
    private readonly symbols = new Map<string, SymbolNode>();
    private readonly referenceGraph = new SymbolReferenceGraph();

    public registerSymbol(node: SymbolNode): void {
        this.symbols.set(node.id, node);
    }

    public addReference(fromId: string, toId: string): void {
        this.referenceGraph.addReference(fromId, toId);
    }

    public getSymbol(id: string): SymbolNode | undefined {
        return this.symbols.get(id);
    }

    public getReferences(fromId: string): ReadonlySet<string> {
        return this.referenceGraph.getReferences(fromId);
    }

    public findReferencingSymbols(symbolId: string): ReadonlySet<string> {
        return this.referenceGraph.findReferencingSymbols(symbolId);
    }

    public getSymbolsByKind(kind: SymbolNode['kind']): readonly SymbolNode[] {
        return filterSymbolsByKind(this.symbols.values(), kind);
    }

    public getSymbolsInNamespace(namespace: string): readonly SymbolNode[] {
        return filterSymbolsByNamespace(this.symbols.values(), namespace);
    }

    public getChildren(parentId: string): readonly SymbolNode[] {
        return filterSymbolsByParent(this.symbols.values(), parentId);
    }

    public getClassHierarchy(classId: string): readonly string[] {
        return resolveClassHierarchy(classId, id => this.getSymbol(id));
    }

    public isUnused(symbolId: string): boolean {
        return this.referenceGraph.isUnused(symbolId);
    }

    public clear(): void {
        this.symbols.clear();
        this.referenceGraph.clear();
    }

    public getStats(): SymbolStats {
        const symbols = Array.from(this.symbols.values());
        return {
            totalSymbols: symbols.length,
            classes: symbols.filter(s => s.kind === 'class').length,
            methods: symbols.filter(s => s.kind === 'method').length,
            properties: symbols.filter(s => s.kind === 'property').length,
            totalReferences: this.referenceGraph.countTotalReferences()
        };
    }
}
