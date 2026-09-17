/** Closed response-field domain model. */

export type TypeWrapper<T> =
  | { readonly kind: 'identity'; readonly inner: T }
  | { readonly kind: 'nullable'; readonly inner: TypeWrapper<T> }
  | { readonly kind: 'collection'; readonly inner: TypeWrapper<T> }
  | { readonly kind: 'paginated'; readonly inner: TypeWrapper<T> };

export type FieldPresence =
  | { readonly kind: 'required' }
  | { readonly kind: 'nullable' }
  | { readonly kind: 'optional' }
  | { readonly kind: 'optional_nullable' };

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
  readonly resolved: ResponseFieldResolved;
}

export interface PropertyAccessResponseFieldContract {
  readonly kind: 'property_access';
  readonly targetSymbol: string;
  readonly propertyName: string;
  readonly resolved: ResponseFieldResolved;
}

export type ResponseFieldContract =
  | PrimitiveResponseFieldContract
  | ObjectResponseFieldContract
  | ArrayResponseFieldContract
  | VariableResponseFieldContract
  | PropertyAccessResponseFieldContract;

export type ResponseFieldKind = ResponseFieldContract['kind'];

export type ResponseFieldResolved =
  | { readonly kind: 'reference'; readonly typeName: string; readonly modelName: string }
  | { readonly kind: 'type'; readonly typeName: string }
  | { readonly kind: 'unresolved'; readonly reason: string };

export type ResponseFieldData =
  | { readonly kind: 'primitive'; readonly type: string; readonly presence: FieldPresence }
  | { readonly kind: 'object'; readonly fields: readonly (readonly [string, ResponseFieldData])[]; readonly presence: FieldPresence }
  | { readonly kind: 'array'; readonly itemType: ResponseFieldData; readonly presence: FieldPresence }
  | { readonly kind: 'variable'; readonly variableName: string; readonly resolved: ResponseFieldResolved; readonly presence: FieldPresence }
  | { readonly kind: 'property_access'; readonly targetSymbol: string; readonly propertyName: string; readonly resolved: ResponseFieldResolved; readonly presence: FieldPresence };

export interface ParsedResponseField {
  readonly name: string;
  readonly kind: 'primitive' | 'object' | 'array';
  readonly type: string;
  readonly nullable: boolean;
  readonly optional: boolean;
  readonly fields: readonly ParsedResponseField[];
  readonly itemType: ParsedResponseField | undefined;
}
