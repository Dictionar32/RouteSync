import { createPropertyName } from '../../../../types/upstream/names';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { RequestField } from '../../../../types/domain/request';
import type { RouteValidationRuleEntry, ValidationFieldShape, ValidationFieldProperty, ValidationRuleNode } from '../../../../types/domain/validationRules';
import type { ValidationFieldNode } from '../../../../types/domain/validationFields';
import type { TypeInterner } from '../../../types/TypeInterner';
import { ObjectType, ReadonlyCollectionType, CollectionKind, type ObjectProperty, type SemanticType } from '../../../types/SemanticType';
import { RequestFieldMeaningFactory } from '../../../../types/domain/requestFieldMeaning';
import { createScalarValidationFieldNode, createObjectValidationFieldNode, createArrayValidationFieldNode } from '../../../../types/domain/validationFields';
import { relationGate, relationFold, relationProject, relationIndexOf, relationOptionFold, relationFirstOption, relationAnyMatch, relationIndexAdd } from '../../../../semantic/kernel/relationalSequence';

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
  const values = relationProject(roots, ([, value]) => value);
  const fields = relationProject(values, root => toRequestField(root, interner));
  const tree = relationProject(values, toTreeNode);
  return { entries: Object.freeze([...entries]), fields: Object.freeze(fields), tree: Object.freeze(tree) };
}

type RootIndex = readonly (readonly [string, RootValidationField])[];

function collectRoots(entries: readonly RouteValidationRuleEntry[]): RootIndex {
  return relationFold(entries, Object.freeze([]) as RootIndex, (roots, entry) => {
    const rootName = relationGate(Object.is(entry.location.kind, 'root'), () => entry.fieldName.value.value, () => entry.location.collection.value.value);
    const rootPropertyName = relationGate(Object.is(entry.location.kind, 'root'), () => entry.fieldName, () => entry.location.collection);
    const existing = relationFirstOption(roots, entry => Object.is(entry[0], rootName));
    const root = relationGate(Object.is(entry.location.kind, 'root'),
      () => ({
        name: rootPropertyName,
        semanticType: entry.semanticType,
        presence: entry.presence,
        requirement: requirementFromValidation(entry.validation),
        validation: entry.validation,
        source: entry.source,
        shape: entry.shape,
        properties: relationOptionFold(existing, () => [], value => value.properties)
      }),
      () => {
        const property = leafProperty(entry);
        return {
          name: rootPropertyName,
          semanticType: entry.semanticType,
          presence: relationOptionFold(existing, () => entry.presence, value => value.presence),
          requirement: relationOptionFold(existing, () => requirementFromValidation(entry.validation), value => value.requirement),
          validation: relationOptionFold(existing, () => [], value => value.validation),
          source: relationOptionFold(existing, () => entry.source, value => value.source),
          shape: relationOptionFold(existing, () => entry.shape, value => value.shape),
          properties: mergeProperty(relationOptionFold(existing, () => [], value => value.properties), property)
        };
      });
    return relationIndexAdd(roots, rootName, root);
  });
}

function leafProperty(entry: RouteValidationRuleEntry): ValidationFieldProperty {
  const shape = entry.shape;
  const nested = relationGate(Object.is(shape.kind, 'collection'),
    () => relationGate(Object.is(shape.element.kind, 'object'),
      () => relationGate(shape.element.fields.length > 0, () => shape.element.fields[0], () => entryProperty(entry, shape)),
      () => entryProperty(entry, shape)),
    () => entryProperty(entry, shape));
  return nested;
}

function entryProperty(entry: RouteValidationRuleEntry, shape: ValidationFieldShape): ValidationFieldProperty {
  return {
    name: entry.fieldName,
    semanticType: entry.semanticType,
    presence: entry.presence,
    validation: entry.validation,
    shape: relationGate(Object.is(shape.kind, 'collection'), () => shape.element, () => shape)
  };
}

