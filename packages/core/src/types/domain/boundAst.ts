/**
 * Bound Laravel semantic AST.
 *
 * This layer carries resolved meaning, not parser text.  Every variant has a
 * closed discriminator and every semantic result is a first-class SemanticType.
 * Runtime uncertainty is represented explicitly by `unsupported`, never by
 * free-form `unknown` payloads.
 */
import type { SemanticType } from '../../compiler/types/SemanticType';
import type {
  BoundLiteralValue,
  BoundCastType,
  BoundTargetModel,
  CastTypeName,
  ColumnName,
  ConditionExpression,
  DatabaseTypeName,
  MethodName,
  ModelName,
  ResourceName,
  PropertyName,
  ResponseFieldName,
  RelationName,
  SemanticOperator,
} from './semanticValues';
import type { SemanticType as CompilerSemanticType } from '../../compiler/types/SemanticType';
import type { EloquentRelationType } from './eloquentTypes';

export type BoundSemanticKind =
  | 'bound_primitive'
  | 'bound_model_reference'
  | 'bound_resource_reference'
  | 'bound_model_column'
  | 'bound_relation'
  | 'bound_property_chain'
  | 'bound_conditional'
  | 'bound_binary'
  | 'bound_ternary'
  | 'bound_method_call'
  | 'bound_query_projection'
  | 'bound_projection_field'
  | 'bound_unsupported';

export type BoundCardinality =
  | { readonly kind: 'single' }
  | { readonly kind: 'collection' };

export type BoundNullability =
  | { readonly kind: 'non_nullable' }
  | { readonly kind: 'nullable' };

export type BoundRelationKind =
  | 'belongs_to'
  | 'has_one'
  | 'has_many'
  | 'belongs_to_many'
  | 'has_one_through'
  | 'has_many_through'
  | 'morph_to'
  | 'morph_one'
  | 'morph_many'
  | 'morph_to_many'
  | 'morphed_by_many';

export type BoundUnsupportedReason =
  | 'parser_gap'
  | 'unsupported_syntax'
  | 'unresolved_symbol'
  | 'unresolved_property'
  | 'unresolved_relation'
  | 'unresolved_method'
  | 'invalid_boundary_input';

export interface BoundPrimitiveNode {
  readonly kind: 'bound_primitive';
  readonly semanticType: SemanticType;
  readonly value: BoundLiteralValue;
}

export interface BoundModelReferenceNode {
  readonly kind: 'bound_model_reference';
  readonly model: ModelName;
}

export interface BoundResourceReferenceNode {
  readonly kind: 'bound_resource_reference';
  readonly resource: ResourceName;
}

export interface BoundModelColumnNode {
  readonly kind: 'bound_model_column';
  readonly model: ModelName;
  readonly column: ColumnName;
  readonly dbType: DatabaseTypeName;
  readonly castType: BoundCastType;
  readonly semanticType: SemanticType;
}

export interface BoundRelationNode {
  readonly kind: 'bound_relation';
  readonly sourceModel: ModelName;
  readonly relationName: RelationName;
  readonly relationType: BoundRelationKind;
  readonly targetModel: ModelName;
  readonly cardinality: BoundCardinality;
  readonly nullability: BoundNullability;
}

export interface BoundStepEdge {
  readonly property: PropertyName;
  readonly nullsafe: boolean;
  readonly stepType: SemanticType;
  readonly targetModel: BoundTargetModel;
}

export interface BoundPropertyChainNode {
  readonly kind: 'bound_property_chain';
  readonly rootModel: ModelName;
  readonly steps: readonly BoundStepEdge[];
  readonly nullability: BoundNullability;
  readonly resultingType: SemanticType;
}

export type ConditionalWrapperKind = 'whenLoaded' | 'when' | 'mergeWhen';

export interface BoundConditionalNode {
  readonly kind: 'bound_conditional';
  readonly wrapper: ConditionalWrapperKind;
  readonly conditionExpression: ConditionExpression;
  readonly target: BoundSemanticNode;
  readonly relationModel: BoundTargetModel;
  readonly isOptional: boolean;
  readonly semanticType: SemanticType;
}

export interface BoundBinaryNode {
  readonly kind: 'bound_binary';
  readonly operator: SemanticOperator;
  readonly left: BoundSemanticNode;
  readonly right: BoundSemanticNode;
  readonly resultingType: SemanticType;
}

export interface BoundTernaryNode {
  readonly kind: 'bound_ternary';
  readonly conditionExpression: ConditionExpression;
  readonly truthy: BoundSemanticNode;
  readonly falsy: BoundSemanticNode;
  readonly resultingType: SemanticType;
}

