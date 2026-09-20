import { SemanticValueFactory, type ResponseFieldName, type ResponseTypeName } from './semanticValues';

export function createResponseFieldName(value: string): ResponseFieldName {
    return SemanticValueFactory.responseFieldName(value);
}

export function createResponseTypeName(value: string): ResponseTypeName {
    return SemanticValueFactory.responseTypeName(value);
}
