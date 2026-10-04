import type { ModelDefinition } from './model';
import type { ResourceDefinition } from './resource';
import type { RequestDefinition } from './request';
import type { RouteDeclarationAst } from '../../compiler/scanner/lexer/routeAst/routeDeclarationAst';
import type { ControllerMethod } from './controller';
import type { SourceSpan } from './provenance';
import type { StringValue, NumberValue } from './valueObjects';
import type { ServiceDefinition } from './service';
import type { MigrationDefinition } from './migration';
import type { ResponseDefinition } from './response';
import type { DtoDefinition, MiddlewareDefinition, ProviderDefinition, AttributeDefinition } from './application';
import type { SourceAsts } from './collections';
import type { RouteDefinition } from './route';
import type { ChannelDefinition } from './channel';
import type { Expression } from './expression';
import type { ModelName, ResourceName, RequestName, ControllerName, ServiceName, PropertyName, MethodName, ActionName, RouteName, ClassName } from './names';

export const completeSourceProof: unique symbol = Symbol('completeSourceProof');

export type { SchemaAst } from './schema';
export type ExpressionOrigin =
  | { readonly kind: 'model_accessor'; readonly model: ModelName; readonly accessor: PropertyName }
  | { readonly kind: 'resource_field'; readonly resource: ResourceName; readonly field: PropertyName }
  | { readonly kind: 'request_rule'; readonly request: RequestName; readonly field: PropertyName }
  | { readonly kind: 'controller_method'; readonly controller: ControllerName; readonly method: MethodName }
  | { readonly kind: 'controller_action'; readonly controller: ControllerName; readonly action: ActionName }
  | { readonly kind: 'service_method'; readonly service: ServiceName; readonly method: MethodName }
  | { readonly kind: 'route_expression'; readonly route: RouteName }
  | { readonly kind: 'class_member'; readonly owner: ClassName; readonly member: PropertyName };

export type ExpressionSurface =
  | { readonly kind: 'php_literal' }
  | { readonly kind: 'php_resource_reference' }
  | { readonly kind: 'php_variable' }
  | { readonly kind: 'php_magic_constant' }
  | { readonly kind: 'php_constant_reference' }
  | { readonly kind: 'php_property_access' }
  | { readonly kind: 'php_nullsafe_property_access' }
  | { readonly kind: 'php_method_call' }
  | { readonly kind: 'php_nullsafe_method_call' }
  | { readonly kind: 'php_static_call' }
  | { readonly kind: 'php_database_raw' }
  | { readonly kind: 'php_function_call' }
  | { readonly kind: 'php_array' }
  | { readonly kind: 'php_binary' }
  | { readonly kind: 'php_unary' }
  | { readonly kind: 'php_ternary' }
  | { readonly kind: 'php_short_ternary' }
  | { readonly kind: 'php_coalesce' }
  | { readonly kind: 'php_cast' }
  | { readonly kind: 'php_closure' }
  | { readonly kind: 'php_arrow_function' }
  | { readonly kind: 'php_match' }
  | { readonly kind: 'php_class_reference' }
  | { readonly kind: 'php_class_constant' }
  | { readonly kind: 'php_constructor' }
  | { readonly kind: 'php_assignment' }
  | { readonly kind: 'php_anonymous_class_constructor' }
  | { readonly kind: 'php_instance_of' }
  | { readonly kind: 'php_array_access' }
  | { readonly kind: 'php_interpolated_string' }
  | { readonly kind: 'php_unsupported' };

/**
 * RouteSync AST is a semantic judgment, not merely a syntax tree.
 *
 * The interface is intentionally closed over a schema registry: callers cannot
 * instantiate a canonical node with arbitrary payload types. Syntax evidence,
 * semantic meaning, provenance, constraints, dependencies, and proof of
 * derivation are all first-class parts of the node contract.
 */
export type AstSequence<T> =
  | { readonly kind: 'ast_sequence_empty' }
  | { readonly kind: 'ast_sequence_cons'; readonly head: T; readonly tail: AstSequence<T> };

export type AstEvidence<Surface> = {
  readonly kind: 'source_evidence';
  readonly surface: Surface;
  readonly facts: AstSequence<AstEvidenceFact>;
};