export interface BoundMethodCallNode {
  readonly kind: 'bound_method_call';
  readonly targetModel: BoundTargetModel;
  readonly methodName: MethodName;
  readonly returnType: SemanticType;
  readonly cardinality: BoundCardinality;
  readonly nullability: BoundNullability;
}

export interface BoundQueryProjectionNode {
  readonly kind: 'bound_query_projection';
  readonly sourceModel: ModelName;
  readonly fields: readonly (readonly [ResponseFieldName, SemanticType])[];
  readonly cardinality: BoundCardinality;
  readonly nullability: BoundNullability;
}

export interface BoundProjectionFieldNode {
  readonly kind: 'bound_projection_field';
  readonly sourceModel: ModelName;
  readonly field: ResponseFieldName;
  readonly semanticType: SemanticType;
}

export interface BoundUnsupportedNode {
  readonly kind: 'bound_unsupported';
  readonly reason: BoundUnsupportedReason;
}

export type BoundSemanticNode =
  | BoundPrimitiveNode
  | BoundModelReferenceNode
  | BoundResourceReferenceNode
  | BoundModelColumnNode
  | BoundRelationNode
  | BoundPropertyChainNode
  | BoundConditionalNode
  | BoundBinaryNode
  | BoundTernaryNode
  | BoundMethodCallNode
  | BoundQueryProjectionNode
  | BoundProjectionFieldNode
  | BoundUnsupportedNode;

export interface BoundSemanticVisitor<R> {
  readonly bound_model_reference: (node: BoundModelReferenceNode) => R;
  readonly bound_resource_reference: (node: BoundResourceReferenceNode) => R;
  readonly bound_primitive: (node: BoundPrimitiveNode) => R;
  readonly bound_model_column: (node: BoundModelColumnNode) => R;
  readonly bound_relation: (node: BoundRelationNode) => R;
  readonly bound_property_chain: (node: BoundPropertyChainNode) => R;
  readonly bound_conditional: (node: BoundConditionalNode) => R;
  readonly bound_binary: (node: BoundBinaryNode) => R;
  readonly bound_ternary: (node: BoundTernaryNode) => R;
  readonly bound_method_call: (node: BoundMethodCallNode) => R;
  readonly bound_query_projection: (node: BoundQueryProjectionNode) => R;
  readonly bound_projection_field: (node: BoundProjectionFieldNode) => R;
  readonly bound_unsupported: (node: BoundUnsupportedNode) => R;
}

export const matchBoundSemantic = <R>(
  node: BoundSemanticNode,
  visitor: BoundSemanticVisitor<R>,
): R => {
  switch (node.kind) {
    case 'bound_primitive': return visitor.bound_primitive(node);
    case 'bound_model_reference': return visitor.bound_model_reference(node);
    case 'bound_resource_reference': return visitor.bound_resource_reference(node);
    case 'bound_model_column': return visitor.bound_model_column(node);
    case 'bound_relation': return visitor.bound_relation(node);
    case 'bound_property_chain': return visitor.bound_property_chain(node);
    case 'bound_conditional': return visitor.bound_conditional(node);
    case 'bound_binary': return visitor.bound_binary(node);
    case 'bound_ternary': return visitor.bound_ternary(node);
    case 'bound_method_call': return visitor.bound_method_call(node);
    case 'bound_query_projection': return visitor.bound_query_projection(node);
    case 'bound_projection_field': return visitor.bound_projection_field(node);
    case 'bound_unsupported': return visitor.bound_unsupported(node);
  }
};

/** Compatibility alias kept at the public domain boundary during migration. */
export const matchBoundSemanticNode = matchBoundSemantic;

/** Legacy export name retained as a type alias; the canonical node is BoundUnsupportedNode. */
export type BoundUnknownNode = BoundUnsupportedNode;

function toBoundRelationKind(type: EloquentRelationType): BoundRelationKind {
  switch (type) {
    case 'belongsTo': return 'belongs_to';
    case 'hasOne': return 'has_one';
    case 'hasMany': return 'has_many';
    case 'belongsToMany': return 'belongs_to_many';
    case 'hasOneThrough': return 'has_one_through';
    case 'hasManyThrough': return 'has_many_through';
    case 'morphTo': return 'morph_to';
    case 'morphOne': return 'morph_one';
    case 'morphMany': return 'morph_many';
    case 'morphToMany': return 'morph_to_many';
    case 'morphedByMany': return 'morphed_by_many';
  }
}

