/**
 * legacyConverter.ts
 *
 * Converts optimized resource fields to legacy ResourceFieldIR shapes.
 *
 * @module core/ir/domain/field-type
 */

import type { ResourceFieldIR } from '../../../types/ir';
import type { OptimizedResourceFieldIR } from '../irTypes';

export function convertToLegacyFieldIR(field: OptimizedResourceFieldIR): ResourceFieldIR {
    return {
        name: field.name,
        transformedName: field.transformedName,
        type: field.projections,
        semanticType: field.semanticType,
        transform: field.transform,
        description: field.description,
        validation: field.validation,
        source: field.source
    };

}
