/**
 * modelTypeDeriver.ts
 *
 * Derives canonical ObjectType instances for scanned Eloquent Models.
 *
 * @module core/compiler/scanner/subscanners/semantic
 */

import {
    ObjectType,
    type ObjectProperty,
    ScannedObjectProperty
} from '../../../types/SemanticType';
import {
    toPascalCase
} from '../../../../utils/resource-naming';
import type { SemanticDerivationContext } from './SemanticDerivationContext';
import {
    relationEqual,
    relationFold,
    relationGate,
    relationProject
} from '../../../../semantic/kernel/relationalSequence';
import { relationContains, relationInsert, type RelationMembership } from '../../../../semantic/kernel/relationMembership';

function sequenceToArray<T>(items: import('../../../../types/upstream/collections').Sequence<T>): T[] {
    const collect = (current: import('../../../../types/upstream/collections').Sequence<T>, result: T[]): T[] =>
        relationGate(
            relationEqual(current.kind, 'cons'),
            () => collect(current.tail, [...result, current.head]),
            () => result
        );
    return collect(items, []);
}

export function deriveModelTypes(
    context: SemanticDerivationContext,
    seenNames: RelationMembership<string>
): readonly ObjectType[] {
    const interner = context.interner;
    return relationFold(
        context.models,
        Object.freeze([]) as readonly ObjectType[],
        (types, model) => {
            const modelTypeName = `${toPascalCase(model.definition.identity.name.value.value)}Transformed`;
            const modelBaseName = toPascalCase(model.definition.identity.name.value.value);
            return relationGate(
                relationEqual(relationContains(seenNames, modelTypeName), false),
                () => {
                    seenNames = relationInsert(seenNames, modelTypeName);
                    const sourceProperties = sequenceToArray(model.definition.surface.properties.items);
                    const properties = relationProject(
                        sourceProperties,
                        property => {
                            const origin = relationGate(
                                relationEqual(property.origin.kind, 'column'),
                                () => ({ kind: 'model_column' as const, model: model.definition.identity.name, property: property.name }),
                                () => relationGate(
                                    relationEqual(property.origin.kind, 'computed'),
                                    () => ({ kind: 'model_accessor' as const, model: model.definition.identity.name, property: property.name }),
                                    () => ({ kind: 'model_relation' as const, model: model.definition.identity.name, property: property.name })
                                )
                            );
                            return ScannedObjectProperty.create({
                                name: { kind: 'property_name', value: property.name.value.value },
                                type: interner.intern(property.type),
                                description: '',
                                origin
                            });
                        }
                    );
                    return Object.freeze([
                        ...types,
                        interner.intern(ObjectType({
                            name: modelTypeName,
                            baseName: modelBaseName,
                            properties,
                            role: 'model'
                        })) as ObjectType
                    ]);
                },
                () => types
            );
        }
    );
}