export type AstEvidenceFact = {
  readonly kind: 'ast_evidence_fact';
  readonly predicate: AstEvidencePredicate;
  readonly value: AstEvidenceValue;
};

export type AstEvidencePredicate =
  | 'syntax_kind'
  | 'syntax_form'
  | 'source_origin'
  | 'source_span'
  | 'parser_observation';

export type AstEvidenceValue = StringValue | SourceSpan;

export type AstNodeKind =
  | 'expression_ast'
  | 'model_ast'
  | 'resource_ast'
  | 'request_ast'
  | 'route_ast'
  | 'controller_ast'
  | 'response_ast'
  | 'service_ast'
  | 'migration_ast'
  | 'dto_ast'
  | 'middleware_ast'
  | 'provider_ast'
  | 'attribute_ast'
  | 'channel_ast';

/** Stable source-derived identity. It is a relation key, never object identity. */
export type AstNodeIdentity = {
  readonly kind: 'ast_node_identity';
  readonly node: AstNodeKind;
  readonly source: SourceSpan;
};

export type AstRuleName = { readonly kind: 'ast_rule'; readonly value: StringValue };
export type AstWitnessName = { readonly kind: 'ast_witness'; readonly value: StringValue };

export type AstProvenance<Origin> = {
  readonly kind: 'ast_provenance';
  readonly origin: Origin;
  readonly source: SourceSpan;
};

/** Constraints are semantic obligations handed to the relation solver. */
export type AstConstraint =
  | { readonly kind: 'ast_requires'; readonly relation: AstRelationFact }
  | { readonly kind: 'ast_excludes'; readonly relation: AstRelationFact }
  | { readonly kind: 'ast_satisfies'; readonly relation: AstRelationFact };

export type AstConstraints = {
  readonly kind: 'ast_constraints';
  readonly items: AstSequence<AstConstraint>;
};

/** Dependency edges make semantic dataflow explicit instead of hiding it in traversal order. */
export type AstDependency = {
  readonly kind: 'ast_dependency';
  readonly target: AstNodeIdentity;
  readonly relation: AstRelationFact;
};

export type AstDependencies = {
  readonly kind: 'ast_dependencies';
  readonly items: AstSequence<AstDependency>;
};

/** Resolution state is an ADT; host-language absence is outside this contract. */
export type AstResolutionStatus =
  | { readonly kind: 'ast_candidate' }
  | { readonly kind: 'ast_resolved' }
  | { readonly kind: 'ast_ambiguous'; readonly alternatives: AstSequence<AstWitnessName> }
  | { readonly kind: 'ast_rejected'; readonly reason: AstRuleName };

/** Diagnostics are semantic evidence, never host-language exceptions. */
export type AstDiagnostic =
  | { readonly kind: 'ast_syntax_error'; readonly source: SourceSpan; readonly expected: AstSequence<StringValue> }
  | { readonly kind: 'ast_unsupported_surface'; readonly source: SourceSpan; readonly surface: AstDomainSurface }
  | { readonly kind: 'ast_unresolved_semantics'; readonly source: SourceSpan; readonly rule: AstRuleName }
  | { readonly kind: 'ast_ambiguous_semantics'; readonly source: SourceSpan; readonly witnesses: AstSequence<AstWitnessName> };

export type AstDiagnostics = {
  readonly kind: 'ast_diagnostics';
  readonly items: AstSequence<AstDiagnostic>;
};

/**
 * A proof edge is relational: a rule derives a conclusion from explicit
 * premises. The edge can therefore be replayed, inspected, or saturated by a
 * fixed-point/rewrite engine without depending on a call stack.
 */
export type AstProofPremise =
  | { readonly kind: 'ast_node_premise'; readonly identity: AstNodeIdentity }
  | { readonly kind: 'ast_evidence_premise'; readonly source: SourceSpan; readonly predicate: AstEvidencePredicate };

export type AstDerivationStep = {
  readonly kind: 'ast_derivation_step';
  readonly conclusion: AstNodeIdentity;
  readonly rule: AstRuleName;
  readonly witness: AstWitnessName;
  readonly premises: AstSequence<AstProofPremise>;
  readonly round: NumberValue;
};