export const BoundSemanticFactory = Object.freeze({
  modelReference(model: ModelName): BoundModelReferenceNode {
    return Object.freeze({ kind: 'bound_model_reference', model });
  },

  resourceReference(resource: ResourceName): BoundResourceReferenceNode {
    return Object.freeze({ kind: 'bound_resource_reference', resource });
  },

  primitive(
    semanticType: CompilerSemanticType,
    value: BoundLiteralValue,
  ): BoundPrimitiveNode {
    return Object.freeze({
      kind: 'bound_primitive',
      semanticType,
      value,
    });
  },

  modelColumn(params: {
    readonly model: ModelName;
    readonly column: ColumnName;
    readonly dbType: DatabaseTypeName;
    readonly castType: BoundCastType;
    readonly semanticType: CompilerSemanticType;
  }): BoundModelColumnNode {
    return Object.freeze({
      kind: 'bound_model_column',
      model: params.model,
      column: params.column,
      dbType: params.dbType,
      castType: params.castType,
      semanticType: params.semanticType,
    });
  },

  relation(params: {
    readonly sourceModel: ModelName;
    readonly relationName: RelationName;
    readonly relationType: EloquentRelationType;
    readonly targetModel: ModelName;
    readonly cardinality: BoundCardinality;
    readonly nullability: BoundNullability;
  }): BoundRelationNode {
    return Object.freeze({
      kind: 'bound_relation' as const,
      sourceModel: params.sourceModel,
      relationName: params.relationName,
      relationType: toBoundRelationKind(params.relationType),
      targetModel: params.targetModel,
      cardinality: params.cardinality,
      nullability: params.nullability,
    });
  },

  propertyChain(params: {
    readonly rootModel: ModelName;
    readonly steps: readonly BoundStepEdge[];
    readonly resultingType: CompilerSemanticType;
    readonly nullability: BoundNullability;
  }): BoundPropertyChainNode {
    return Object.freeze({
      kind: 'bound_property_chain',
      rootModel: params.rootModel,
      steps: Object.freeze([...params.steps]),
      nullability: params.nullability,
      resultingType: params.resultingType,
    });
  },

  conditional(params: {
    readonly wrapper: ConditionalWrapperKind;
    readonly conditionExpression: ConditionExpression;
    readonly target: BoundSemanticNode;
    readonly relationModel: BoundTargetModel;
    readonly isOptional: boolean;
    readonly semanticType: CompilerSemanticType;
  }): BoundConditionalNode {
    return Object.freeze({
      kind: 'bound_conditional',
      wrapper: params.wrapper,
      conditionExpression: params.conditionExpression,
      target: params.target,
      relationModel: params.relationModel,
      isOptional: params.isOptional,
      semanticType: params.semanticType,
    });
  },

  binary(params: {
    readonly operator: SemanticOperator;
    readonly left: BoundSemanticNode;
    readonly right: BoundSemanticNode;
    readonly resultingType: CompilerSemanticType;
  }): BoundBinaryNode {
    return Object.freeze({
      kind: 'bound_binary',
      operator: params.operator,
      left: params.left,
      right: params.right,
      resultingType: params.resultingType,
    });
  },

  ternary(params: {
    readonly conditionExpression: ConditionExpression;
    readonly truthy: BoundSemanticNode;
    readonly falsy: BoundSemanticNode;
    readonly resultingType: CompilerSemanticType;
  }): BoundTernaryNode {
    return Object.freeze({
      kind: 'bound_ternary',
      conditionExpression: params.conditionExpression,
      truthy: params.truthy,
      falsy: params.falsy,
      resultingType: params.resultingType,
    });
  },

  projectionField(params: {
    readonly sourceModel: ModelName;
    readonly field: ResponseFieldName;
    readonly semanticType: CompilerSemanticType;
  }): BoundProjectionFieldNode {
    return Object.freeze({ kind: 'bound_projection_field', ...params });
  },
  queryProjection(params: {
    readonly sourceModel: ModelName;
    readonly fields: readonly (readonly [ResponseFieldName, SemanticType])[];
    readonly cardinality: BoundCardinality;
    readonly nullability: BoundNullability;
  }): BoundQueryProjectionNode {
    return Object.freeze({
      kind: 'bound_query_projection',
      sourceModel: params.sourceModel,
      fields: params.fields,
      cardinality: params.cardinality,
      nullability: params.nullability,
    });
  },
  methodCall(params: {
    readonly targetModel: BoundTargetModel;
    readonly methodName: MethodName;
    readonly returnType: CompilerSemanticType;
    readonly cardinality: BoundCardinality;
    readonly nullability: BoundNullability;
  }): BoundMethodCallNode {
    return Object.freeze({
      kind: 'bound_method_call',
      targetModel: params.targetModel,
      methodName: params.methodName,
      returnType: params.returnType,
      cardinality: params.cardinality,
      nullability: params.nullability,
    });
  },

  unsupported(reason: BoundUnsupportedReason): BoundUnsupportedNode {
    return Object.freeze({ kind: 'bound_unsupported', reason });
  },
});
