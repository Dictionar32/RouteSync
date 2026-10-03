/** Relation-backed origin model symbol. */
import type { ModelAst } from '../../../../types/upstream/ast';
import type { ModelSemanticProperty, ModelSemanticRelation } from '../../../../types/upstream/model';
import type { ModelName, PropertyName, RelationName } from '../../../../types/upstream/names';
import type { ResolvedPropertyBinding } from './types';
import type { Lookup } from '../../../../types/upstream/collections';
import { relationFirst, relationOptionFold, relationProject } from '../../../../semantic/kernel/relationalSequence';
import { relationAll, relationEqual, relationGate } from '../../../../semantic/kernel/semanticRelations';

export interface OriginModelSymbol {
    readonly name: ModelName;
    readonly shortName: ModelName;
    readonly node: ModelAst;
    readonly property: (name: PropertyName) => Lookup<ModelSemanticProperty>;
    readonly column: (name: PropertyName) => Lookup<ModelSemanticProperty>;
    readonly relation: (name: RelationName) => Lookup<ModelSemanticRelation>;
    readonly resolveProperty: (prop: PropertyName) => Lookup<ResolvedPropertyBinding>;
}

export const createOriginModelSymbol = (node: ModelAst): OriginModelSymbol => {
    const properties = Object.freeze(relationProject(node.definition.semanticProperties, property => property));
    const property = (name: PropertyName): Lookup<ModelSemanticProperty> => relationOptionFold(
        relationFirst(properties, item => relationEqual(item.property.value.value, name.value.value)),
        () => ({ kind: 'missing' }),
        value => ({ kind: 'found', value }),
    );
    const column = (name: PropertyName): Lookup<ModelSemanticProperty> => relationOptionFold(
        relationOptionFold(property(name), () => ({ kind: 'none' as const }), value => relationGate(relationEqual(value.origin.kind, 'column'), () => ({ kind: 'some' as const, value }), () => ({ kind: 'none' as const }))),
        () => ({ kind: 'missing' }),
        value => ({ kind: 'found', value }),
    );
    const relation = (name: RelationName): Lookup<ModelSemanticRelation> => relationOptionFold(
        relationFirst(properties, item => relationAll([relationEqual(item.property.value.value, name.value.value), relationEqual(item.kind, 'relation')])),
        () => ({ kind: 'missing' }),
        value => ({ kind: 'found', value: value as ModelSemanticRelation }),
    );
    const resolveProperty = (prop: PropertyName): Lookup<ResolvedPropertyBinding> => relationOptionFold(
        property(prop),
        () => ({ kind: 'missing' }),
        value => ({ kind: 'found', value: {
            kind: value.kind,
            propertyName: value.property.value,
            source: value,
            semanticType: value.semanticType,
        } as ResolvedPropertyBinding }),
    );
    return Object.freeze({ name: node.definition.identity.name, shortName: node.definition.identity.shortName, node, property, column, relation, resolveProperty });
};