export type AstDerivationTrace =
  | { readonly kind: 'ast_derivation_empty' }
  | { readonly kind: 'ast_derivation_cons'; readonly head: AstDerivationStep; readonly tail: AstDerivationTrace };

export type AstDerivation = {
  readonly kind: 'ast_derivation';
  readonly trace: AstDerivationTrace;
};

export const emptyAstSequence = <T>(): AstSequence<T> => ({ kind: 'ast_sequence_empty' });

export const astSequenceCons = <T>(head: T, tail: AstSequence<T> = emptyAstSequence<T>()): AstSequence<T> => ({
  kind: 'ast_sequence_cons',
  head,
  tail,
});

export const emptyAstDerivation = (): AstDerivation => ({
  kind: 'ast_derivation',
  trace: { kind: 'ast_derivation_empty' },
});

export const astDerivationStep = (
  rule: AstRuleName,
  conclusion: AstNodeIdentity,
  witness: AstWitnessName,
  premises: AstSequence<AstProofPremise> = emptyAstSequence(),
  round: NumberValue = { kind: 'number_value', value: 0 },
  tail: AstDerivationTrace = { kind: 'ast_derivation_empty' },
): AstDerivation => ({
  kind: 'ast_derivation',
  trace: {
    kind: 'ast_derivation_cons',
    head: { kind: 'ast_derivation_step', conclusion, rule, witness, premises, round },
    tail,
  },
});

/**
 * Closed schema for canonical AST payloads. This is the key elevation over a
 * generic `Semantic, Surface, Origin` tuple: each AST kind owns its semantic
 * contract, so a consumer cannot accidentally attach an unrelated payload.
 */
export type AstDomainSurface = {
  readonly kind: 'ast_domain_surface';
  readonly domain: AstNodeKind;
  readonly source: SourceSpan;
};

export type AstDomainOrigin = {
  readonly kind: 'ast_domain_origin';
  readonly domain: StringValue;
  readonly source: SourceSpan;
};

/** Closed semantic relation vocabulary owned by the AST judgment layer. */
export type AstRelationName =
  | 'ast_syntax_surface'
  | 'ast_syntax_fact'
  | 'ast_semantic_term'
  | 'ast_requires'
  | 'ast_excludes'
  | 'ast_satisfies'
  | 'ast_depends_on'
  | 'ast_derives'
  | 'ast_witnesses'
  | 'ast_rewrites_to'
  | 'ast_status';

export type AstRelationTerm =
  | { readonly kind: 'ast_term_node'; readonly value: AstNodeIdentity }
  | { readonly kind: 'ast_term_rule'; readonly value: AstRuleName }
  | { readonly kind: 'ast_term_witness'; readonly value: AstWitnessName }
  | { readonly kind: 'ast_term_source'; readonly value: SourceSpan }
  | { readonly kind: 'ast_term_surface'; readonly value: AstDomainSurface };

export type AstRelationFact = {
  readonly kind: 'ast_relation_fact';
  readonly relation: AstRelationName;
  readonly subject: AstRelationTerm;
  readonly object: AstRelationTerm;
};

export type AstRelationFacts = {
  readonly kind: 'ast_relation_facts';
  readonly items: AstSequence<AstRelationFact>;
};

export const astRelationNode = (value: AstNodeIdentity): AstRelationTerm => ({ kind: 'ast_term_node', value });
export const astRelationRule = (value: AstRuleName): AstRelationTerm => ({ kind: 'ast_term_rule', value });
export const astRelationWitness = (value: AstWitnessName): AstRelationTerm => ({ kind: 'ast_term_witness', value });
export const astRelationSource = (value: SourceSpan): AstRelationTerm => ({ kind: 'ast_term_source', value });
export const astRelationSurface = (value: AstDomainSurface): AstRelationTerm => ({ kind: 'ast_term_surface', value });

export const astRelationFact = (
  relation: AstRelationName,
  subject: AstRelationTerm,
  object: AstRelationTerm,
): AstRelationFact => ({ kind: 'ast_relation_fact', relation, subject, object });

