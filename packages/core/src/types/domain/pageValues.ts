/**
 * Structured page value carried by the Laravel page boundary.
 * The value is recursively classified, so page metadata cannot carry `unknown`.
 */
export type PageValue =
  | PageStringValue
  | PageNumberValue
  | PageBooleanValue
  | PageNullValue
  | PageListValue
  | PageObjectValue;

export interface PageStringValue {
  readonly kind: 'string';
  readonly value: string;
}

export interface PageNumberValue {
  readonly kind: 'number';
  readonly value: number;
}

export interface PageBooleanValue {
  readonly kind: 'boolean';
  readonly value: boolean;
}

export interface PageNullValue {
  readonly kind: 'null';
}

export interface PageListValue {
  readonly kind: 'list';
  readonly items: readonly PageValue[];
}

export interface PageObjectEntry {
  readonly key: string;
  readonly value: PageValue;
}

export interface PageObjectValue {
  readonly kind: 'object';
  readonly entries: readonly PageObjectEntry[];
}
