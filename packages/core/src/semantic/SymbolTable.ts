import type { ModelNode } from './modelNodes';
import type { ParsedColumn } from '../types/domain/databaseColumns';
import type { ParsedCast, ParsedAccessor, ParsedRelation } from '../types/domain/eloquentTypes';

export class ModelSymbol {
    readonly name: string;
    private readonly columnsByName = new Map<string, ParsedColumn>();
    private readonly castsByName = new Map<string, ParsedCast>();
    private readonly relationsByName = new Map<string, ParsedRelation>();
    private readonly accessorsByName = new Map<string, ParsedAccessor>();

    constructor(public readonly node: ModelNode) {
        this.name = node.name.value;
        for (const column of node.columns) this.columnsByName.set(column.name, column);
        for (const cast of node.casts) this.castsByName.set(cast.column.value, cast);
        for (const relation of node.relations) this.relationsByName.set(relation.name.value, relation);
        for (const accessor of node.accessors) this.accessorsByName.set(accessor.name.value, accessor);
    }

    column(name: string): ParsedColumn | undefined { return this.columnsByName.get(name); }
    accessor(name: string): ParsedAccessor | undefined { return this.accessorsByName.get(name); }
    relation(name: string): ParsedRelation | undefined { return this.relationsByName.get(name); }
    cast(columnName: string): ParsedCast | undefined { return this.castsByName.get(columnName); }
}

export class SymbolTable {
    private readonly byName = new Map<string, ModelSymbol>();
    private readonly byLowerName = new Map<string, ModelSymbol>();

    constructor(models: readonly ModelNode[]) {
        for (const model of models) {
            const symbol = new ModelSymbol(model);
            const name = model.name.value;
            this.byName.set(name, symbol);
            const lower = name.toLowerCase();
            if (!this.byLowerName.has(lower)) this.byLowerName.set(lower, symbol);
        }
    }

    get(name: string): ModelSymbol | undefined { return this.byName.get(name); }
    has(name: string): boolean { return this.byName.has(name); }
    getCaseInsensitive(name: string): ModelSymbol | undefined { return this.byLowerName.get(name.toLowerCase()); }
    findFirst(predicate: (node: ModelNode) => boolean): ModelSymbol | undefined {
        for (const symbol of this.byName.values()) if (predicate(symbol.node)) return symbol;
        return undefined;
    }
}