export const emptyAstRelationFacts = (): AstRelationFacts => ({
  kind: 'ast_relation_facts',
  items: emptyAstSequence<AstRelationFact>(),
});

export type AstNodeSchema = {
  readonly expression_ast: {
    readonly semantic: Expression;
    readonly surface: ExpressionSurface;
    readonly origin: ExpressionOrigin;
  };
  readonly model_ast: { readonly semantic: ModelDefinition; readonly surface: AstDomainSurface; readonly origin: AstDomainOrigin };
  readonly resource_ast: { readonly semantic: ResourceDefinition; readonly surface: AstDomainSurface; readonly origin: AstDomainOrigin };
  readonly request_ast: { readonly semantic: RequestDefinition; readonly surface: AstDomainSurface; readonly origin: AstDomainOrigin };
  readonly route_ast: { readonly semantic: RouteAstSemantic; readonly surface: AstDomainSurface; readonly origin: AstDomainOrigin };
  readonly controller_ast: { readonly semantic: AstSequence<ControllerMethod>; readonly surface: AstDomainSurface; readonly origin: AstDomainOrigin };
  readonly response_ast: { readonly semantic: ResponseDefinition; readonly surface: AstDomainSurface; readonly origin: AstDomainOrigin };
  readonly service_ast: { readonly semantic: ServiceDefinition; readonly surface: AstDomainSurface; readonly origin: AstDomainOrigin };
  readonly migration_ast: { readonly semantic: MigrationDefinition; readonly surface: AstDomainSurface; readonly origin: AstDomainOrigin };
  readonly dto_ast: { readonly semantic: DtoDefinition; readonly surface: AstDomainSurface; readonly origin: AstDomainOrigin };
  readonly middleware_ast: { readonly semantic: MiddlewareDefinition; readonly surface: AstDomainSurface; readonly origin: AstDomainOrigin };
  readonly provider_ast: { readonly semantic: ProviderDefinition; readonly surface: AstDomainSurface; readonly origin: AstDomainOrigin };
  readonly attribute_ast: { readonly semantic: AttributeDefinition; readonly surface: AstDomainSurface; readonly origin: AstDomainOrigin };
  readonly channel_ast: { readonly semantic: ChannelDefinition; readonly surface: AstDomainSurface; readonly origin: AstDomainOrigin };
};

export type AstSemanticSchemaKind = keyof AstNodeSchema;

export type RouteAstSemantic = {
  readonly kind: 'route_ast_semantic';
  readonly definition: RouteDefinition;
  readonly declaration: RouteDeclarationAst;
};

export type AstCompatibilityProjection<Kind extends AstSemanticSchemaKind> =
  Kind extends 'model_ast' ? { readonly definition: ModelDefinition; readonly source: SourceSpan } :
  Kind extends 'resource_ast' ? { readonly definition: ResourceDefinition; readonly source: SourceSpan } :
  Kind extends 'request_ast' ? { readonly definition: RequestDefinition; readonly source: SourceSpan } :
  Kind extends 'route_ast' ? { readonly definition: RouteDefinition; readonly declaration: RouteDeclarationAst; readonly source: SourceSpan } :
  Kind extends 'controller_ast' ? { readonly methods: import('./collections').Sequence<ControllerMethod>; readonly source: SourceSpan } :
  Kind extends 'response_ast' ? { readonly definition: ResponseDefinition; readonly source: SourceSpan } :
  Kind extends 'service_ast' ? { readonly definition: ServiceDefinition; readonly source: SourceSpan } :
  Kind extends 'migration_ast' ? { readonly definition: MigrationDefinition; readonly source: SourceSpan } :
  Kind extends 'dto_ast' ? { readonly definition: DtoDefinition; readonly source: SourceSpan } :
  Kind extends 'middleware_ast' ? { readonly definition: MiddlewareDefinition; readonly source: SourceSpan } :
  Kind extends 'provider_ast' ? { readonly definition: ProviderDefinition; readonly source: SourceSpan } :
  Kind extends 'attribute_ast' ? { readonly definition: AttributeDefinition; readonly source: SourceSpan } :
  Kind extends 'channel_ast' ? { readonly definition: ChannelDefinition; readonly source: SourceSpan } :
  {};

