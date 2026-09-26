import type { ModelNode } from './modelNodes';
import type { ModelColumnFact } from '../types/upstream/modelSourceFacts';
import type { ModelSemanticAccessor, ModelSemanticRelation } from '../types/upstream/model';
import type { Lookup } from '../types/upstream/collections';

export class ModelSymbol {
    readonly name: string;
    private readonly columnFactsByName = new Map<string, ModelColumnFact>();
    private readonly relationsByName = new Map<string, ModelSemanticRelation>();
    private readonly accessorsByName = new Map<string, ModelSemanticAccessor>();

    constructor(public readonly node: ModelNode) {
        this.name = node.definition.semantic.identity.name.value.value;
        for (const fact of node.definition.semantic.columnFacts) this.columnFactsByName.set(fact.column.value.value, fact);
        for (const property of node.definition.semantic.surface.properties) {
            if (property.kind === 'relation') this.relationsByName.set(property.relation.value.value, property);
            if (property.kind === 'accessor') this.accessorsByName.set(property.property.value.value, property);
        }
    }

    columnFact(name: string): Lookup<ModelColumnFact> {
        const value = this.columnFactsByName.get(name);
        return value === undefined ? { kind: 'missing' } : { kind: 'found', value };
    }

    accessor(name: string): Lookup<ModelSemanticAccessor> {
        const value = this.accessorsByName.get(name);
        return value === undefined ? { kind: 'missing' } : { kind: 'found', value };
    }

    relation(name: string): Lookup<ModelSemanticRelation> {
        const value = this.relationsByName.get(name);
        return value === undefined ? { kind: 'missing' } : { kind: 'found', value };
    }

}

export class SymbolTable {
    private readonly byName = new Map<string, ModelSymbol>();
    private readonly byLowerName = new Map<string, ModelSymbol>();

    constructor(models: readonly ModelNode[]) {
        for (const model of models) {
            const symbol = new ModelSymbol(model);
            const name = model.definition.semantic.identity.name.value.value;
            this.byName.set(name, symbol);
            const lower = name.toLowerCase();
            if (!this.byLowerName.has(lower)) this.byLowerName.set(lower, symbol);
        }
    }

    lookup(name: string): Lookup<ModelSymbol> {
        const value = this.byName.get(name);
        return value === undefined ? { kind: 'missing' } : { kind: 'found', value };
    }

    lookupCaseInsensitive(name: string): Lookup<ModelSymbol> {
        const value = this.byLowerName.get(name.toLowerCase());
        return value === undefined ? { kind: 'missing' } : { kind: 'found', value };
    }
    findFirst(predicate: (node: ModelNode) => boolean): ModelSymbol | undefined {
        for (const symbol of this.byName.values()) if (predicate(symbol.node)) return symbol;
        return undefined;
    }
}
