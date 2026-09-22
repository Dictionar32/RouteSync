/**
 * Extracts the canonical response shape from a typed route descriptor.
 * The scanner owns normalization; downstream receives ResourceFieldDescriptor[] only.
 */

import type { ResourceFieldDescriptor } from '../../../../../types/domain/expressions';
import type { ScannedRoute } from '../../../../../types/route';
import { ReferenceType } from '../../../../types/SemanticType';
import { ResourceFieldExpressionFactory } from '../../../../../types/domain/expressions';
import { SemanticValueFactory } from '../../../../../types/domain/semanticValues';
import type { ResponseTypeName } from '../../../../../types/upstream/names';
import type { ModelName, ResourceName } from '../../../../../types/domain/semanticValues';

export interface RouteResponseShape {
    readonly typeName: ResponseTypeName;
    readonly baseName: ResourceName | ModelName;
    readonly fields: readonly ResourceFieldDescriptor[];
}

export function extractRouteResponseShape(route: ScannedRoute): RouteResponseShape | null {
    const response = route.response;
    if (response.kind === 'void') return null;

    if (response.kind === 'inline') {
        return {
            typeName: response.typeName,
            baseName: response.baseName,
            fields: response.fields
        };
    }

    const baseName = response.kind === 'resource'
        ? response.resourceName
        : response.modelName;
    const typeName = response.responseTypeName();

    return {
        typeName,
        baseName,
        fields: [createWrappedDataField(response, typeName)]
    };
}

function createWrappedDataField(
    response: Exclude<ScannedRoute['response'], { readonly kind: 'inline' } | { readonly kind: 'void' }>,
    transformedName: ResponseTypeName
): ResourceFieldDescriptor {
    const name = SemanticValueFactory.responseFieldName('data');
    const propertyName = SemanticValueFactory.propertyName('data');
    const reference = ReferenceType.resource('', transformedName.value.value);
    const expression = response.kind === 'resource'
        ? ResourceFieldExpressionFactory.resource(response.resourceName, response.shape === 'single' ? { kind: 'single' } : { kind: 'collection' })
        : ResourceFieldExpressionFactory.model(response.modelName, response.shape === 'single' ? { kind: 'single' } : { kind: 'collection' });

    return Object.freeze({
        name,
        propertyName,
        expression,
        semanticType: reference
    });
}