/** Closed constructor contract for one AST judgment kind. */
export type AstJudgmentConstructor<Kind extends AstSemanticSchemaKind> = {
  readonly kind: Kind;
  readonly semantic: AstNodeSchema[Kind]['semantic'];
  readonly surface: AstNodeSchema[Kind]['surface'];
  readonly origin: AstNodeSchema[Kind]['origin'];
  readonly source: SourceSpan;
  readonly rule: AstRuleName;
  readonly witness: AstWitnessName;
};

/**
 * The AST algebra is the public interface boundary: constructors, eliminators,
 * and projections operate on the same closed judgment universe. There is no
 * open payload slot and no second semantic AST schema.
 */
export type AstJudgmentAlgebra = {
  readonly construct: <Kind extends AstSemanticSchemaKind>(input: AstJudgmentConstructor<Kind>) => SemanticAstNode<Kind>;
  readonly project: <Kind extends AstSemanticSchemaKind>(judgment: SemanticAstNode<Kind>) => AstCompatibilityProjection<Kind>;
};

export type AstJudgmentInput = { [Kind in AstSemanticSchemaKind]: AstJudgmentConstructor<Kind> }[AstSemanticSchemaKind];

export type AstJudgmentContract<Kind extends AstSemanticSchemaKind> =
  AstJudgmentBase<Kind> & AstCompatibilityProjection<Kind>;

/**
 * Highest-level RouteSync AST ADT: the closed judgment universe is the SSOT.
 *
 * There is deliberately no open `Semantic`, `Surface`, or `Origin` parameter.
 * Each constructor is selected from the closed schema registry, and every
 * judgment carries the same semantic evidence/proof facets. Consumers may
 * project individual facets, but the ADT itself is the source of truth.
 */
export type AstJudgmentBase<Kind extends AstSemanticSchemaKind> = {
  readonly kind: Kind;
  readonly identity: AstNodeIdentity;
  readonly semantic: AstNodeSchema[Kind]['semantic'];
  readonly evidence: AstEvidence<AstNodeSchema[Kind]['surface']>;
  readonly provenance: AstProvenance<AstNodeSchema[Kind]['origin']>;
  readonly constraints: AstConstraints;
  readonly dependencies: AstDependencies;
  readonly relations: AstRelationFacts;
  readonly derivation: AstDerivation;
  readonly status: AstResolutionStatus;
  readonly diagnostics: AstDiagnostics;
} & AstCompatibilityProjection<Kind>;

/** Closed canonical AST judgment registry. This registry is RouteSync AST SSOT. */
export type AstJudgmentRegistry = {
  [Kind in AstSemanticSchemaKind]: AstJudgmentContract<Kind>;
};

/** Closed canonical AST judgment ADT. This union is RouteSync AST SSOT. */
export type AstJudgment = AstJudgmentRegistry[AstSemanticSchemaKind];

export type AstJudgmentVisitor<R> = {
  readonly [Kind in AstSemanticSchemaKind]: (judgment: SemanticAstNode<Kind>) => R;
};

/** Closed eliminator for the AST judgment algebra. */
export const matchAstJudgment = <R>(judgment: AstJudgment, visitor: AstJudgmentVisitor<R>): R => {
  const handlers = visitor as Readonly<Record<AstSemanticSchemaKind, (value: AstJudgment) => R>>;
  return handlers[judgment.kind](judgment);
};


/** Narrowing projection from the SSOT judgment ADT; not an independent model. */
export type SemanticAstNode<Kind extends AstSemanticSchemaKind> = AstJudgmentContract<Kind>;

/** Stable public alias retained for downstream compatibility. */
export type CanonicalAstNode<Kind extends AstSemanticSchemaKind> = AstJudgmentContract<Kind>;

/** Canonical expression boundary. */
export type ExpressionAst = Extract<AstJudgment, { readonly kind: 'expression_ast' }>;

