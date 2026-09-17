/**
 * resourceFieldDescriptor.ts
 *
 * ScannedResourceFieldDescriptor implementation and factories.
 *
 * @module core/compiler/scanner/descriptors/resource
 */

import type {
  ResourceFieldDescriptor,
  ResourceFieldExpression
} from '../../../../types/route';
import type { SemanticType } from '../../../types/SemanticType';
import { toCamelCase } from '../../../../utils/resource-naming';

import type { BoundSemanticNode } from '../../../../types/domain/boundAst';

export interface ScannedResourceFieldParams {
  readonly name: string;
  readonly propertyName: string;
  readonly expression: ResourceFieldExpression;
  readonly semanticType: SemanticType;
  readonly boundAst?: BoundSemanticNode;
}

export class ScannedResourceFieldDescriptor implements ResourceFieldDescriptor {
  public readonly name: string;
  public readonly propertyName: string;
  public readonly expression: ResourceFieldExpression;
  public readonly semanticType: SemanticType;
  public readonly boundAst?: BoundSemanticNode;

  constructor({
    name,
    propertyName,
    expression,
    semanticType,
    boundAst
  }: ScannedResourceFieldParams) {
    this.name = name;
    this.propertyName = propertyName;
    this.expression = expression;
    this.semanticType = semanticType;
    this.boundAst = boundAst;
    Object.freeze(this);
  }

  public static fromExpression(
    name: string,
    expression: ResourceFieldExpression,
    semanticType: SemanticType,
    propertyName: string = toCamelCase(name),
    boundAst?: BoundSemanticNode
  ): ScannedResourceFieldDescriptor {
    return new ScannedResourceFieldDescriptor({
      name,
      propertyName,
      expression,
      semanticType,
      boundAst
    });
  }

  public static create({
    name,
    expression,
    propertyName = toCamelCase(name),
    semanticType,
    boundAst
  }: {
    readonly name: string;
    readonly expression: ResourceFieldExpression;
    readonly propertyName?: string;
    readonly semanticType: SemanticType;
    readonly boundAst?: BoundSemanticNode;
  }): ScannedResourceFieldDescriptor {
    return ScannedResourceFieldDescriptor.fromExpression(
      name, expression, semanticType, propertyName, boundAst
    );
  }
}