function mergeProperty(properties: readonly ValidationFieldProperty[], property: ValidationFieldProperty): readonly ValidationFieldProperty[] {
  const index = relationIndexOf(properties, candidate => Object.is(candidate.name.value, property.name.value));
  return relationGate(Object.is(index, -1),
    () => Object.freeze([...properties, property]),
    () => {
      const existing = properties[index];
      const merged = relationGate(relationGate(Object.is(existing.shape.kind, 'object'), () => Object.is(property.shape.kind, 'object'), () => false),
        () => {
          const fields = relationFold(property.shape.fields, existing.shape.fields, (current, field) => mergeProperty(current, field));
          return { ...existing, semanticType: objectType(existing.name, fields), shape: { kind: 'object' as const, fields } };
        },
        () => property);
      return Object.freeze(relationProject(properties, (candidate, candidateIndex) => relationGate(Object.is(candidateIndex, index), () => merged, () => candidate)));
    });
}

function requirementFromValidation(validation: readonly ValidationRuleNode[]): RequestField['requirement'] {
  const rule = relationFirstOption(validation, item => relationAnyMatch(
    ['required_with', 'required_with_all', 'required_without', 'required_without_all', 'required_if', 'required_unless'],
    kind => Object.is(kind, item.kind)
  ));
  return relationOptionFold(rule,
    () => ({ kind: 'unconditional' as const }),
    item => relationGate(
      relationAnyMatch(['required_with', 'required_with_all', 'required_without', 'required_without_all'], kind => Object.is(kind, item.kind)),
      () => ({ kind: item.kind, fields: Object.freeze([...item.fields]) }),
      () => ({ kind: item.kind, field: item.field, values: Object.freeze([...item.values]) })
    ));
}

function toRequestField(root: RootValidationField, interner: TypeInterner): RequestField {
  const type = relationGate(root.properties.length > 0,
    () => interner.intern(ReadonlyCollectionType(CollectionKind.ARRAY, objectType(root.name, root.properties))),
    () => root.semanticType);
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
  return ObjectType({
    name: name.value.value,
    baseName: name.value.value,
    properties: relationProject(properties, property => ({ name: property.name, type: property.semanticType, description: '', origin: { kind: 'validation_field' as const, field: property.name.value.value } })),
    role: 'plain'
  });
}

function toTreeNode(root: RootValidationField): ValidationFieldNode {
  return relationGate(root.properties.length > 0,
    () => {
      const element = createObjectValidationFieldNode(root.name, objectType(root.name, root.properties), root.presence, relationProject(root.properties, propertyToTreeNode));
      return createArrayValidationFieldNode(root.name, ReadonlyCollectionType(CollectionKind.ARRAY, element.semanticType), root.presence, element, root.validation);
    },
    () => relationGate(relationAnyMatch(['readonly_collection', 'mutable_collection'], kind => Object.is(kind, root.semanticType.kind)),
      () => createArrayValidationFieldNode(root.name, root.semanticType, root.presence, createScalarValidationFieldNode(createPropertyName(`${root.name.value.value}.*`), root.semanticType.elementType, root.presence), root.validation),
      () => createScalarValidationFieldNode(root.name, root.semanticType, root.presence, root.validation)));
}

function propertyToTreeNode(property: ValidationFieldProperty): ValidationFieldNode {
  return relationGate(Object.is(property.shape.kind, 'object'),
    () => createObjectValidationFieldNode(property.name, property.semanticType, property.presence, relationProject(property.shape.fields, propertyToTreeNode)),
    () => relationGate(Object.is(property.shape.kind, 'collection'),
      () => createArrayValidationFieldNode(property.name, property.semanticType, property.presence, createScalarValidationFieldNode(createPropertyName(`${property.name.value.value}.*`), property.shape.elementType, property.presence), property.validation),
      () => createScalarValidationFieldNode(property.name, property.semanticType, property.presence, property.validation)));
}
