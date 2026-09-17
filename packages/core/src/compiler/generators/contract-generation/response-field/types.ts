/**
 * types.ts
 *
 * Types for response field parsing. Level 7 Subatomic Functor & ADT Contracts.
 * Zero sentinel undefined, zero null, zero optional fields (0% porosity).
 *
 * @module core/compiler/generators/contract-generation/response-field
 */

export type TypeWrapper<T> =
  | { readonly kind: 'identity'; readonly inner: T }
  | { readonly kind: 'nullable'; readonly inner: TypeWrapper<T> }
  | { readonly kind: 'collection'; readonly inner: TypeWrapper<T> }
  | { readonly kind: 'paginated'; readonly inner: TypeWrapper<T> };

export interface PrimitiveResponseFieldContract {
  readonly kind: 'primitive';
  readonly typeName: string;
  readonly shape: TypeWrapper<'scalar'>;
}

export interface ObjectResponseFieldContract {
  readonly kind: 'object';
  readonly fieldEntries: readonly (readonly [string, ResponseFieldContract])[];
  readonly shape: TypeWrapper<'object'>;
}

export interface ArrayResponseFieldContract {
  readonly kind: 'array';
  readonly item: ResponseFieldContract;
  readonly shape: TypeWrapper<'array'>;
}

export interface VariableResponseFieldContract {
  readonly kind: 'variable';
  readonly variableName: string;
}

export interface PropertyAccessResponseFieldContract {
  readonly kind: 'property_access';
  readonly targetSymbol: string;
  readonly propertyName: string;
}

export type ResponseFieldContract =
  | PrimitiveResponseFieldContract
  | ObjectResponseFieldContract
  | ArrayResponseFieldContract
  | VariableResponseFieldContract
  | PropertyAccessResponseFieldContract;

export type ResponseFieldKind = 'primitive' | 'object' | 'array' | 'variable' | 'property_access';

export type ResponseFieldResolved =
  | { readonly status: 'resolved'; readonly type: string; readonly model?: string }
  | { readonly status: 'resolved'; readonly model: string; readonly type?: string }
  | { readonly status: 'unresolved'; readonly reason: string };

interface ResponseFieldBase {
  readonly nullable?: boolean;
  readonly optional?: boolean;
}

export type ResponseFieldData =
  | (ResponseFieldBase & {
      readonly kind: 'primitive';
      readonly type: string;
    })
  | (ResponseFieldBase & {
      readonly kind: 'object';
      readonly fields?: Readonly<Record<string, ResponseFieldData>>;
    })
  | (ResponseFieldBase & {
      readonly kind: 'array';
      readonly itemType?: ResponseFieldData;
    })
  | (ResponseFieldBase & {
      readonly kind: 'variable';
      readonly resolved?: ResponseFieldResolved;
    })
  | (ResponseFieldBase & {
      readonly kind: 'property_access';
      readonly resolved?: ResponseFieldResolved;
    });

export type ParsedResponseField = {
  name: string;
  kind: 'primitive' | 'object' | 'array';
  type: string;
  nullable: boolean;
  optional: boolean;
  fields?: readonly ParsedResponseField[];
  itemType?: ParsedResponseField;
};
