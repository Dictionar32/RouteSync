/**
 * originModelSymbol.ts
 *
 * Origin boundary model symbol representation with O(1) indexed lookups.
 *
 * @module compiler/scanner/symbols/model
 */

import type { ParsedModel } from "../../../../types/domain/models";
import type { ParsedColumn } from "../../../../types/domain/databaseColumns";
import type { ParsedCast, ParsedAccessor, ParsedRelation } from "../../../../types/domain/eloquentTypes";
import { CollectionKind, ReadonlyCollectionType, ReferenceType } from "../../../types/SemanticType";
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

        for (const col of node.columns) {
            this.columnsByName.set(col.name, col);
        }

        for (const c of node.casts) {
            this.castsByName.set(c.column, c);
        }

        for (const rel of node.relations) {
            this.relationsByName.set(rel.name, rel);
        }

        for (const acc of node.accessors) {
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
        const column = this.column(prop);
        if (column) {
            return {
                kind: 'column',
                propertyName: prop,
                source: column,
                semanticType: column.semanticType
            };
        }

        const accessor = this.accessor(prop);
        if (accessor) {
            return {
                kind: 'accessor',
                propertyName: prop,
                source: accessor,
                semanticType: accessor.semanticType
            };
        }

        const relation = this.relation(prop);
        if (relation) {
            const reference = new ReferenceType('', relation.targetModel);
            const semanticType = relation.cardinality === 'many'
                ? new ReadonlyCollectionType(CollectionKind.ARRAY, reference)
                : reference;
            return {
                kind: 'relation',
                propertyName: prop,
                source: relation,
                semanticType
            };
        }

        return undefined;
    }
}
