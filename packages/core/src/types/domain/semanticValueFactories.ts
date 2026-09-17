import type { ResponseFieldName, ResponseTypeName } from './semanticValues';

export function createResponseFieldName(value: string): ResponseFieldName {
    return Object.freeze({ kind: 'response_field_name', value });
}

export function createResponseTypeName(value: string): ResponseTypeName {
    return Object.freeze({ kind: 'response_type_name', value });
}
