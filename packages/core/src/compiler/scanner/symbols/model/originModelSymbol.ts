/**
 * originModelSymbol.ts
 *
 * Origin boundary model symbol representation with O(1) indexed lookups.
 *
 * @module compiler/scanner/symbols/model
 */

import type { ParsedModel } from "../../../../types/domain/models";
import type { ParsedColumn } from "../../../../types/domain/databaseColumns";
import { DatabaseColumnTypeMapper } from "../../../../types/domain/databaseColumns";
import type {
    ParsedCast,
    ParsedAccessor,
    ParsedRelation,
    EloquentCastKind
} from "../../../../types/domain/eloquentTypes";
import { ELOQUENT_CAST_REGISTRY } from "../../../../types/domain/eloquentTypes";
import type { ResolvedPropertyBinding } from "./types";

export class OriginModelSymbol {
    public readonly name: string;
    public readonly shortName: string;
    public readonly node: ParsedModel;
    private readonly columnsByName = new Map<string, ParsedColumn>();
    private readonly castsByName = new Map<string, ParsedCast>();
    private readonly relationsByName = new Map<string, ParsedRelation>();
    private readonly accessorsByName = new Map<string, ParsedAccessor>();

    constructor(node: ParsedModel) {
        this.node = node;
        this.name = node.name;
        this.shortName = node.shortName || (node.name.includes('\\') ? node.name.split('\\').pop()! : node.name);

        for (const col of node.columns || []) {
            this.columnsByName.set(col.name, col);
        }

        for (const c of node.casts || []) {
            this.castsByName.set(c.column, c);
        }

        for (const rel of node.relations || []) {
            this.relationsByName.set(rel.name, rel);
        }

        for (const acc of node.accessors || []) {
            this.accessorsByName.set(acc.name, acc);
            // Index camelCase and snake_case variations
            const camel = acc.name.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase());
            if (camel !== acc.name) {
                this.accessorsByName.set(camel, acc);
            }
        }
        Object.freeze(this);
    }

    public column(name: string): ParsedColumn | undefined {
        return this.columnsByName.get(name);
    }

    public cast(columnName: string): ParsedCast | undefined {
        return this.castsByName.get(columnName);
    }

    public relation(name: string): ParsedRelation | undefined {
        return this.relationsByName.get(name);
    }

    public accessor(name: string): ParsedAccessor | undefined {
        return this.accessorsByName.get(name);
    }

    public resolveProperty(prop: string): ResolvedPropertyBinding | undefined {
        // 1. Column lookup
        const col = this.column(prop);
        if (col) {
            const cast = this.cast(prop);
            let tsType: string;
            if (cast && cast.targetType) {
                const castKind = cast.targetType.toLowerCase() as EloquentCastKind;
                const spec = ELOQUENT_CAST_REGISTRY[castKind];
                tsType = spec ? spec.tsType : (cast.targetType.includes('int') ? 'number' : 'string');
            } else if (col.semanticType) {
                tsType = col.semanticType;
            } else {
                const prim = DatabaseColumnTypeMapper.toPrimitiveKind(col.type);
                tsType = prim === 'number' ? 'number' : prim === 'boolean' ? 'boolean' : 'string';
            }

            return {
                kind: 'column',
                propertyName: prop,
                type: tsType,
                nullable: col.nullable,
                cast: cast?.targetType
            };
        }

        // 2. Accessor lookup
        const acc = this.accessor(prop);
        if (acc) {
            return {
                kind: 'accessor',
                propertyName: prop,
                type: acc.type || 'string',
                nullable: acc.nullable ?? false
            };
        }

        // 3. Relation lookup
        const rel = this.relation(prop);
        if (rel) {
            return {
                kind: 'relation',
                propertyName: prop,
                type: rel.targetModel,
                nullable: false,
                targetModel: rel.targetModel,
                isCollection: rel.isCollection
            };
        }

        return undefined;
    }
}
