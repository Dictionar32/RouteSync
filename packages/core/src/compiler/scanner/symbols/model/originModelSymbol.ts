/**
 * Origin boundary model symbol representation.
 * The canonical property surface is indexed once and consumed downstream.
 */

import type { ModelAst } from "../../../../types/upstream/ast";
import type { ModelSemanticProperty, ModelSemanticRelation } from "../../../../types/upstream/model";
import type { ModelName } from "../../../../types/upstream/names";
import type { ResolvedPropertyBinding } from "./types";
import type { Lookup } from "../../../../types/upstream/collections";
import type { PropertyName, RelationName } from "../../../../types/upstream/names";

export class OriginModelSymbol {
    public readonly name: ModelName;
    public readonly shortName: ModelName;
    public readonly node: ModelAst;
    private readonly propertiesByName = new Map<string, ModelSemanticProperty>();

    constructor(node: ModelAst) {
        this.node = node;
        this.name = node.definition.identity.name;
        this.shortName = node.definition.identity.shortName;
        for (const property of node.definition.semanticProperties) {
            this.propertiesByName.set(property.property.value.value, property);
        }
        Object.freeze(this);
    }

    public property(name: PropertyName): ModelSemanticProperty | undefined {
        return this.propertiesByName.get(name.value.value);
    }


    public column(name: PropertyName): Lookup<ModelSemanticProperty> {
        const property = this.property(name);
        if (property === undefined) return { kind: 'missing' };
        return property.origin.kind === 'column'
            ? { kind: 'found', value: property }
            : { kind: 'missing' };
    }

    public relation(name: RelationName): Lookup<ModelSemanticRelation> {
        const property = this.propertiesByName.get(name.value.value);
        if (property === undefined || property.kind !== 'relation') return { kind: 'missing' };
        return { kind: 'found', value: property };
    }

    public resolveProperty(prop: PropertyName): Lookup<ResolvedPropertyBinding> {
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
