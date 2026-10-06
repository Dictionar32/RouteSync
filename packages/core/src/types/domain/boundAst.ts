/**
 * Bound Laravel semantic AST.
 *
 * This layer carries resolved meaning, not parser text.  Every variant has a
 * closed discriminator and every semantic result is a first-class SemanticType.
 * Runtime uncertainty is represented explicitly by `unsupported`, never by
 * free-form `unknown` payloads.
 */
import type { DatabaseType } from '../upstream/databaseVocabulary';
import type { SemanticType } from './semanticType';
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
import type { EloquentRelationType } from './eloquentTypes';
import type { QueryProjectionSurface } from './semanticResolution';
import { relationEqual, relationOptionFold, relationRefine } from '../../semantic/foundation/semanticRelations';

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
  | { readonly kind: 'collection' }
  | { readonly kind: 'paginated_collection' };

export type BoundNullability =
  | { readonly kind: 'non_nullable' }
  | { readonly kind: 'nullable' };

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
  readonly dbType: DatabaseType;
  readonly castType: BoundCastType;
  readonly semanticType: SemanticType;
}

export interface BoundRelationNode {
  readonly kind: 'bound_relation';
  readonly sourceModel: ModelName;
  readonly relationName: RelationName;
  readonly relationType: EloquentRelationType;
  readonly targetModel: ModelName;
  readonly cardinality: BoundCardinality;
  readonly nullability: BoundNullability;
  readonly semanticType: SemanticType;
}

export type BoundConditionalAvailability =
  | { readonly kind: 'always_present' }
  | { readonly kind: 'present_when_loaded'; readonly relation: RelationName }
  | { readonly kind: 'present_when_condition'; readonly condition: ConditionExpression };

export interface BoundConditionalAvailabilityVisitor<R> {
  readonly always_present: (availability: Extract<BoundConditionalAvailability, { readonly kind: 'always_present' }>) => R;
  readonly present_when_loaded: (availability: Extract<BoundConditionalAvailability, { readonly kind: 'present_when_loaded' }>) => R;
  readonly present_when_condition: (availability: Extract<BoundConditionalAvailability, { readonly kind: 'present_when_condition' }>) => R;
}

const isAlwaysPresent = (availability: BoundConditionalAvailability): availability is Extract<BoundConditionalAvailability, { readonly kind: 'always_present' }> =>
  relationEqual(availability.kind, 'always_present');

const isPresentWhenLoaded = (availability: BoundConditionalAvailability): availability is Extract<BoundConditionalAvailability, { readonly kind: 'present_when_loaded' }> =>
  relationEqual(availability.kind, 'present_when_loaded');

const isPresentWhenCondition = (availability: BoundConditionalAvailability): availability is Extract<BoundConditionalAvailability, { readonly kind: 'present_when_condition' }> =>
  relationEqual(availability.kind, 'present_when_condition');

export function matchBoundConditionalAvailability<R>(
  availability: BoundConditionalAvailability,
  visitor: BoundConditionalAvailabilityVisitor<R>,
): R {
  return relationOptionFold(
    relationRefine(availability, isAlwaysPresent),
    () => relationOptionFold(
      relationRefine(availability, isPresentWhenLoaded),
      () => visitor.present_when_condition(relationOptionFold(relationRefine(availability, isPresentWhenCondition), () => { throw Error('Conditional availability witness is not condition'); }, condition => condition)),
      loaded => visitor.present_when_loaded(loaded),
    ),
    always => visitor.always_present(always),
  );
}

export type BoundPropertyStepKind =
  | { readonly kind: 'column' }
  | { readonly kind: 'accessor' }
  | { readonly kind: 'relation'; readonly cardinality: BoundCardinality };

export type BoundStepEdge =
  | {
      readonly kind: 'property';
      readonly sourceModel: ModelName;
      readonly property: PropertyName;
      readonly step: BoundPropertyStepKind;
      readonly nullsafe: boolean;
      readonly stepType: SemanticType;
      readonly targetModel: BoundTargetModel;
    }
  | {
      readonly kind: 'method';
      readonly sourceModel: ModelName;
      readonly method: MethodName;
      readonly cardinality: BoundCardinality;
      readonly nullsafe: boolean;
      readonly stepType: SemanticType;
      readonly targetModel: BoundTargetModel;
    };

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
  readonly availability: BoundConditionalAvailability;
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
  readonly branches: { readonly kind: 'then_else'; readonly whenTrue: BoundSemanticNode; readonly whenFalse: BoundSemanticNode };
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
  readonly surface: QueryProjectionSurface;
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

const isBoundUnsupported = (node: BoundSemanticNode): node is BoundUnsupportedNode =>
  relationEqual(node.kind, 'bound_unsupported');

const boundSemanticPredicates = Object.freeze({
  primitive: (node: BoundSemanticNode): node is BoundPrimitiveNode => relationEqual(node.kind, 'bound_primitive'),
  modelReference: (node: BoundSemanticNode): node is BoundModelReferenceNode => relationEqual(node.kind, 'bound_model_reference'),
  resourceReference: (node: BoundSemanticNode): node is BoundResourceReferenceNode => relationEqual(node.kind, 'bound_resource_reference'),
  modelColumn: (node: BoundSemanticNode): node is BoundModelColumnNode => relationEqual(node.kind, 'bound_model_column'),
  relation: (node: BoundSemanticNode): node is BoundRelationNode => relationEqual(node.kind, 'bound_relation'),
  propertyChain: (node: BoundSemanticNode): node is BoundPropertyChainNode => relationEqual(node.kind, 'bound_property_chain'),
  conditional: (node: BoundSemanticNode): node is BoundConditionalNode => relationEqual(node.kind, 'bound_conditional'),
  binary: (node: BoundSemanticNode): node is BoundBinaryNode => relationEqual(node.kind, 'bound_binary'),
  ternary: (node: BoundSemanticNode): node is BoundTernaryNode => relationEqual(node.kind, 'bound_ternary'),
  methodCall: (node: BoundSemanticNode): node is BoundMethodCallNode => relationEqual(node.kind, 'bound_method_call'),
  queryProjection: (node: BoundSemanticNode): node is BoundQueryProjectionNode => relationEqual(node.kind, 'bound_query_projection'),
  projectionField: (node: BoundSemanticNode): node is BoundProjectionFieldNode => relationEqual(node.kind, 'bound_projection_field'),
});

