/**
 * Extracts the canonical response shape from a typed route descriptor.
 * The scanner owns normalization; downstream receives ResourceFieldDescriptor[] only.
 */

import type { ResourceFieldDescriptor } from '../../../../../types/domain/expressions';
import type { ScannedRoute } from '../../../../../types/route';
import { toPascalCase } from '../../../../../utils/resource-naming';
import { ReferenceType } from '../../../../types/SemanticType';
import { ResourceFieldExpressionFactory } from '../../../../../types/domain/expressions';
import { SemanticValueFactory } from '../../../../../types/domain/semanticValues';

export interface RouteResponseShape {
    readonly typeName: string;
    readonly baseName: string;
    readonly fields: readonly ResourceFieldDescriptor[];
}

export function extractRouteResponseShape(route: ScannedRoute): RouteResponseShape | null {
    const response = route.response;
    if (response.kind === 'void') return null;

    if (response.kind === 'inline') {
        return {
            typeName: response.typeName.value,
            baseName: response.baseName.value,
            fields: response.fields
        };
    }

    const rawDomain = route.domain
        ? route.domain
        : route.resourceName
            ? route.resourceName
            : route.actionName
                ? route.actionName.replace(/Controller$/, '')
                : 'Inline';
    const baseName = toPascalCase(rawDomain);
    const targetName = response.kind === 'resource'
        ? response.resourceName.value
        : response.modelName.value;
    const transformedName = `${toPascalCase(targetName)}Transformed`;

    return {
        typeName: `${baseName}Transformed`,
        baseName,
        fields: [createWrappedDataField(response, transformedName)]
    };
}

function createWrappedDataField(
    response: Exclude<ScannedRoute['response'], { readonly kind: 'inline' } | { readonly kind: 'void' }>,
    transformedName: string
): ResourceFieldDescriptor {
    const name = SemanticValueFactory.responseFieldName('data');
    const propertyName = SemanticValueFactory.propertyName('data');
    const reference = new ReferenceType('', transformedName);
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
