/**
 * Extracts response shapes from the canonical upstream route-response binding.
 * This projection only materializes shapes proven by the closed Integrated Response
 * result; it does not reconstruct response semantics from the compatibility descriptor.
 */

import { ResourceFieldSemanticBinding, type ResourceFieldSemanticBinding as ResourceFieldSemanticBindingType } from '../../../../types/domain/resourceFieldSemanticBinding';
import type { RouteSemanticFlow } from '../../../../types/route';
import { ReferenceType } from '../../../../types/domain/semanticType';
import { ResourceFieldExpressionFactory } from '../../../../types/domain/expressions';
import { BoundSemanticFactory } from '../../../../types/domain/boundAst';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { ResponseTypeName } from '../../../../types/upstream/names';
import type { ModelName, ResourceName } from '../../../../types/domain/semanticValues';
import { relationSome, relationNone } from '../../../../semantic/relations/relationalSequence';
import type { RelationOption } from '../../../../semantic/relations/relationalSequence';

export interface RouteResponseShape {
    readonly typeName: ResponseTypeName;
    readonly baseName: ResourceName | ModelName;
    readonly fields: readonly ResourceFieldSemanticBindingType[];
}

export function extractRouteResponseShape(route: RouteSemanticFlow): RelationOption<RouteResponseShape> {
    const projection = route.binding.responseProjection;
    if (projection.kind !== 'controller_method_response') return relationNone();

    const result = projection.product.result;
    if (result.kind !== 'resource') return relationNone();

    const resourceName = SemanticValueFactory.resourceName(result.resource.name.value.value);
    const responseTypeName = SemanticValueFactory.responseTypeName(`${resourceName.value.value}Response`);
    const shape = result.cardinality.kind === 'collection' ? 'collection' : 'single';
    const reference = ReferenceType.resource('', responseTypeName.value.value);
    const expression = ResourceFieldExpressionFactory.resource(resourceName, { kind: shape });
    const field = ResourceFieldSemanticBinding.fromExpression(
        'data',
        expression,
        reference,
        'data',
        BoundSemanticFactory.resourceReference(resourceName),
    );

    return relationSome({
        typeName: responseTypeName,
        baseName: resourceName,
        fields: [field],
    });
}
