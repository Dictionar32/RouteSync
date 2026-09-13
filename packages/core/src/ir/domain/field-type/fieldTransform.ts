/**
 * fieldTransform.ts
 *
 * String case transformations and form projection helpers for fields.
 *
 * @module core/ir/domain/field-type
 */

import type { TypeIR } from '../../../types/ir';
import { TypeIRUtils } from '../../../types/ir';

export function transformFieldName(phpName: string, caseTransform: string = 'camel'): string {
    switch (caseTransform) {
        case 'camel':
            return phpName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        case 'pascal':
            return phpName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
                .replace(/^([a-z])/, letter => letter.toUpperCase());
        case 'snake':
            return phpName;
        case 'kebab':
            return phpName.replace(/_/g, '-');
        default:
            return phpName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }
}

export function projectForForm(type: TypeIR): TypeIR {
    if (TypeIRUtils.isNullable(type)) {
        return { kind: 'optional', inner: type.inner };
    }
    return type;
}
