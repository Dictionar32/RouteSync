/**
 * Canonical semantic resource-field binding.
 * Scanner evidence is converted once into this closed semantic boundary;
 * downstream stages consume the binding rather than a parsed descriptor.
 */
import type { ResourceFieldExpression } from '../../../types/domain/expressions';
import type { SemanticType } from '../../types/SemanticType';
import { toCamelCase } from '../../../utils/resource-naming';
import { SemanticValueFactory, type PropertyName, type ResponseFieldName } from '../../../types/domain/semanticValues';
import type { BoundSemanticNode } from '../../../types/domain/boundAst';
import { createResourceFieldSemantic, requireResourceFieldType, type ResourceFieldSemantic } from '../../../types/domain/resourceFieldSemantic';

export interface ResourceFieldSemanticBindingInput {
  readonly name: ResponseFieldName;
  readonly propertyName: PropertyName;
  readonly expression: ResourceFieldExpression;
  readonly semantic: ResourceFieldSemantic;
}

export interface ResourceFieldSemanticBinding {
  readonly name: ResponseFieldName;
  readonly propertyName: PropertyName;
  readonly expression: ResourceFieldExpression;
  readonly semantic: ResourceFieldSemantic;
  readonly semanticType: SemanticType;
  readonly boundAst: BoundSemanticNode;
}


const createResourceFieldBinding = (params: ResourceFieldSemanticBindingInput): ResourceFieldSemanticBinding => Object.freeze({
  name: params.name,
  propertyName: params.propertyName,
  expression: params.expression,
  semantic: params.semantic,
  get semanticType(): SemanticType {
    return requireResourceFieldType(params.semantic);
  },
  get boundAst(): BoundSemanticNode {
    return params.semantic.bound;
  },
});

export const ResourceFieldSemanticBinding = Object.freeze({
  fromExpression(
    name: string,
    expression: ResourceFieldExpression,
    semanticType: SemanticType,
    propertyName: string = toCamelCase(name),
    boundAst: BoundSemanticNode,
  ): ResourceFieldSemanticBinding {
    return createResourceFieldBinding({
      name: SemanticValueFactory.responseFieldName(name),
      propertyName: SemanticValueFactory.propertyName(propertyName),
      expression,
      semantic: createResourceFieldSemantic(semanticType, boundAst),
    });
  },
  create(params: ResourceFieldSemanticBindingInput): ResourceFieldSemanticBinding {
    return createResourceFieldBinding(params);
  },
});
