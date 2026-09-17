/**
 * routeResponseDeriver.ts
 *
 * Active Consumer: Derives canonical ObjectType instances for routes with inline or anonymous response structures.
 *
 * @module core/compiler/scanner/subscanners/semantic/routeResponseDeriver
 */

import { ObjectType } from '../../../types/SemanticType';
import type { SemanticDerivationContext } from './SemanticDerivationContext';
import {
    extractRouteResponseShape,
    processResponseProperties
} from './route-response';

export function deriveRouteResponseTypes(
    context: SemanticDerivationContext,
    seenNames: Set<string>
): readonly ObjectType[] {
    const types: ObjectType[] = [];
    const interner = context.interner;

    for (const route of context.routes) {
        const shape = extractRouteResponseShape(route);
        if (!shape) continue;

        const { typeName, baseName, fields } = shape;

        if (typeName.length > 0 && !seenNames.has(typeName)) {
            seenNames.add(typeName);
            const properties = processResponseProperties(fields, context);
            types.push(interner.intern(new ObjectType({ name: typeName, baseName, properties, role: 'response' })) as ObjectType);
        }
    }

    return types;
}
