import type { ValidationRuleNode } from "./validationRules";
import type { SemanticType } from "../../compiler/types/SemanticType";
import type { RequestFieldPresence } from "./requestFieldPresence";
import type { PropertyName } from "../upstream/names";

export interface ScalarValidationFieldNode {
  readonly kind: 'scalar';
  readonly fieldName: PropertyName;
  readonly propertyName: PropertyName;
  readonly semanticType: SemanticType;
  readonly presence: RequestFieldPresence;
  readonly rules: readonly ValidationRuleNode[];
}

export interface ArrayValidationFieldNode {
  readonly kind: 'array';
  readonly fieldName: PropertyName;
  readonly propertyName: PropertyName;
  readonly semanticType: SemanticType;
  readonly presence: RequestFieldPresence;
  readonly rules: readonly ValidationRuleNode[];
  readonly element: ValidationFieldNode;
}

export interface ObjectValidationFieldNode {
  readonly kind: 'object';
  readonly fieldName: PropertyName;
  readonly propertyName: PropertyName;
  readonly semanticType: SemanticType;
  readonly presence: RequestFieldPresence;
  readonly fields: readonly ValidationFieldNode[];
}

export type ValidationFieldNode =
  | ScalarValidationFieldNode
  | ArrayValidationFieldNode
  | ObjectValidationFieldNode;

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

export type ValidationFieldRegistry = {
  readonly [K in ValidationFieldKind]: ValidationFieldSpecification<K>;
};

export const VALIDATION_FIELD_REGISTRY: ValidationFieldRegistry = Object.freeze({
  [ValidationFieldKind.Scalar]: { kind: ValidationFieldKind.Scalar, isContainer: false, allowsChildren: false },
  [ValidationFieldKind.Array]: { kind: ValidationFieldKind.Array, isContainer: true, allowsChildren: true },
  [ValidationFieldKind.Object]: { kind: ValidationFieldKind.Object, isContainer: true, allowsChildren: true }
});

export interface ValidationFieldVisitor<R> {
  readonly scalar: (node: ScalarValidationFieldNode) => R;
  readonly array: (node: ArrayValidationFieldNode) => R;
  readonly object: (node: ObjectValidationFieldNode) => R;
}

export function matchValidationField<R>(node: ValidationFieldNode, visitor: ValidationFieldVisitor<R>): R {
  return visitor[node.kind](node as never);
}

export interface ValidationFieldFolder<R> {
  readonly scalar: (node: ScalarValidationFieldNode) => R;
  readonly array: (node: ArrayValidationFieldNode, foldedElement: R) => R;
  readonly object: (node: ObjectValidationFieldNode, foldedFields: readonly R[]) => R;
}

export function foldValidationField<R>(node: ValidationFieldNode, folder: ValidationFieldFolder<R>): R {
  switch (node.kind) {
    case 'scalar': return folder.scalar(node);
    case 'array': return folder.array(node, foldValidationField(node.element, folder));
    case 'object': return folder.object(node, node.fields.map(child => foldValidationField(child, folder)));
  }
}
