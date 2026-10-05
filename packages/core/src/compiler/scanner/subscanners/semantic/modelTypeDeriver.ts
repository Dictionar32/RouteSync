/**
 * Canonical model semantic-type lowering.
 *
 * ModelSemanticProperty is the authority at this stage. The upstream
 * legacy property descriptor is deliberately not consulted: the scanner
 * has already established the closed semantic property judgment.
 */

import { ObjectType, ScannedObjectProperty, type ObjectProperty, type SemanticType } from '../../../types/SemanticType';
import { toPascalCase } from '../../../../utils/resource-naming';
import type { SemanticDerivationContext } from './SemanticDerivationContext';
import { relationEqual, relationFold, relationGate, relationProject, relationSequenceToArray } from '../../../../semantic/foundation/relationalSequence';
import { relationContains, relationInsert, type RelationMembership } from '../../../../semantic/foundation/relationMembership';
import { typeExpressionToSemanticType } from '../../../domain/common/typeExpressionSemanticType';
import type { ModelSemanticProperty } from '../../../../types/upstream/model';

type ModelName = SemanticDerivationContext['models'][number]['definition']['identity']['name'];

type ModelTypeDerivationState = Readonly<{
    readonly types: readonly ObjectType[];
    readonly seenNames: RelationMembership<string>;
}>;

const semanticPropertyType = (property: ModelSemanticProperty): SemanticType =>
    typeExpressionToSemanticType(property.traversal.semanticType);

const semanticPropertyOrigin = (property: ModelSemanticProperty, model: ModelName): ObjectProperty['origin'] =>
    relationGate(
        relationEqual(property.kind, 'column'),
        () => ({ kind: 'model_column' as const, model, property: property.property }),
        () => relationGate(
            relationEqual(property.kind, 'accessor'),
            () => ({ kind: 'model_accessor' as const, model, property: property.property }),
            () => ({ kind: 'model_relation' as const, model, property: property.property }),
        ),
    );

const deriveProperty = (property: ModelSemanticProperty, model: ModelName): ObjectProperty =>
    ScannedObjectProperty.create({
        name: property.property,
        type: semanticPropertyType(property),
        description: '',
        origin: semanticPropertyOrigin(property, model),
    });

const emptyState = (seenNames: RelationMembership<string>): ModelTypeDerivationState =>
    Object.freeze({ types: Object.freeze([]), seenNames });

const deriveModel = (
    state: ModelTypeDerivationState,
    model: SemanticDerivationContext['models'][number],
    context: SemanticDerivationContext,
): ModelTypeDerivationState => {
    const modelTypeName = `${toPascalCase(model.definition.identity.name.value.value)}Transformed`;
    const modelBaseName = toPascalCase(model.definition.identity.name.value.value);
    const modelName = model.definition.identity.name;
    return relationGate(
        relationEqual(relationContains(state.seenNames, modelTypeName), false),
        () => {
            const semanticProperties = relationSequenceToArray(model.definition.semanticProperties);
            const properties = relationProject(semanticProperties, property => deriveProperty(property, modelName));
            const semanticType = ObjectType({
                name: modelTypeName,
                baseName: modelBaseName,
                properties,
                role: 'model',
            });
            const nextTypes = Object.freeze([
                ...state.types,
                context.interner.intern(semanticType) as ObjectType,
            ]);
            return Object.freeze({
                types: nextTypes,
                seenNames: relationInsert(state.seenNames, modelTypeName),
            });
        },
        () => state,
    );
};

export function deriveModelTypes(
    context: SemanticDerivationContext,
    seenNames: RelationMembership<string>,
): readonly ObjectType[] {
    const state = relationFold(
        context.models,
        emptyState(seenNames),
        (current, model) => deriveModel(current, model, context),
    );
    return state.types;
}
