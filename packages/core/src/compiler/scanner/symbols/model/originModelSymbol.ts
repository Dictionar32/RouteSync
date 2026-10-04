/** Relation-backed origin model symbol. */
import type { ModelAst } from '../../../../types/upstream/ast';
import type { ModelSemanticProperty, ModelSemanticRelation } from '../../../../types/upstream/model';
import type { ModelName, PropertyName, RelationName } from '../../../../types/upstream/names';
import type { ResolvedPropertyBinding } from './types';
import type { Lookup } from '../../../../types/upstream/collections';
import { typeExpressionToSemanticType } from '../../../domain/common/typeExpressionSemanticType';
import {
    relationFirstOption,
    relationOptionFold,
    relationSequenceToArray,
    relationVariantFold,
    type RelationOption,
} from '../../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';

export interface OriginModelSymbol {
    readonly name: ModelName;
    readonly shortName: ModelName;
    readonly node: ModelAst;
    readonly property: (name: PropertyName) => Lookup<ModelSemanticProperty>;
    readonly column: (name: PropertyName) => Lookup<ModelSemanticProperty>;
    readonly relation: (name: RelationName) => Lookup<ModelSemanticRelation>;
    readonly resolveProperty: (prop: PropertyName) => Lookup<ResolvedPropertyBinding>;
}

const lookupFromOption = <T>(option: RelationOption<T>): Lookup<T> => relationOptionFold(
    option,
    () => ({ kind: 'missing' }),
    value => ({ kind: 'found', value }),
);

export const createOriginModelSymbol = (node: ModelAst): OriginModelSymbol => {
    const properties = relationSequenceToArray(node.definition.semanticProperties);
    const property = (name: PropertyName): Lookup<ModelSemanticProperty> => lookupFromOption(
        relationFirstOption(properties, item => relationEqual(item.property.value.value, name.value.value)),
    );
    const column = (name: PropertyName): Lookup<ModelSemanticProperty> => relationOptionFold(
        relationFirstOption(
            properties,
            (item): item is Extract<ModelSemanticProperty, { readonly kind: 'column' }> =>
                relationEqual(item.kind, 'column') && relationEqual(item.property.value.value, name.value.value),
        ),
        () => ({ kind: 'missing' }),
        value => ({ kind: 'found', value }),
    );
    const relation = (name: RelationName): Lookup<ModelSemanticRelation> => relationOptionFold(
        relationFirstOption(
            properties,
            (item): item is ModelSemanticRelation =>
                relationEqual(item.kind, 'relation') && relationEqual(item.property.value.value, name.value.value),
        ),
        () => ({ kind: 'missing' }),
        value => ({ kind: 'found', value }),
    );
    const resolveProperty = (prop: PropertyName): Lookup<ResolvedPropertyBinding> => relationOptionFold(
        relationFirstOption(properties, item => relationEqual(item.property.value.value, prop.value.value)),
        () => ({ kind: 'missing' }),
        value => relationVariantFold<ModelSemanticProperty, 'column', Lookup<ResolvedPropertyBinding>>(
            value,
            'column',
            rest => relationVariantFold<Exclude<ModelSemanticProperty, { readonly kind: 'column' }>, 'accessor', Lookup<ResolvedPropertyBinding>>(
                rest,
                'accessor',
                relation => ({ kind: 'found', value: {
                    kind: 'relation',
                    propertyName: relation.property,
                    source: relation,
                    semanticType: typeExpressionToSemanticType(relation.semanticType),
                } }),
                accessor => ({ kind: 'found', value: {
                    kind: 'accessor',
                    propertyName: accessor.property,
                    source: accessor,
                    semanticType: typeExpressionToSemanticType(accessor.traversal.semanticType),
                } }),
            ),
            column => ({ kind: 'found', value: {
                kind: 'column',
                propertyName: column.property,
                source: column,
                semanticType: typeExpressionToSemanticType(column.semanticType),
            } }),
        ),
    );
    return Object.freeze({ name: node.definition.identity.name, shortName: node.definition.identity.shortName, node, property, column, relation, resolveProperty });
};
