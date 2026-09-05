import type { ValidationRuleNode } from "./validationRules";

export interface ScalarValidationFieldNode {
  readonly kind: 'scalar';
  readonly fieldName: string;
  readonly propertyName: string;
  readonly rules: readonly ValidationRuleNode[];
}

export interface ArrayValidationFieldNode {
  readonly kind: 'array';
  readonly fieldName: string;
  readonly propertyName: string;
  readonly rules: readonly ValidationRuleNode[];
  readonly element: ValidationFieldNode;
}

export interface ObjectValidationFieldNode {
  readonly kind: 'object';
  readonly fieldName: string;
  readonly propertyName: string;
  readonly fields: readonly ValidationFieldNode[];
}

export type ValidationFieldNode =
  | ScalarValidationFieldNode
  | ArrayValidationFieldNode
  | ObjectValidationFieldNode;

/**
 * ValidationFieldKind
 *
 * Canonical Domain Vocabulary for Validation Tree Node Kinds.
 */
export const ValidationFieldKind = Object.freeze({
  Scalar: 'scalar',
  Array: 'array',
  Object: 'object'
} as const);

export type ValidationFieldKind = typeof ValidationFieldKind[keyof typeof ValidationFieldKind];

export interface ValidationFieldSpecification<K extends ValidationFieldKind = ValidationFieldKind> {
  readonly kind: K;
  readonly isContainer: boolean;
  readonly allowsChildren: boolean;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key ValidationFieldKind.
 */
export type ValidationFieldRegistry = {
  readonly [K in ValidationFieldKind]: ValidationFieldSpecification<K>;
};

export const VALIDATION_FIELD_REGISTRY: ValidationFieldRegistry = Object.freeze({
  [ValidationFieldKind.Scalar]: {
    kind: ValidationFieldKind.Scalar,
    isContainer: false,
    allowsChildren: false
  },
  [ValidationFieldKind.Array]: {
    kind: ValidationFieldKind.Array,
    isContainer: true,
    allowsChildren: true
  },
  [ValidationFieldKind.Object]: {
    kind: ValidationFieldKind.Object,
    isContainer: true,
    allowsChildren: true
  }
});

export interface ValidationFieldVisitor<R> {
  readonly scalar: (node: ScalarValidationFieldNode) => R;
  readonly array: (node: ArrayValidationFieldNode) => R;
  readonly object: (node: ObjectValidationFieldNode) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian ValidationFieldNode dengan exhaustive type safety
 */
export function matchValidationField<R>(
  node: ValidationFieldNode,
  visitor: ValidationFieldVisitor<R>
): R {
  return visitor[node.kind](node as any);
}

export interface ValidationFieldFolder<R> {
  readonly scalar: (node: ScalarValidationFieldNode) => R;
  readonly array: (node: ArrayValidationFieldNode, foldedElement: R) => R;
  readonly object: (node: ObjectValidationFieldNode, foldedFields: readonly R[]) => R;
}

/**
 * 0 `if` Recursive Tree Fold: Mengakumulasi seluruh subtree ValidationFieldNode dari bawah ke atas secara fungsional murni
 */
export function foldValidationField<R>(
  node: ValidationFieldNode,
  folder: ValidationFieldFolder<R>
): R {
  const FOLD_DISPATCH: ValidationFieldVisitor<R> = {
    scalar: (s) => folder.scalar(s),
    array: (a) => folder.array(a, foldValidationField(a.element, folder)),
    object: (o) => folder.object(o, o.fields.map(child => foldValidationField(child, folder)))
  };
  return FOLD_DISPATCH[node.kind](node as any);
}