export const matchBoundSemantic = <R>(
  node: BoundSemanticNode,
  visitor: BoundSemanticVisitor<R>,
): R =>
  relationOptionFold(relationRefine(node, boundSemanticPredicates.primitive), () =>
    relationOptionFold(relationRefine(node, boundSemanticPredicates.modelReference), () =>
      relationOptionFold(relationRefine(node, boundSemanticPredicates.resourceReference), () =>
        relationOptionFold(relationRefine(node, boundSemanticPredicates.modelColumn), () =>
          relationOptionFold(relationRefine(node, boundSemanticPredicates.relation), () =>
            relationOptionFold(relationRefine(node, boundSemanticPredicates.propertyChain), () =>
              relationOptionFold(relationRefine(node, boundSemanticPredicates.conditional), () =>
                relationOptionFold(relationRefine(node, boundSemanticPredicates.binary), () =>
                  relationOptionFold(relationRefine(node, boundSemanticPredicates.ternary), () =>
                    relationOptionFold(relationRefine(node, boundSemanticPredicates.methodCall), () =>
                      relationOptionFold(relationRefine(node, boundSemanticPredicates.queryProjection), () =>
                        relationOptionFold(relationRefine(node, boundSemanticPredicates.projectionField), () =>
                          visitor.bound_unsupported(relationOptionFold(relationRefine(node, isBoundUnsupported), () => { throw Error('Bound semantic witness is not unsupported'); }, unsupported => unsupported)),
                          visitor.bound_projection_field,
                        ),
                        visitor.bound_query_projection,
                      ),
                      visitor.bound_method_call,
                    ),
                    visitor.bound_ternary,
                  ),
                  visitor.bound_binary,
                ),
                visitor.bound_conditional,
              ),
              visitor.bound_property_chain,
            ),
            visitor.bound_relation,
          ),
          visitor.bound_model_column,
        ),
        visitor.bound_resource_reference,
      ),
      visitor.bound_model_reference,
    ),
    visitor.bound_primitive,
  );



export const BoundSemanticFactory = Object.freeze({
  modelReference(model: ModelName): BoundModelReferenceNode {
    return Object.freeze({ kind: 'bound_model_reference', model });
  },

  resourceReference(resource: ResourceName): BoundResourceReferenceNode {
    return Object.freeze({ kind: 'bound_resource_reference', resource });
  },

  primitive(
    semanticType: SemanticType,
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
    readonly dbType: DatabaseType;
    readonly castType: BoundCastType;
    readonly semanticType: SemanticType;
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
    readonly semanticType: SemanticType;
  }): BoundRelationNode {
    return Object.freeze({
      kind: 'bound_relation' as const,
      sourceModel: params.sourceModel,
      relationName: params.relationName,
      relationType: params.relationType,
      targetModel: params.targetModel,
      cardinality: params.cardinality,
      nullability: params.nullability,
      semanticType: params.semanticType,
    });
  },

  propertyChain(params: {
    readonly rootModel: ModelName;
    readonly steps: readonly BoundStepEdge[];
    readonly resultingType: SemanticType;
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
    readonly availability: BoundConditionalAvailability;
    readonly semanticType: SemanticType;
  }): BoundConditionalNode {
    return Object.freeze({
      kind: 'bound_conditional',
      wrapper: params.wrapper,
      conditionExpression: params.conditionExpression,
      target: params.target,
      relationModel: params.relationModel,
      availability: params.availability,
      semanticType: params.semanticType,
    });
  },

  binary(params: {
    readonly operator: SemanticOperator;
    readonly left: BoundSemanticNode;
    readonly right: BoundSemanticNode;
    readonly resultingType: SemanticType;
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
    readonly branches: { readonly kind: 'then_else'; readonly whenTrue: BoundSemanticNode; readonly whenFalse: BoundSemanticNode };
    readonly resultingType: SemanticType;
  }): BoundTernaryNode {
    return Object.freeze({
      kind: 'bound_ternary',
      conditionExpression: params.conditionExpression,
      branches: params.branches,
      resultingType: params.resultingType,
    });
  },

  projectionField(params: {
    readonly sourceModel: ModelName;
    readonly field: ResponseFieldName;
    readonly semanticType: SemanticType;
  }): BoundProjectionFieldNode {
    return Object.freeze({ kind: 'bound_projection_field', ...params });
  },
  queryProjection(params: {
    readonly sourceModel: ModelName;
    readonly surface: QueryProjectionSurface;
    readonly cardinality: BoundCardinality;
    readonly nullability: BoundNullability;
  }): BoundQueryProjectionNode {
    return Object.freeze({
      kind: 'bound_query_projection',
      sourceModel: params.sourceModel,
      surface: params.surface,
      cardinality: params.cardinality,
      nullability: params.nullability,
    });
  },
  methodCall(params: {
    readonly targetModel: BoundTargetModel;
    readonly methodName: MethodName;
    readonly returnType: SemanticType;
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
