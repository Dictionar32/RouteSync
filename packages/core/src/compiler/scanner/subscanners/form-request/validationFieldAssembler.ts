import { createPropertyName } from '../../../../types/upstream/names';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { RequestField } from '../../../../types/domain/request';
import type { RouteValidationRuleEntry, ValidationFieldShape, ValidationFieldProperty } from '../../../../types/domain/validationRules';
import type { ValidationFieldNode } from '../../../../types/domain/validationFields';
import type { TypeInterner } from '../../../types/TypeInterner';
import { ObjectType, ReadonlyCollectionType, CollectionKind, type ObjectProperty, type SemanticType } from '../../../types/SemanticType';
import { RequestFieldMeaningFactory } from '../../../../types/domain/requestFieldMeaning';
import { ScannedScalarFieldNode, ScannedObjectFieldNode, ScannedArrayFieldNode } from '../../descriptors/validation/fieldNodes';

export interface CanonicalValidationRuleSet {
  readonly entries: readonly RouteValidationRuleEntry[];
  readonly fields: readonly RequestField[];
  readonly tree: readonly ValidationFieldNode[];
}

interface RootValidationField {
  readonly name: import('../../../../types/upstream/names').PropertyName;
  readonly semanticType: SemanticType;
  readonly presence: RouteValidationRuleEntry['presence'];
  readonly requirement: RequestField['requirement'];
  readonly validation: RouteValidationRuleEntry['validation'];
  readonly source: RouteValidationRuleEntry['source'];
  readonly shape: ValidationFieldShape;
  readonly properties: readonly ValidationFieldProperty[];
}

export function assembleCanonicalValidationFields(entries: readonly RouteValidationRuleEntry[], interner: TypeInterner): CanonicalValidationRuleSet {
  const roots = collectRoots(entries);
  const fields = Array.from(roots.values()).map(root => toRequestField(root, interner));
  const tree = Array.from(roots.values()).map(toTreeNode);
  return { entries: Object.freeze([...entries]), fields: Object.freeze(fields), tree: Object.freeze(tree) };
}

function collectRoots(entries: readonly RouteValidationRuleEntry[]): ReadonlyMap<string, RootValidationField> {
  const roots = new Map<string, RootValidationField>();
  for (const entry of entries) {
    const rootName = entry.location.kind === 'root' ? entry.fieldName.value.value : entry.location.collection.value.value;
    const rootPropertyName = entry.location.kind === 'root' ? entry.fieldName : entry.location.collection;
    const existing = roots.get(rootName);
    if (entry.location.kind === 'root') {
      roots.set(rootName, {
        name: rootPropertyName,
        semanticType: entry.semanticType,
        presence: entry.presence,
        requirement: requirementFromValidation(entry.validation),
        validation: entry.validation,
        source: entry.source,
        shape: entry.shape,
        properties: existing?.properties ?? []
      });
    } else {
      const property = leafProperty(entry);
      roots.set(rootName, {
        name: rootPropertyName,
        semanticType: entry.semanticType,
        presence: existing?.presence ?? entry.presence,
        requirement: existing?.requirement ?? requirementFromValidation(entry.validation),
        validation: existing?.validation ?? [],
        source: existing?.source ?? entry.source,
        shape: existing?.shape ?? entry.shape,
        properties: mergeProperty(existing?.properties ?? [], property)
      });
    }
  }
  return roots;
}

function leafProperty(entry: RouteValidationRuleEntry): ValidationFieldProperty {
  const shape = entry.shape;
  if (shape.kind !== 'collection' || shape.element.kind !== 'object' || shape.element.fields.length === 0) {
    return { name: entry.fieldName, semanticType: entry.semanticType, presence: entry.presence, validation: entry.validation, shape: shape.kind === 'collection' ? shape.element : shape };
  }
  return shape.element.fields[0];
}

