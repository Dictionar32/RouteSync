/**
 * Canonical scanned resource-field descriptor.
 * Semantic state is an immutable structural witness; construction is exposed
 * through a relation-style catalog rather than a class constructor.
 */
import type { ResourceFieldDescriptor, ResourceFieldExpression } from '../../../../types/domain/expressions';
import type { SemanticType } from '../../../types/SemanticType';
import { toCamelCase } from '../../../../utils/resource-naming';
import { SemanticValueFactory, type PropertyName, type ResponseFieldName } from '../../../../types/domain/semanticValues';
import type { BoundSemanticNode } from '../../../../types/domain/boundAst';
import { createResourceFieldSemantic, requireResourceFieldType, type ResourceFieldSemantic } from '../../../../types/domain/resourceFieldSemantic';

export interface ScannedResourceFieldParams {
  readonly name: ResponseFieldName;
  readonly propertyName: PropertyName;
  readonly expression: ResourceFieldExpression;
  readonly semantic: ResourceFieldSemantic;
}

export type ScannedResourceFieldDescriptor = ResourceFieldDescriptor & {
  readonly semantic: ResourceFieldSemantic;
  readonly semanticType: SemanticType;
  readonly boundAst: BoundSemanticNode;
};

const createResourceFieldDescriptor = (params: ScannedResourceFieldParams): ScannedResourceFieldDescriptor => Object.freeze({
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

export const ScannedResourceFieldDescriptor = Object.freeze({
  fromExpression(
    name: string,
    expression: ResourceFieldExpression,
    semanticType: SemanticType,
    propertyName: string = toCamelCase(name),
    boundAst: BoundSemanticNode,
  ): ScannedResourceFieldDescriptor {
    return createResourceFieldDescriptor({
      name: SemanticValueFactory.responseFieldName(name),
      propertyName: SemanticValueFactory.propertyName(propertyName),
      expression,
      semantic: createResourceFieldSemantic(semanticType, boundAst),
    });
  },
  create(params: ScannedResourceFieldParams): ScannedResourceFieldDescriptor {
    return createResourceFieldDescriptor(params);
  },
});
