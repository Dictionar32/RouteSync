/**
 * routeResponseDeriver.ts
 *
 * Active Consumer: Derives canonical ObjectType instances for routes with inline or anonymous response structures.
 */

import { ObjectType } from '../../../../types/domain/semanticType';
import type { SemanticDerivationContext } from './SemanticDerivationContext';
import {
    extractRouteResponseShape,
    processResponseProperties
} from './route-response';
import { relationAll, relationEqual, relationFold, relationGate, relationOptionFold } from '../../../../semantic/foundation/relationalSequence';
import { relationContains, relationInsert, type RelationMembership } from '../../../../semantic/foundation/relationMembership';

export function deriveRouteResponseTypes(
    context: SemanticDerivationContext,
    seenNames: RelationMembership<string>
): readonly ObjectType[] {
    return relationFold(
        context.routes,
        [] as ObjectType[],
        (types, route) => relationOptionFold(
            extractRouteResponseShape(route),
            () => types,
            shape => {
                const typeNameValue = shape.typeName.value.value;
                const baseNameValue = shape.baseName.value.value;
                return relationGate(
                    relationAll([typeNameValue.length > 0, relationEqual(relationContains(seenNames, typeNameValue), false)]),
                    () => {
                        seenNames = relationInsert(seenNames, typeNameValue);
                        const properties = processResponseProperties(shape.fields, context);
                        return [
                            ...types,
                            context.interner.intern(ObjectType({
                                name: typeNameValue,
                                baseName: baseNameValue,
                                properties,
                                role: 'response',
                            })) as ObjectType,
                        ];
                    },
                    () => types,
                );
            },
        ),
    );
}

