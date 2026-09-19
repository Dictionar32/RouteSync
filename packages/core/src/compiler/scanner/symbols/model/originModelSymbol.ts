/**
 * Origin boundary model symbol representation.
 * The canonical property surface is indexed once and consumed downstream.
 */

import type { ParsedModel, ModelSemanticProperty } from "../../../../types/domain/models";
import type { ResolvedPropertyBinding } from "./types";

export class OriginModelSymbol {
    public readonly name: string;
    public readonly shortName: string;
    public readonly node: ParsedModel;
    private readonly propertiesByName = new Map<string, ModelSemanticProperty>();

    constructor(node: ParsedModel) {
        this.node = node;
        this.name = node.name.value;
        this.shortName = node.shortName.value;
        for (const property of node.semantic.surface.properties) {
            this.propertiesByName.set(property.property.value, property);
        }
        Object.freeze(this);
    }

    public property(name: string): ModelSemanticProperty | undefined {
        return this.propertiesByName.get(name);
    }

    public resolveProperty(prop: string): ResolvedPropertyBinding | undefined {
        const property = this.property(prop);
        if (property === undefined) return undefined;
        switch (property.kind) {
            case 'column':
                return { kind: 'column', propertyName: property.property.value, source: property, semanticType: property.type };
            case 'accessor':
                return { kind: 'accessor', propertyName: property.property.value, source: property, semanticType: property.type };
            case 'relation':
                return { kind: 'relation', propertyName: property.property.value, source: property, semanticType: property.type };
        }
    }
}