export type ModelAst = Extract<AstJudgment, { readonly kind: 'model_ast' }>;
export type ResourceAst = Extract<AstJudgment, { readonly kind: 'resource_ast' }>;
export type RequestAst = Extract<AstJudgment, { readonly kind: 'request_ast' }>;
export type RouteAst = Extract<AstJudgment, { readonly kind: 'route_ast' }>;
export type ControllerAst = Extract<AstJudgment, { readonly kind: 'controller_ast' }>;
export type ResponseAst = Extract<AstJudgment, { readonly kind: 'response_ast' }>;
export type ServiceAst = Extract<AstJudgment, { readonly kind: 'service_ast' }>;
export type MigrationAst = Extract<AstJudgment, { readonly kind: 'migration_ast' }>;
export type DtoAst = Extract<AstJudgment, { readonly kind: 'dto_ast' }>;
export type MiddlewareAst = Extract<AstJudgment, { readonly kind: 'middleware_ast' }>;
export type ProviderAst = Extract<AstJudgment, { readonly kind: 'provider_ast' }>;
export type AttributeAst = Extract<AstJudgment, { readonly kind: 'attribute_ast' }>;
export type ChannelAst = Extract<AstJudgment, { readonly kind: 'channel_ast' }>;


type AstProjectionInput<Kind extends AstSemanticSchemaKind> = {
  readonly kind: Kind;
  readonly semantic: AstNodeSchema[Kind]['semantic'];
  readonly source: SourceSpan;
};

const astProjection = <Kind extends AstSemanticSchemaKind>(input: AstProjectionInput<Kind>): AstCompatibilityProjection<Kind> => {
  const source = input.source;
  const semantic = input.semantic;
  const projections = {
    model_ast: () => ({ definition: semantic as ModelDefinition, source }),
    resource_ast: () => ({ definition: semantic as ResourceDefinition, source }),
    request_ast: () => ({ definition: semantic as RequestDefinition, source }),
    route_ast: () => { const route = semantic as RouteAstSemantic; return { definition: route.definition, declaration: route.declaration, source }; },
    controller_ast: () => ({ methods: semantic as AstSequence<ControllerMethod>, source }),
    response_ast: () => ({ definition: semantic as ResponseDefinition, source }),
    service_ast: () => ({ definition: semantic as ServiceDefinition, source }),
    migration_ast: () => ({ definition: semantic as MigrationDefinition, source }),
    dto_ast: () => ({ definition: semantic as DtoDefinition, source }),
    middleware_ast: () => ({ definition: semantic as MiddlewareDefinition, source }),
    provider_ast: () => ({ definition: semantic as ProviderDefinition, source }),
    attribute_ast: () => ({ definition: semantic as AttributeDefinition, source }),
    channel_ast: () => ({ definition: semantic as ChannelDefinition, source }),
    expression_ast: () => ({}),
  } as const;
  return projections[input.kind]() as AstCompatibilityProjection<Kind>;
};


export type AstDomainJudgmentInput = {
  [Kind in Exclude<AstSemanticSchemaKind, 'expression_ast'>]: {
    readonly kind: Kind;
    readonly semantic: AstNodeSchema[Kind]['semantic'];
    readonly source: SourceSpan;
  }
}[Exclude<AstSemanticSchemaKind, 'expression_ast'>];

const astDomainOrigin = (kind: Exclude<AstSemanticSchemaKind, 'expression_ast'>, source: SourceSpan): AstDomainOrigin => ({
  kind: 'ast_domain_origin',
  domain: { kind: 'string_value', value: kind },
  source,
});

const astDomainSurface = (kind: Exclude<AstSemanticSchemaKind, 'expression_ast'>, source: SourceSpan): AstDomainSurface => ({
  kind: 'ast_domain_surface',
  domain: kind,
  source,
});

export const createDomainAstJudgment = <Kind extends Exclude<AstSemanticSchemaKind, 'expression_ast'>>(
  input: Extract<AstDomainJudgmentInput, { readonly kind: Kind }>,
): SemanticAstNode<Kind> => createAstJudgment({
  kind: input.kind,
  semantic: input.semantic,
  surface: astDomainSurface(input.kind, input.source),
  origin: astDomainOrigin(input.kind, input.source),
  source: input.source,
  rule: { kind: 'ast_rule', value: { kind: 'string_value', value: 'source-to-domain-ast' } },
  witness: { kind: 'ast_witness', value: { kind: 'string_value', value: input.kind } },
});

