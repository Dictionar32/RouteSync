import type { ValidationRuleNode } from "./validationRules";
import type { SemanticType } from "../../compiler/types/SemanticType";
import type { RequestFieldPresence } from "./requestFieldPresence";
import type { PropertyName } from "../upstream/names";
import { createPropertyName } from "../upstream/names";
import { toCamelCase } from "../../utils/resource-naming";
import { relationGate } from "../../semantic/foundation/relationalSequence";

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


export const createScalarValidationFieldNode = (fieldName: PropertyName, semanticType: SemanticType, presence: RequestFieldPresence, rules: readonly ValidationRuleNode[] = [], propertyName?: PropertyName): ScalarValidationFieldNode => Object.freeze({ kind: ValidationFieldKind.Scalar, fieldName, propertyName: relationGate(typeof propertyName === 'object', () => propertyName as PropertyName, () => createPropertyName(toCamelCase(fieldName.value.value))), semanticType, presence, rules: Object.freeze([...rules]) });
export const createObjectValidationFieldNode = (fieldName: PropertyName, semanticType: SemanticType, presence: RequestFieldPresence, fields: readonly ValidationFieldNode[] = [], propertyName?: PropertyName): ObjectValidationFieldNode => Object.freeze({ kind: ValidationFieldKind.Object, fieldName, propertyName: relationGate(typeof propertyName === 'object', () => propertyName as PropertyName, () => createPropertyName(toCamelCase(fieldName.value.value))), semanticType, presence, fields: Object.freeze([...fields]) });
export const createArrayValidationFieldNode = (fieldName: PropertyName, semanticType: SemanticType, presence: RequestFieldPresence, element: ValidationFieldNode, rules: readonly ValidationRuleNode[] = [], propertyName?: PropertyName): ArrayValidationFieldNode => Object.freeze({ kind: ValidationFieldKind.Array, fieldName, propertyName: relationGate(typeof propertyName === 'object', () => propertyName as PropertyName, () => createPropertyName(toCamelCase(fieldName.value.value))), semanticType, presence, rules: Object.freeze([...rules]), element });

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
  const folded = {
    scalar: () => folder.scalar(node as ScalarValidationFieldNode),
    array: () => folder.array(node as ArrayValidationFieldNode, foldValidationField((node as ArrayValidationFieldNode).element, folder)),
    object: () => folder.object(node as ObjectValidationFieldNode, (node as ObjectValidationFieldNode).fields.map(child => foldValidationField(child, folder)))
  };
  return folded[node.kind]();
}
