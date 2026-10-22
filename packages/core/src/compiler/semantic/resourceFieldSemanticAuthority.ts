import type { Expression } from '../../types/upstream/expression';
import type { ResourceFieldMeaning, ResourceRelationProjection } from '../../types/upstream/resource';
import type { TypeExpression } from '../../types/upstream/typeVocabulary';
import type {
  ResourceFieldSemanticAuthorityInput,
  ResourceFieldSemanticAuthorityInterface,
  ResourceFieldSemanticJudgment,
  ResourceFieldOutputShapeJudgment,
} from '../../types/upstream/resourceFieldSemanticAuthorityInterface';
import type { PhpAstValue } from '../scanner/lexer/PhpAst';
import type { OriginModelSymbol } from '../scanner/symbols/model/originModelSymbol';
import type { ResolvedPropertyBinding } from '../scanner/symbols/model/types';
import { matchLookup, type Lookup } from '../../types/upstream/collections';
import type { ModelReference, ResourceReference } from '../../types/upstream/semanticReferences';
import type { PropertyName } from '../../types/upstream/names';
import type { StringValue } from '../../types/upstream/valueObjects';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const propertyName = (value: string): PropertyName => ({ kind: 'property_name', value: stringValue(value) });
const resourceReference = (value: string): ResourceReference => ({ kind: 'resource_reference', name: { kind: 'resource_name', value: stringValue(value) } });
const modelReference = (value: StringValue): ModelReference => ({ kind: 'model_reference', name: { kind: 'model_name', value } });

const missingBinding: Lookup<ResolvedPropertyBinding> = { kind: 'missing' };

const propertyBinding = (value: PhpAstValue, model: OriginModelSymbol): Lookup<ResolvedPropertyBinding> => {
  if (value.kind !== 'property_access') {
    return missingBinding;
  }
  if (value.receiver.kind !== 'variable_reference') {
    return missingBinding;
  }
  return model.resolveProperty(propertyName(value.property));
};

const relationMeaning = (binding: Extract<ResolvedPropertyBinding, { readonly kind: 'relation' }>): ResourceFieldMeaning => {
  const projection: ResourceRelationProjection = {
    kind: 'resource',
    resource: resourceReference(binding.source.targetModel.value.value),
    targetModel: modelReference(binding.source.targetModel.value),
    cardinality: binding.source.cardinality,
    multiplicity: binding.source.multiplicity,
    targetShape: binding.source.targetShape,
    traversalTarget: binding.source.traversalTarget,
  };
  return {
    kind: 'relation_projection',
    relation: { kind: 'property_reference', name: binding.propertyName },
    projection,
  };
};

const meaning = (binding: Lookup<ResolvedPropertyBinding>, expression: Expression, model: OriginModelSymbol): ResourceFieldMeaning =>
  matchLookup(binding, {
    missing: () => ({ kind: 'computed_projection', expression }),
    found: ({ value }) => {
      if (value.kind === 'relation') {
        return relationMeaning(value);
      }
      return { kind: 'property_projection', property: { kind: 'property_reference', name: value.propertyName }, model: modelReference(model.name.value) };
    },
  });

const fieldType = (binding: Lookup<ResolvedPropertyBinding>): TypeExpression =>
  matchLookup(binding, {
    missing: () => ({ kind: 'mixed' }),
    found: ({ value }) => {
      if (value.kind === 'accessor') {
        return value.source.traversal.semanticType;
      }
      return value.source.semanticType;
    },
  });


const outputShape = (value: PhpAstValue): ResourceFieldOutputShapeJudgment => {
  if (value.kind === 'resource_single') {
    return { kind: 'resource', resourceName: stringValue(value.resourceName) };
  }
  if (value.kind === 'resource_collection') {
    return { kind: 'resource_collection', resourceName: stringValue(value.resourceName) };
  }
  if (value.kind === 'nested_array') {
    return { kind: 'nested_object' };
  }
  return { kind: 'scalar_or_expression' };
};

const judge = (input: ResourceFieldSemanticAuthorityInput<PhpAstValue, OriginModelSymbol>): ResourceFieldSemanticJudgment => {
  const binding = propertyBinding(input.value, input.model);
  return Object.freeze({
    kind: 'resource_field_semantic_judgment',
    meaning: meaning(binding, input.expression, input.model),
    type: fieldType(binding),
    outputShape: outputShape(input.value),
  });
};

export const resourceFieldSemanticAuthority: ResourceFieldSemanticAuthorityInterface<PhpAstValue, OriginModelSymbol> = Object.freeze({
  kind: 'resource_field_semantic_authority',
  contractVersion: 1,
  judge,
});
