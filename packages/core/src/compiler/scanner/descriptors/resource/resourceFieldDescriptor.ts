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
import { PrimitiveKind } from '../../../types/SemanticType';
import { toCamelCase } from '../../../../utils/resource-naming';
import type { BoundSemanticNode } from '../../../../types/domain/boundAst';

export interface ScannedResourceFieldParams {
  readonly name: string;
  readonly propertyName: string;
  readonly expression: ResourceFieldExpression;
  readonly semanticType: PrimitiveKind;
  readonly nullable: boolean;
  readonly boundAst?: BoundSemanticNode;
}

export class ScannedResourceFieldDescriptor implements ResourceFieldDescriptor {
  public readonly name: string;
  public readonly propertyName: string;
  public readonly expression: ResourceFieldExpression;
  public readonly semanticType: PrimitiveKind;
  public readonly nullable: boolean;
  public readonly boundAst?: BoundSemanticNode;

  constructor({
    name,
    propertyName,
    expression,
    semanticType,
    nullable,
    boundAst
  }: ScannedResourceFieldParams) {
    this.name = name;
    this.propertyName = propertyName;
    this.expression = expression;
    this.semanticType = semanticType;
    this.nullable = nullable;
    this.boundAst = boundAst;
    Object.freeze(this);
  }

  public static fromExpression(
    name: string,
    expression: ResourceFieldExpression,
    nullable: boolean = false,
    propertyName: string = toCamelCase(name),
    semanticType?: PrimitiveKind,
    boundAst?: BoundSemanticNode
  ): ScannedResourceFieldDescriptor {
    const resolvedSemanticType = semanticType ?? (
      expression.kind === 'primitive' && (Object.values(PrimitiveKind) as string[]).includes(expression.type)
        ? (expression.type as PrimitiveKind)
        : PrimitiveKind.STRING
    );
    return new ScannedResourceFieldDescriptor({
      name,
      propertyName,
      expression,
      semanticType: resolvedSemanticType,
      nullable,
      boundAst
    });
  }

  public static create({
    name,
    expression,
    nullable = false,
    propertyName = toCamelCase(name),
    semanticType,
    boundAst
  }: {
    readonly name: string;
    readonly expression: ResourceFieldExpression;
    readonly nullable?: boolean;
    readonly propertyName?: string;
    readonly semanticType?: PrimitiveKind;
    readonly boundAst?: BoundSemanticNode;
  }): ScannedResourceFieldDescriptor {
    return ScannedResourceFieldDescriptor.fromExpression(name, expression, nullable, propertyName, semanticType, boundAst);
  }
}
