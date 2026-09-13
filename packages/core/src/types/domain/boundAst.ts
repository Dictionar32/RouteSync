/**
 * boundAst.ts
 *
 * Closed Discriminated Union ADT for Resolved Semantic AST (Bound AST).
 * Replaces unstructured string trace logs with typed derivation trees.
 *
 * @module core/types/domain/boundAst
 */

export type BoundSemanticKind =
  | 'bound_primitive'
  | 'bound_model_column'
  | 'bound_relation'
  | 'bound_property_chain'
  | 'bound_conditional'
  | 'bound_binary'
  | 'bound_ternary'
  | 'bound_method_call'
  | 'bound_unknown';

export interface BoundPrimitiveNode {
  readonly kind: 'bound_primitive';
  readonly semanticType: string;
  readonly value: string | number | boolean | null;
  readonly nullable: boolean;
  readonly invalidationTags: readonly string[];
}

export interface BoundModelColumnNode {
  readonly kind: 'bound_model_column';
  readonly model: string;
  readonly column: string;
  readonly dbType: string;
  readonly castType: string | null;
  readonly semanticType: string;
  readonly nullable: boolean;
  readonly invalidationTags: readonly string[];
}

export interface BoundRelationNode {
  readonly kind: 'bound_relation';
  readonly sourceModel: string;
  readonly relationName: string;
  readonly relationType: string;
  readonly targetModel: string;
  readonly isCollection: boolean;
  readonly nullable: boolean;
  readonly invalidationTags: readonly string[];
}

export interface BoundStepEdge {
  readonly property: string;
  readonly nullsafe: boolean;
  readonly stepType: string;
  readonly targetModel: string | null;
}

export interface BoundPropertyChainNode {
  readonly kind: 'bound_property_chain';
  readonly rootModel: string;
  readonly steps: readonly BoundStepEdge[];
  readonly nullsafe: boolean;
  readonly resultingType: string;
  readonly nullable: boolean;
  readonly invalidationTags: readonly string[];
}

export type ConditionalWrapperKind = 'whenLoaded' | 'when' | 'mergeWhen';

export interface BoundConditionalNode {
  readonly kind: 'bound_conditional';
  readonly wrapper: ConditionalWrapperKind;
  readonly conditionExpression: string;
  readonly target: BoundSemanticNode;
  readonly relationModel: string | null;
  readonly isOptional: boolean;
  readonly semanticType: string;
  readonly invalidationTags: readonly string[];
}

export interface BoundBinaryNode {
  readonly kind: 'bound_binary';
  readonly operator: string;
  readonly left: BoundSemanticNode;
  readonly right: BoundSemanticNode;
  readonly resultingType: string;
  readonly nullable: boolean;
  readonly invalidationTags: readonly string[];
}

export interface BoundTernaryNode {
  readonly kind: 'bound_ternary';
  readonly conditionExpression: string;
  readonly truthy: BoundSemanticNode;
  readonly falsy: BoundSemanticNode;
  readonly resultingType: string;
  readonly nullable: boolean;
  readonly invalidationTags: readonly string[];
}

export interface BoundMethodCallNode {
  readonly kind: 'bound_method_call';
  readonly targetModel: string | null;
  readonly methodName: string;
  readonly returnType: string;
  readonly isCollection: boolean;
  readonly nullable: boolean;
  readonly invalidationTags: readonly string[];
}

export interface BoundUnknownNode {
  readonly kind: 'bound_unknown';
  readonly rawExpression: string;
  readonly reason: string;
  readonly semanticType: 'unknown';
  readonly nullable: boolean;
  readonly invalidationTags: readonly string[];
}

export type BoundSemanticNode =
  | BoundPrimitiveNode
  | BoundModelColumnNode
  | BoundRelationNode
  | BoundPropertyChainNode
  | BoundConditionalNode
  | BoundBinaryNode
  | BoundTernaryNode
  | BoundMethodCallNode
  | BoundUnknownNode;

export interface BoundSemanticVisitor<R> {
  readonly bound_primitive: (node: BoundPrimitiveNode) => R;
  readonly bound_model_column: (node: BoundModelColumnNode) => R;
  readonly bound_relation: (node: BoundRelationNode) => R;
  readonly bound_property_chain: (node: BoundPropertyChainNode) => R;
  readonly bound_conditional: (node: BoundConditionalNode) => R;
  readonly bound_binary: (node: BoundBinaryNode) => R;
  readonly bound_ternary: (node: BoundTernaryNode) => R;
  readonly bound_method_call: (node: BoundMethodCallNode) => R;
  readonly bound_unknown: (node: BoundUnknownNode) => R;
}

/**
 * Pure Catamorphic Eliminator for BoundSemanticNode.
 * 0 'if', 0 'switch', O(1) direct dictionary dispatch.
 */
export function matchBoundSemanticNode<R>(
  node: BoundSemanticNode,
  visitor: BoundSemanticVisitor<R>
): R {
  const handler = visitor[node.kind];
  return handler(node as any);
}

/**
 * Static Semantic Factories: Correct-by-Construction node constructors.
 * 0 '?', 100% direct assignment, Object.freeze() guarantee.
 */
export class BoundSemanticFactory {
  public static primitive(
    semanticType: string,
    value: string | number | boolean | null = null,
    nullable: boolean = false
  ): BoundPrimitiveNode {
    return Object.freeze({
      kind: 'bound_primitive',
      semanticType,
      value,
      nullable,
      invalidationTags: Object.freeze([])
    });
  }

