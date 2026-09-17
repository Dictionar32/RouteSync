/**
 * Canonical scanned resource-field descriptor.
 * The public domain contract has one semantic boundary: `semantic`.
 * Legacy accessors are derived views and do not store duplicate state.
 */
import type { ResourceFieldDescriptor, ResourceFieldExpression } from '../../../../types/domain/expressions';
import type { SemanticType } from '../../../types/SemanticType';
import { toCamelCase } from '../../../../utils/resource-naming';
import type { BoundSemanticNode } from '../../../../types/domain/boundAst';
import { createResourceFieldSemantic, requireResourceFieldType, type ResourceFieldSemantic } from '../../../../types/domain/resourceFieldSemantic';

export interface ScannedResourceFieldParams {
  readonly name: string;
  readonly propertyName: string;
  readonly expression: ResourceFieldExpression;
  readonly semantic: ResourceFieldSemantic;
}

export class ScannedResourceFieldDescriptor implements ResourceFieldDescriptor {
  public readonly name: ResourceFieldDescriptor['name'];
  public readonly propertyName: ResourceFieldDescriptor['propertyName'];
  public readonly expression: ResourceFieldExpression;
  public readonly semantic: ResourceFieldSemantic;

  constructor({ name, propertyName, expression, semantic }: ScannedResourceFieldParams) {
    this.name = name as ResourceFieldDescriptor['name'];
    this.propertyName = propertyName as ResourceFieldDescriptor['propertyName'];
    this.expression = expression;
    this.semantic = semantic;
    Object.freeze(this);
  }

  /** Transitional derived view. No semantic state is stored here. */
  public get semanticType(): SemanticType {
    return requireResourceFieldType(this.semantic);
  }

  /** Transitional derived view. No binding state is stored here. */
  public get boundAst(): BoundSemanticNode | undefined {
    return this.semantic.kind === 'verified' ? this.semantic.bound : this.semantic.bound;
  }

  public static fromExpression(
    name: string,
    expression: ResourceFieldExpression,
    semanticType: SemanticType,
    propertyName: string = toCamelCase(name),
    boundAst?: BoundSemanticNode,
  ): ScannedResourceFieldDescriptor {
    return new ScannedResourceFieldDescriptor({
      name,
      propertyName,
      expression,
      semantic: createResourceFieldSemantic(semanticType, boundAst),
    });
  }

  public static create(params: ScannedResourceFieldParams): ScannedResourceFieldDescriptor {
    return new ScannedResourceFieldDescriptor(params);
  }
}
