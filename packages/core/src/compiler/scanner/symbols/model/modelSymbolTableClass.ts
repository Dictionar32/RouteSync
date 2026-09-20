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
            this.byName.set(sym.name, sym);
            this.byShortName.set(sym.shortName, sym);
            this.byLower.set(sym.name.toLowerCase(), sym);
            this.byLower.set(sym.shortName.toLowerCase(), sym);
            this.byTableName.set(m.semantic.identity.table.value.toLowerCase(), sym);
        }
        this.modelList = Object.freeze(list);
        Object.freeze(this);
    }

    public get(name: string): OriginModelSymbol | undefined {
        return this.byName.get(name) || this.byShortName.get(name) || this.byLower.get(name.toLowerCase());
    }

    public findByTableName(tableName: string): OriginModelSymbol | undefined {
        return this.byTableName.get(tableName.toLowerCase());
    }

    public has(name: string): boolean {
        return !!this.get(name);
    }

    public all(): readonly OriginModelSymbol[] {
        return this.modelList;
    }

    public models(): readonly ParsedModel[] {
        return this.modelList.map(s => s.node);
    }

    public findForResource(resourceName: string): OriginModelSymbol | undefined {
        const stripped = ResourceNamingConvention.stripSuffix(resourceName);
        return this.get(stripped) || this.get(resourceName);
    }
}