  public static modelColumn({
    model,
    column,
    dbType,
    castType = null,
    semanticType,
    nullable = false
  }: {
    readonly model: string;
    readonly column: string;
    readonly dbType: string;
    readonly castType?: string | null;
    readonly semanticType: string;
    readonly nullable?: boolean;
  }): BoundModelColumnNode {
    return Object.freeze({
      kind: 'bound_model_column',
      model,
      column,
      dbType,
      castType: castType !== undefined ? castType : null,
      semanticType,
      nullable,
      invalidationTags: Object.freeze([model])
    });
  }

  public static relation({
    sourceModel,
    relationName,
    relationType,
    targetModel,
    isCollection = false,
    nullable = false
  }: {
    readonly sourceModel: string;
    readonly relationName: string;
    readonly relationType: string;
    readonly targetModel: string;
    readonly isCollection?: boolean;
    readonly nullable?: boolean;
  }): BoundRelationNode {
    return Object.freeze({
      kind: 'bound_relation',
      sourceModel,
      relationName,
      relationType,
      targetModel,
      isCollection,
      nullable,
      invalidationTags: Object.freeze([sourceModel, targetModel])
    });
  }

  public static propertyChain({
    rootModel,
    steps,
    nullsafe = false,
    resultingType,
    nullable = false,
    invalidationTags = []
  }: {
    readonly rootModel: string;
    readonly steps: readonly BoundStepEdge[];
    readonly nullsafe?: boolean;
    readonly resultingType: string;
    readonly nullable?: boolean;
    readonly invalidationTags?: readonly string[];
  }): BoundPropertyChainNode {
    const tags = new Set<string>([rootModel, ...invalidationTags]);
    for (const s of steps) {
      if (s.targetModel) tags.add(s.targetModel);
    }
    return Object.freeze({
      kind: 'bound_property_chain',
      rootModel,
      steps: Object.freeze([...steps]),
      nullsafe,
      resultingType,
      nullable,
      invalidationTags: Object.freeze(Array.from(tags))
    });
  }

  public static conditional({
    wrapper,
    conditionExpression,
    target,
    relationModel = null,
    isOptional = wrapper === 'whenLoaded'
  }: {
    readonly wrapper: ConditionalWrapperKind;
    readonly conditionExpression: string;
    readonly target: BoundSemanticNode;
    readonly relationModel?: string | null;
    readonly isOptional?: boolean;
  }): BoundConditionalNode {
    const tags = new Set<string>(target.invalidationTags);
    if (relationModel) tags.add(relationModel);

    return Object.freeze({
      kind: 'bound_conditional',
      wrapper,
      conditionExpression,
      target,
      relationModel: relationModel !== undefined ? relationModel : null,
      isOptional,
      semanticType: target.kind === 'bound_model_column' || target.kind === 'bound_primitive'
        ? target.semanticType
        : target.kind === 'bound_property_chain'
          ? target.resultingType
          : 'unknown',
      invalidationTags: Object.freeze(Array.from(tags))
    });
  }

  public static binary({
    operator,
    left,
    right,
    resultingType,
    nullable = false
  }: {
    readonly operator: string;
    readonly left: BoundSemanticNode;
    readonly right: BoundSemanticNode;
    readonly resultingType: string;
    readonly nullable?: boolean;
  }): BoundBinaryNode {
    const tags = Array.from(new Set([...left.invalidationTags, ...right.invalidationTags]));
    return Object.freeze({
      kind: 'bound_binary',
      operator,
      left,
      right,
      resultingType,
      nullable,
      invalidationTags: Object.freeze(tags)
    });
  }

  public static ternary({
    conditionExpression,
    truthy,
    falsy,
    resultingType,
    nullable = false
  }: {
    readonly conditionExpression: string;
    readonly truthy: BoundSemanticNode;
    readonly falsy: BoundSemanticNode;
    readonly resultingType: string;
    readonly nullable?: boolean;
  }): BoundTernaryNode {
    const tags = Array.from(new Set([...truthy.invalidationTags, ...falsy.invalidationTags]));
    return Object.freeze({
      kind: 'bound_ternary',
      conditionExpression,
      truthy,
      falsy,
      resultingType,
      nullable,
      invalidationTags: Object.freeze(tags)
    });
  }

  public static methodCall({
    targetModel = null,
    methodName,
    returnType,
    isCollection = false,
    nullable = false
  }: {
    readonly targetModel?: string | null;
    readonly methodName: string;
    readonly returnType: string;
    readonly isCollection?: boolean;
    readonly nullable?: boolean;
  }): BoundMethodCallNode {
    const tags = targetModel ? [targetModel] : [];
    return Object.freeze({
      kind: 'bound_method_call',
      targetModel: targetModel !== undefined ? targetModel : null,
      methodName,
      returnType,
      isCollection,
      nullable,
      invalidationTags: Object.freeze(tags)
    });
  }

  public static unknown(rawExpression: string, reason: string): BoundUnknownNode {
    return Object.freeze({
      kind: 'bound_unknown',
      rawExpression,
      reason,
      semanticType: 'unknown',
      nullable: true,
      invalidationTags: Object.freeze([])
    });
  }
}
