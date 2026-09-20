/**
 * modelSymbolTableClass.ts
 *
 * ModelSymbolTable implementation.
 *
 * @module compiler/scanner/symbols/model
 */

import type { ParsedModel } from "../../../../types/domain/models";
import { OriginModelSymbol } from "./originModelSymbol";
import { ResourceNamingConvention } from "../../../../utils/resource-naming";
import type { Lookup } from "../../../../types/upstream/collections";
import type { ModelName, TableName } from "../../../../types/upstream/names";

export class ModelSymbolTable {
    private readonly byName = new Map<string, OriginModelSymbol>();
    private readonly byShortName = new Map<string, OriginModelSymbol>();
    private readonly byLower = new Map<string, OriginModelSymbol>();
    private readonly byTableName = new Map<string, OriginModelSymbol>();
    private readonly modelList: readonly OriginModelSymbol[];

    constructor(models: readonly ParsedModel[] = []) {
        const list: OriginModelSymbol[] = [];
        for (const m of models) {
            const sym = new OriginModelSymbol(m);
            list.push(sym);
            this.byName.set(sym.name.value.value, sym);
            this.byShortName.set(sym.shortName.value.value, sym);
            this.byLower.set(sym.name.value.value.toLowerCase(), sym);
            this.byLower.set(sym.shortName.value.value.toLowerCase(), sym);
            this.byTableName.set(m.semantic.identity.table.value.value.toLowerCase(), sym);
        }
        this.modelList = Object.freeze(list);
        Object.freeze(this);
    }

    public get(name: ModelName | string): Lookup<OriginModelSymbol> {
        const text = typeof name === "string" ? name : name.value.value;
        const exact = this.byName.get(text);
        if (exact !== undefined) return { kind: 'found', value: exact };
        const short = this.byShortName.get(text);
        if (short !== undefined) return { kind: 'found', value: short };
        const lower = this.byLower.get(text.toLowerCase());
        if (lower !== undefined) return { kind: 'found', value: lower };
        return { kind: 'missing' };
    }

    public findByTableName(tableName: TableName | string): Lookup<OriginModelSymbol> {
        const text = typeof tableName === "string" ? tableName : tableName.value.value;
        const value = this.byTableName.get(text.toLowerCase());
        if (value !== undefined) return { kind: 'found', value };
        return { kind: 'missing' };
    }

    public has(name: string): boolean {
        return this.get(name).kind === 'found';
    }

    public all(): readonly OriginModelSymbol[] {
        return this.modelList;
    }

    public models(): readonly ParsedModel[] {
        return this.modelList.map(s => s.node);
    }

    public findForResource(resourceName: string): Lookup<OriginModelSymbol> {
        const stripped = ResourceNamingConvention.stripSuffix(resourceName);
        const primary = this.get(stripped);
        if (primary.kind === 'found') return primary;
        return this.get(resourceName);
    }
}
