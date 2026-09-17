/**
 * legacyConverter.ts
 *
 * Converts optimized resource fields to legacy ResourceFieldIR shapes.
 *
 * @module core/ir/domain/field-type
 */

import type { ResourceFieldIR } from '../../../types/ir';
import { TypeIRUtils } from '../../../types/ir';
import type { OptimizedResourceFieldIR } from '../irTypes';
import { projectForForm } from './fieldTransform';

export function convertToLegacyFieldIR(field: OptimizedResourceFieldIR): ResourceFieldIR {
    const typeProjections = {
        contract: field.type,
        read: field.type,
        form: field.hints.formNullableAsOptional
            ? projectForForm(field.type)
            : field.type,
        field: field.hints.stripModifiers
            ? TypeIRUtils.unwrapType(field.type)
            : field.type,
        mapper: field.type,
        schema: field.type
    };

    return {
        name: field.name,
        transformedName: field.transformedName,
        type: typeProjections,
        semanticType: field.semanticType,
        description: field.description,
        validation: field.validation,
        source: field.source
    };
}