export const createAstJudgment = <Kind extends AstSemanticSchemaKind>(input: AstJudgmentConstructor<Kind>): SemanticAstNode<Kind> => {
  const identity: AstNodeIdentity = { kind: 'ast_node_identity', node: input.kind, source: input.source };
  const semanticSurface: AstDomainSurface = { kind: 'ast_domain_surface', domain: input.kind, source: input.source };
  const evidence: AstEvidence<AstNodeSchema[AstSemanticSchemaKind]['surface']> = {
    kind: 'source_evidence',
    surface: input.surface as AstNodeSchema[AstSemanticSchemaKind]['surface'],
    facts: astSequenceCons({ kind: 'ast_evidence_fact', predicate: 'source_span', value: input.source }),
  };
  const relations: AstRelationFacts = {
    kind: 'ast_relation_facts',
    items: astSequenceCons(
      astRelationFact('ast_syntax_surface', astRelationNode(identity), astRelationSurface(semanticSurface)),
      astSequenceCons(
        astRelationFact('ast_derives', astRelationNode(identity), astRelationRule(input.rule)),
        astSequenceCons(astRelationFact('ast_witnesses', astRelationRule(input.rule), astRelationWitness(input.witness))),
      ),
    ),
  };
  const judgment = {
    kind: input.kind,
    identity,
    semantic: input.semantic,
    evidence,
    provenance: { kind: 'ast_provenance' as const, origin: input.origin, source: input.source },
    constraints: { kind: 'ast_constraints' as const, items: emptyAstSequence<AstConstraint>() },
    dependencies: { kind: 'ast_dependencies' as const, items: emptyAstSequence<AstDependency>() },
    relations,
    derivation: astDerivationStep(input.rule, identity, input.witness, astSequenceCons({ kind: 'ast_evidence_premise', source: input.source, predicate: 'source_span' })),
    status: { kind: 'ast_resolved' as const },
    diagnostics: { kind: 'ast_diagnostics' as const, items: emptyAstSequence<AstDiagnostic>() },
    ...astProjection(input),
  };
  return Object.freeze(judgment) as AstJudgmentContract<Kind>;
};

export const astJudgmentAlgebra: AstJudgmentAlgebra = Object.freeze({
  construct: createAstJudgment,
  project: <Kind extends AstSemanticSchemaKind>(judgment: SemanticAstNode<Kind>) =>
    astProjection({ kind: judgment.kind, semantic: judgment.semantic, source: judgment.provenance.source }),
});

export type SourceAst = SourceAsts;
export type CompleteSourceAst = { readonly kind: 'complete_source_ast'; readonly ast: SourceAst; readonly [completeSourceProof]: 'complete' };

export type { SourceAsts } from './collections';
export type { PropertyAst } from './property';
export type { AssignmentAst, MutationAst, SourceMutation } from './assignment';
export type { QueryAst } from './query';

export type { EloquentRelationAst } from './eloquent';

/** Highest semantic interface shared by scanner, resolver, analysis, lowering, and target projection. */
export type {
  AstSemanticStage,
  AstSemanticRelationName,
  AstSemanticTerm,
  AstSemanticFact,
  AstSemanticFacts,
  AstSemanticPremise,
  AstSemanticRule,
  AstSemanticDerivation,
  AstSemanticClosure,
  AstSemanticJudgment,
  AstSemanticProjection,
  AstSemanticInterface,
} from './astSemanticInterface';

export {
  astSemanticFact,
  astSemanticFacts,
  createAstSemanticJudgment,
  astSemanticInterface,
  astSemanticNodeTerm,
  astSemanticSourceTerm,
  astSemanticRuleTerm,
  astSemanticWitnessTerm,
  astSemanticStageTerm,
  astSemanticTextTerm,
  astSemanticFactFromRelation,
  astSemanticFactsFromRelations,
  emptyAstSemanticFacts,
  emptyAstSemanticSequence,
  astSemanticSequenceCons,
} from './astSemanticInterface';
