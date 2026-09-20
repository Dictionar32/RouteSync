/**
 * Origin boundary model symbol representation.
 * The canonical property surface is indexed once and consumed downstream.
 */

import type { ParsedModel, ModelSemanticProperty } from "../../../../types/domain/models";
import type { ModelName } from "../../../../types/domain/semanticValues";
import type { ResolvedPropertyBinding } from "./types";
import type { Lookup } from "../../../../types/upstream/collections";

export class OriginModelSymbol {
    public readonly name: ModelName;
    public readonly shortName: ModelName;
    public readonly node: ParsedModel;
    private readonly propertiesByName = new Map<string, ModelSemanticProperty>();

    constructor(node: ParsedModel) {
        this.node = node;
        this.name = node.semantic.identity.name;
        this.shortName = node.semantic.identity.shortName;
        for (const property of node.semantic.surface.properties) {
            this.propertiesByName.set(property.property.value, property);
        }
        Object.freeze(this);
    }

    public property(name: string): ModelSemanticProperty | undefined {
        return this.propertiesByName.get(name);
    }

    public resolveProperty(prop: string): Lookup<ResolvedPropertyBinding> {
        const property = this.property(prop);
        if (property === undefined) return { kind: 'missing' };
        switch (property.kind) {
            case 'column':
                return { kind: 'found', value: { kind: 'column', propertyName: property.property.value, source: property, semanticType: property.semanticType } };
            case 'accessor':
                return { kind: 'found', value: { kind: 'accessor', propertyName: property.property.value, source: property, semanticType: property.semanticType } };
            case 'relation':
                return { kind: 'found', value: { kind: 'relation', propertyName: property.property.value, source: property, semanticType: property.semanticType } };
        }
    }
}