function mergeProperty(properties: readonly ValidationFieldProperty[], property: ValidationFieldProperty): readonly ValidationFieldProperty[] {
  const index = properties.findIndex(candidate => candidate.name.value === property.name.value);
  if (index === -1) return Object.freeze([...properties, property]);
  const existing = properties[index];
  const merged = existing.shape.kind === 'object' && property.shape.kind === 'object'
    ? { ...existing, semanticType: objectType(existing.name, property.shape.fields.reduce((fields, field) => mergeProperty(fields, field), existing.shape.fields)), shape: { kind: 'object' as const, fields: property.shape.fields.reduce((fields, field) => mergeProperty(fields, field), existing.shape.fields) } }
    : property;
  return Object.freeze(properties.map((candidate, candidateIndex) => candidateIndex === index ? merged : candidate));
}

function requirementFromValidation(validation: readonly import('../../../../types/domain/validationRules').ValidationRuleNode[]): RequestField['requirement'] {
  const rule = validation.find(item =>
    item.kind === 'required_with' || item.kind === 'required_with_all' ||
    item.kind === 'required_without' || item.kind === 'required_without_all' ||
    item.kind === 'required_if' || item.kind === 'required_unless'
  );
  if (rule === undefined) return { kind: 'unconditional' };
  if (rule.kind === 'required_with' || rule.kind === 'required_with_all' || rule.kind === 'required_without' || rule.kind === 'required_without_all') {
    return { kind: rule.kind, fields: Object.freeze([...rule.fields]) };
  }
  return { kind: rule.kind, field: rule.field, values: Object.freeze([...rule.values]) };
}

function toRequestField(root: RootValidationField, interner: TypeInterner): RequestField {
  const type = root.properties.length > 0 ? interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, objectType(root.name, root.properties))) : root.semanticType;
  return {
    name: SemanticValueFactory.requestFieldName(root.name.value.value),
    sourceName: root.name,
    meaning: RequestFieldMeaningFactory.fromSemanticType(type),
    presence: root.presence,
    requirement: root.requirement,
    validation: Object.freeze([...root.validation]),
    fileConstraints: Object.freeze([]),
    source: root.source
  };
}

function objectType(name: import('../../../../types/upstream/names').PropertyName, properties: readonly ValidationFieldProperty[]): ObjectType {
  const objectProperties: ObjectProperty[] = properties.map(property => ({ name: property.name, type: property.semanticType, description: '', origin: { kind: 'validation_field', field: property.name.value.value } }));
  return new ObjectType({ name: name.value.value, baseName: name.value.value, properties: objectProperties, role: 'plain' });
}

function toTreeNode(root: RootValidationField): ValidationFieldNode {
  if (root.properties.length > 0) {
    const element = ScannedObjectFieldNode.create(root.name, objectType(root.name, root.properties), root.presence, root.properties.map(propertyToTreeNode));
    return ScannedArrayFieldNode.create(root.name, new ReadonlyCollectionType(CollectionKind.ARRAY, element.semanticType), root.presence, element, root.validation);
  }
  if (root.semanticType.kind === 'readonly_collection' || root.semanticType.kind === 'mutable_collection') {
    return ScannedArrayFieldNode.create(root.name, root.semanticType, root.presence, ScannedScalarFieldNode.create(createPropertyName(`${root.name.value.value}.*`), root.semanticType.elementType, root.presence), root.validation);
  }
  return ScannedScalarFieldNode.create(root.name, root.semanticType, root.presence, root.validation);
}

function propertyToTreeNode(property: ValidationFieldProperty): ValidationFieldNode {
  if (property.shape.kind === 'object') return ScannedObjectFieldNode.create(property.name, property.semanticType, property.presence, property.shape.fields.map(propertyToTreeNode));
  if (property.shape.kind === 'collection') return ScannedArrayFieldNode.create(property.name, property.semanticType, property.presence, ScannedScalarFieldNode.create(createPropertyName(`${property.name.value.value}.*`), property.shape.elementType, property.presence), property.validation);
  return ScannedScalarFieldNode.create(property.name, property.semanticType, property.presence, property.validation);
}
