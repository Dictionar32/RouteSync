/**
 * Verified Laravel response contract.
 *
 * This is the semantic boundary after the Laravel DTO AST. The contract
 * carries meaning, not TypeScript implementation details. Every variant is
 * closed so downstream passes never need shape probing or re-classification.
 */
import type { ModelName, ResponseFieldName, ResponseTypeName } from './semanticValues';
import type { ResponseShape } from './responseShapes';

export type ResponseNullability =
    | { readonly kind: 'required' }
    | { readonly kind: 'nullable' };

export type ResponseScalarValue =
    | { readonly kind: 'textual' }
    | { readonly kind: 'whole_number' }
    | { readonly kind: 'decimal_number' }
    | { readonly kind: 'boolean_flag' };

export type ResponseValueContract =
    | { readonly kind: 'scalar'; readonly value: ResponseScalarValue }
    | { readonly kind: 'named_type'; readonly name: ResponseTypeName }
    | { readonly kind: 'model_reference'; readonly model: ModelName }
    | { readonly kind: 'collection'; readonly element: ResponseValueContract }
    | { readonly kind: 'unresolved_declaration'; readonly reason: 'mixed_declaration' };

export interface ResponseContractField {
    readonly name: ResponseFieldName;
    readonly value: ResponseValueContract;
    readonly nullability: ResponseNullability;
}

export interface ResponseContract {
    readonly kind: 'object';
    readonly name: ResponseTypeName;
    readonly shape: ResponseShape;
    readonly fields: readonly ResponseContractField[];
}
