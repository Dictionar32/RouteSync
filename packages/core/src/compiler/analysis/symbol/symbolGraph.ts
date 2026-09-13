/**
 * symbolGraph.ts
 *
 * Reference tracking and dependency graph between program symbols.
 *
 * @module compiler/analysis/symbol
 */

export class SymbolReferenceGraph {
    private readonly referenceGraph = new Map<string, Set<string>>();

    public addReference(fromId: string, toId: string): void {
        const refs = this.referenceGraph.get(fromId) ?? new Set();
        refs.add(toId);
        this.referenceGraph.set(fromId, refs);
    }

    public getReferences(fromId: string): ReadonlySet<string> {
        return this.referenceGraph.get(fromId) ?? new Set();
    }

    public findReferencingSymbols(symbolId: string): ReadonlySet<string> {
        const referencers = new Set<string>();
        for (const [fromId, refs] of this.referenceGraph) {
            if (refs.has(symbolId)) {
                referencers.add(fromId);
            }
        }
        return referencers;
    }

    public isUnused(symbolId: string): boolean {
        return this.findReferencingSymbols(symbolId).size === 0;
    }

    public clear(): void {
        this.referenceGraph.clear();
    }

    public countTotalReferences(): number {
        let total = 0;
        for (const refs of this.referenceGraph.values()) {
            total += refs.size;
        }
        return total;
    }
}
