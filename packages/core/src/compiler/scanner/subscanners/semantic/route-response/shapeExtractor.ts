/**
 * Extracts the canonical response shape from a typed route descriptor.
 * The scanner owns normalization; downstream receives ResourceFieldDescriptor[] only.
 */

import type { ResourceFieldDescriptor } from '../../../../../types/domain/expressions';
import type { RouteSemanticFlow } from '../../../../../types/route';
import { ReferenceType } from '../../../../types/SemanticType';
import { ResourceFieldExpressionFactory } from '../../../../../types/domain/expressions';
import { SemanticValueFactory } from '../../../../../types/domain/semanticValues';
import type { ResponseTypeName } from '../../../../../types/upstream/names';
import type { ModelName, ResourceName } from '../../../../../types/domain/semanticValues';
import { relationEqual, relationGate, relationOptionFold, relationSome, relationNone } from '../../../../../semantic/kernel/relationalSequence';
import type { RelationOption } from '../../../../../semantic/kernel/relationalSequence';

export interface RouteResponseShape {
    readonly typeName: ResponseTypeName;
    readonly baseName: ResourceName | ModelName;
    readonly fields: readonly ResourceFieldDescriptor[];
}

type InlineResponse = Extract<RouteSemanticFlow['response'], { readonly kind: 'inline' }>;
type WrappedResponse = Exclude<RouteSemanticFlow['response'], { readonly kind: 'inline' } | { readonly kind: 'void' }>;

export function extractRouteResponseShape(route: RouteSemanticFlow): RelationOption<RouteResponseShape> {
    const response = route.response;
    return relationGate(
        relationEqual(response.kind, 'void'),
        () => relationNone(),
        () => relationGate(
            relationEqual(response.kind, 'inline'),
            () => relationSome(createInlineShape(response as InlineResponse)),
            () => relationSome(createWrappedShape(response as WrappedResponse)),
        ),
    );
}

function createInlineShape(response: InlineResponse): RouteResponseShape {
    return {
        typeName: response.typeName,
        baseName: response.baseName,
        fields: response.fields,
    };
}

function createWrappedShape(response: WrappedResponse): RouteResponseShape {
    const typeName = response.responseTypeName();
    return {
        typeName,
        baseName: relationGate(
            relationEqual(response.kind, 'resource'),
            () => response.resourceName,
            () => response.modelName,
        ),
        fields: [createWrappedDataField(response, typeName)],
    };
}

function createWrappedDataField(
    response: WrappedResponse,
    transformedName: ResponseTypeName
): ResourceFieldDescriptor {
    const name = SemanticValueFactory.responseFieldName('data');
    const propertyName = SemanticValueFactory.propertyName('data');
    const reference = ReferenceType.resource('', transformedName.value.value);
    const expression = relationGate(
        relationEqual(response.kind, 'resource'),
        () => ResourceFieldExpressionFactory.resource(
            response.resourceName,
            relationGate(relationEqual(response.shape, 'single'), () => ({ kind: 'single' }), () => ({ kind: 'collection' })),
        ),
        () => ResourceFieldExpressionFactory.model(
            response.modelName,
            relationGate(relationEqual(response.shape, 'single'), () => ({ kind: 'single' }), () => ({ kind: 'collection' })),
        ),
    );

    return Object.freeze({
        name,
        propertyName,
        expression,
        semanticType: reference,
    });
}
