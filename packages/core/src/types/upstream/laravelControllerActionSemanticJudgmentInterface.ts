import type { ActionName, ClassName, ControllerName, SourceFile } from './names';
import type { ControllerStaticCallModelClassIdentity } from './controllerStaticCallOriginInterface';
import type { ControllerDependency, ControllerResponseReferenceJudgment, ControllerReturnSemantic, ControllerResourceBinding, ControllerSemanticVariableFlow } from './controller';
import type { ControllerRuntimeReturn } from '../domain/controllerExpression';
import type { FormRequestSource } from '../domain/request';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';
import type { LaravelControllerRequestSemanticBinding } from './laravelControllerRequestSemanticBinding';
import type { RouteSchemaPayload } from '../domain/validationRules';
import type { ControllerActionSchemaRouteRequestEvidence } from './controllerActionSchemaSemanticJudgmentInterface';
import type { SourceStatements } from './sourceStatements';
import type { ControllerBodySemanticJudgment } from './controllerBodySemanticJudgmentInterface';
import type { HttpErrorResponseDescriptor } from '../domain/httpErrors';
import type { SourceSpan } from './provenance';
import type { ControllerDataflowSemanticJudgment } from './controllerDataflowSemanticJudgmentAuthorityInterface';
import type { ControllerDataflowDefinitionPayloadMetadata } from './controllerDataflowBindingPayloadCorrespondenceInterface';
export type { LaravelControllerRequestSemanticBinding, UnresolvedPhpParameterTypeJudgment } from './laravelControllerRequestSemanticBinding';

/** Source-bound evidence consumed by the controller action semantic authority. */
export interface LaravelControllerActionSemanticJudgmentInput<
  TMethodEvidence,
  TParameterEvidence,
  TInvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> {
  /** Exact upstream invocation outcome that owns this action analysis. */
  readonly invocationJudgment: TInvocationJudgment;
  /** Exact source span of this method, correlated to the invocation's source file. */
  readonly methodSource: SourceSpan;
  readonly method: TMethodEvidence;
  readonly controller: ControllerName;
  readonly formRequestIndex: readonly (readonly [string, FormRequestSource])[];
  readonly modelClasses: readonly ControllerStaticCallModelClassIdentity[];
  readonly constructorParameters: readonly TParameterEvidence[];
  /** Reuses the existing upstream class-name value object; no primitive-name semantic input. */
  readonly contextualAttributeNames: readonly ClassName[];
}

/**
 * Upstream contract for the existing action-contract projection boundary.
 *
 * Generic parameters keep compiler AST details out of this upstream module. The
 * production action authority closes semantic products through the existing
 * upstream authorities before invoking this contract; the implementation only
 * assembles the compiler-facing action projection.
 */
export interface LaravelControllerActionContractResolverInput<
  TMethodEvidence,
  TControllerIdentity,
  TSourceIdentity,
  TContext,
> {
  readonly kind: 'laravel_controller_action_contract_resolution_input';
  readonly method: TMethodEvidence;
  readonly controller: TControllerIdentity;
  readonly source: TSourceIdentity;
  readonly context: TContext;
}

export interface LaravelControllerActionContractResolverInterface<
  TMethodEvidence,
  TControllerIdentity,
  TSourceIdentity,
  TContext,
  TContract,
> {
  readonly kind: 'laravel_controller_action_contract_resolver';
  readonly ownership: 'projects-already-closed-upstream-judgments-without-semantic-derivation';
  readonly resolve: (
    input: LaravelControllerActionContractResolverInput<
      TMethodEvidence,
      TControllerIdentity,
      TSourceIdentity,
      TContext
    >,
  ) => TContract;
}

/** Canonical controller-body facts represented with upstream statement and domain error types. */
export interface LaravelControllerActionBodySemanticKnowledge {
  readonly statements: SourceStatements;
  readonly errorResponses: readonly HttpErrorResponseDescriptor[];
}

/**
 * Canonical action facts exposed independently from any compiler-owned projection.
 * This is the semantic surface consumed by scanner orchestration and runtime execution;
 * it deliberately reuses existing domain ADTs rather than redefining their meaning.
 */
export interface LaravelControllerActionSemanticKnowledge {
  /** Canonical controller identity; publication and route correlation must not infer it from the consumer projection. */
  readonly controllerName: ControllerName;
  /** Canonical source identity and exact method span; downstream correlation must use this value. */
  readonly source: SourceSpan;
  readonly actionName: ActionName;
  readonly responseReferenceJudgment: ControllerResponseReferenceJudgment;
  readonly dependencies: readonly ControllerDependency[];
  /** Controller-level request binding represented with upstream/domain types, not PHP AST nodes. */
  readonly request: LaravelControllerRequestSemanticBinding;
  /** Exact existing upstream dataflow judgment, including binding/payload closure and integrated response. */
  readonly dataflowJudgment: ControllerDataflowSemanticJudgment<ControllerDataflowDefinitionPayloadMetadata>;
  /** Compatibility flow projection from that same closed judgment for existing IR consumers. */
  readonly dataflow: ControllerSemanticVariableFlow;
  /** Canonical validation schema payload, published independently of the compiler projection. */
  readonly schema: RouteSchemaPayload;
  /** Full source-correlated schema origin and inline-validation evidence; schema is its compatibility projection. */
  readonly schemaEvidence: ControllerActionSchemaRouteRequestEvidence<SourceFile>;
  /** Exact closed body judgment, retaining its source identity, schema, and validation-entry provenance. */
  readonly bodyJudgment: ControllerBodySemanticJudgment<SourceFile>;
  /** Compatibility projection of body facts for existing consumers. */
  readonly body: LaravelControllerActionBodySemanticKnowledge;
  /** Resource-binding judgments already closed by the existing upstream resource-binding authority. */
  readonly resourceBindings: readonly ControllerResourceBinding[];
  readonly returns: Readonly<{
    readonly semantic: ControllerReturnSemantic;
    readonly runtime: ControllerRuntimeReturn;
  }>;
}

/** Closed migration obligations for the existing action contract and projection boundary. */
export type LaravelControllerActionProjectionRemainder = Readonly<{
  readonly kind: 'body_source_ast';
  readonly currentOwner: 'compiler_projection';
  readonly targetOwner: 'source_evidence_projection_boundary';
}>;

export type LaravelControllerActionDerivationOwnershipObligation =
  | Readonly<{
      readonly kind: 'body_source_ast';
      readonly currentOwner: 'controller_action_contract';
      readonly targetOwner: 'source_evidence_projection_boundary';
    }>
  | Readonly<{
      readonly kind: 'request_binding_compatibility_adapter';
      readonly currentOwner: 'legacy_action_adapter';
      readonly targetOwner: 'source_evidence_projection_boundary';
    }>
  | Readonly<{
      readonly kind: 'legacy_action_semantic_derivation';
      readonly currentOwner: 'action_semantic_judgment_authority_composition';
      readonly targetOwner: 'existing_upstream_semantic_judgment_contracts';
    }>
  | Readonly<{
      readonly kind: 'method_ast_semantic_derivation';
      readonly currentOwner: 'action_semantic_judgment_authority_composition';
      readonly targetOwner: 'existing_typed_source_evidence_and_semantic_judgment_authorities';
    }>
  | Readonly<{
      readonly kind: 'return_semantic_production_adapter';
      readonly currentOwner: 'controller_ast_canonical_adapter';
      readonly targetOwner: 'existing_upstream_return_semantic_contract';
    }>
  | Readonly<{
      readonly kind: 'custom_contextual_attribute_name_primitive_input';
      readonly currentOwner: 'action_judgment_input_projection';
      readonly targetOwner: 'existing_class_name_value_object_contract';
    }>
  | Readonly<{
      readonly kind: 'contextual_attribute_inventory_provenance';
      readonly currentOwner: 'source_ast_pipeline';
      readonly targetOwner: 'closed_upstream_contextual_attribute_inventory_contract';
    }>
  | Readonly<{
      readonly kind: 'legacy_dataflow_relation_algebra';
      readonly currentOwner: 'transitive_dataflow_knowledge_and_collection_vocabulary_dependencies';
      readonly targetOwner: 'existing_typed_closed_judgment_and_source_evidence_contracts_without_semantic_relations';
    }>;

/**
 * The semantic judgment contains canonical knowledge only. Consumer/compiler projection
 * is a sibling publication product and is never embedded in the judgment value.
 */
export interface LaravelControllerActionSemanticJudgmentBase<
  TInvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface,
> {
  readonly kind: 'controller_action_semantic_judgment_published';
  readonly invocationJudgment: TInvocationJudgment;
  readonly semantic: LaravelControllerActionSemanticKnowledge;
}

export type LaravelControllerActionSemanticJudgmentInterface<
  TInvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> = LaravelControllerActionSemanticJudgmentBase<TInvocationJudgment>;

/** Compiler projection is published beside, not inside, the semantic judgment. */
export interface LaravelControllerActionSemanticJudgmentPublication<
  TProjection,
  TInvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> {
  readonly kind: 'controller_action_semantic_judgment_publication';
  readonly judgment: LaravelControllerActionSemanticJudgmentInterface<TInvocationJudgment>;
  readonly projection: TProjection;
}

/**
 * The semantic judgment is closed by its canonical knowledge fields. Migration debt is
 * not a semantic outcome and therefore does not belong on each judgment value.
 */
export interface LaravelControllerActionProjectionMigration {
  readonly kind: 'laravel_controller_action_projection_migration';
  readonly projectionRemainder: readonly LaravelControllerActionProjectionRemainder[];
  readonly derivationOwnershipRemainder: readonly LaravelControllerActionDerivationOwnershipObligation[];
  readonly publicationRemainder: readonly [];
}

/** Existing production debts are tracked on the contract, separately from semantic judgment. */
export const controllerActionProjectionMigration: LaravelControllerActionProjectionMigration = Object.freeze({
  kind: 'laravel_controller_action_projection_migration',
  projectionRemainder: Object.freeze([Object.freeze({
    kind: 'body_source_ast',
    currentOwner: 'compiler_projection',
    targetOwner: 'source_evidence_projection_boundary',
  })] as const),
  derivationOwnershipRemainder: Object.freeze([
    Object.freeze({
      kind: 'body_source_ast',
      currentOwner: 'controller_action_contract',
      targetOwner: 'source_evidence_projection_boundary',
    }),
    Object.freeze({
      kind: 'request_binding_compatibility_adapter',
      currentOwner: 'legacy_action_adapter',
      targetOwner: 'source_evidence_projection_boundary',
    }),
    Object.freeze({
      kind: 'legacy_action_semantic_derivation',
      currentOwner: 'action_semantic_judgment_authority_composition',
      targetOwner: 'existing_upstream_semantic_judgment_contracts',
    }),
    Object.freeze({
      kind: 'method_ast_semantic_derivation',
      currentOwner: 'action_semantic_judgment_authority_composition',
      targetOwner: 'existing_typed_source_evidence_and_semantic_judgment_authorities',
    }),
    Object.freeze({
      kind: 'return_semantic_production_adapter',
      currentOwner: 'controller_ast_canonical_adapter',
      targetOwner: 'existing_upstream_return_semantic_contract',
    }),
    Object.freeze({
      kind: 'custom_contextual_attribute_name_primitive_input',
      currentOwner: 'action_judgment_input_projection',
      targetOwner: 'existing_class_name_value_object_contract',
    }),
    Object.freeze({
      kind: 'contextual_attribute_inventory_provenance',
      currentOwner: 'source_ast_pipeline',
      targetOwner: 'closed_upstream_contextual_attribute_inventory_contract',
    }),
    Object.freeze({
      kind: 'legacy_dataflow_relation_algebra',
      currentOwner: 'transitive_dataflow_knowledge_and_collection_vocabulary_dependencies',
      targetOwner: 'existing_typed_closed_judgment_and_source_evidence_contracts_without_semantic_relations',
    }),
  ] as const),
  publicationRemainder: Object.freeze([] as const),
});

/** Stable obligations for the action judgment and its projection boundary. */
export interface LaravelControllerActionSemanticJudgmentContract {
  readonly kind: 'laravel_controller_action_semantic_judgment_contract';
  readonly version: 52;
  readonly judgmentShape: 'canonical-semantic-judgment-retains-the-exact-closed-dataflow-judgment;consumer-projection-is-a-sibling-publication-product;projection-migration-debt-is-contract-level-not-judgment-level;upstream-authority-ownership-debt-is-explicit-and-does-not-claim-interface-use-equals-semantic-migration';
  readonly projectionMigration: LaravelControllerActionProjectionMigration;
  readonly invocationCorrelation: 'completed-action-judgment-retains-the-exact-invocation-judgment-value';
  readonly methodSourceCorrelation: 'canonical-action-judgment-retains-the-exact-method-source-span-and-correlates-it-to-the-invocation-source-file';
  readonly controllerIdentityCorrelation: 'canonical-action-judgment-retains-the-controller-identity-from-the-semantic-input-and-route-publication-must-correlate-against-it';
  readonly responseOwnership: 'declared-controller-response-reference-judgment-is-derived-from-exact-method-attribute-source-evidence-and-is-not-an-http-return-judgment-or-a-legacy-descriptor-derived-fact';
  readonly integratedResponseOwnership: 'controller-wide-integrated-response-remains-owned-by-LaravelControllerResponseSemanticPipelineInterface-and-is-not-flattened-into-per-action-response';
  /** Canonical method response products remain on the controller artifact and are correlated to exact action evidence before projection. */
  readonly responseProductCorrelationRule: 'controller-artifact-publishes-only-source-correlated-canonical-method-response-products-from-LaravelControllerResponseSemanticPipelineInterface;action-contract-does-not-derive-or-store-a-parallel-response-descriptor';
  readonly derivationBoundary: 'scanner-input-requires-a-closed-source-correlated-contextual-attribute-inventory;action-judgment-input-uses-the-existing-ClassName-value-object;contextual-attribute-name-projection-remains-a-follow-up-wiring-obligation;dependency-resolution-is-owned-by-controllerDependencySemanticJudgmentAuthorityInterface-from-typed-parameter-origin-class-name-and-contextual-attribute-evidence;body-and-request-evidence-adapters-are-consumed-through-the-existing-typed-dependency-contract;production-adapter-no-longer-delegates-through-scanControllerAction-and-calls-the-existing-contract-resolver-directly;action-contract-resolver-is-accessed-through-LaravelControllerActionContractResolverInterface-and-only-projects-precomputed-judgments;remaining-action-composition-is-owned-by-the-existing-upstream-authorities;canonical-return-semantic-production-is-consumed-through-an-upstream-typed-contract-but-its-current-adapter-still-delegates-to-controllerAstCanonical-and-is-not-claimed-retired;body-semantic-judgment-is-produced-before-legacy-action-projection-by-the-existing-controller-body-authority;canonical-response-reference-judgment-is-derived-from-exact-method-attribute-source-evidence;response-descriptor-derivation-is-retired-from-action-contract-and-canonical-response-products-are-owned-by-LaravelControllerResponseSemanticPipelineInterface;request-kind-and-php-type-resolution-are-owned-by-the-upstream-request-binding-authority;resource-binding-judgment-and-canonical-domain-publication-are-already-upstream-owned;controllerDataflowSemanticJudgmentAuthority-also-imports-semantic-relations-so-removing-only-the-subscanner-import-would-not-close-the-production-path';
  readonly projectionSemanticLeakage: 'body-source-ast-remains-in-the-projection;body-semantic-statements-and-error-responses-are-published-as-upstream-domain-knowledge;schema-is-published-by-a-source-correlated-schema-judgment-with-explicit-derivation-origin;canonical-variable-flow-is-published-from-the-closed-controller-dataflow-judgment;canonical-action-request-judgment-is-derived-from-source-parameter-evidence-by-laravelControllerRequestSemanticBindingAuthority;schema-request-evidence-is-projected-from-the-canonical-request-judgment;resource-binding-judgment-and-domain-publication-are-both-owned-by-controllerResourceBindingAuthority';
  readonly authoritySequence: 'source-evidence-is-closed-by-existing-upstream-contracts-before-judgment-publication;consumer-projection-is-produced-as-a-sibling-and-never-populates-canonical-semantic-knowledge';
  readonly runtimeOwnership: 'runtime-executor-forwards-the-completed-judgment-without-semantic-reclassification';
}

/** Callable semantic authority is separate from the judgment value it produces. */
export interface LaravelControllerActionSemanticJudgmentAuthorityInterface<
  TProjection,
  TMethodEvidence,
  TParameterEvidence,
> {
  readonly kind: 'laravel_controller_action_semantic_judgment_authority';
  readonly contract: LaravelControllerActionSemanticJudgmentContract;
  readonly sourceCorrelation: 'action-judgment-retains-the-exact-invocation-judgment-and-source-identity-supplied-as-input';
  /** Generic method preserves the caller's exact invocation outcome subtype end-to-end. */
  readonly judge: <TInvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>(
    input: LaravelControllerActionSemanticJudgmentInput<TMethodEvidence, TParameterEvidence, TInvocationJudgment>,
  ) => LaravelControllerActionSemanticJudgmentPublication<TProjection, TInvocationJudgment>;
}

/** Compatibility alias for consumers that refer to the completed judgment without the Interface suffix. */
export type LaravelControllerActionSemanticJudgment<
  TInvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> = LaravelControllerActionSemanticJudgmentInterface<TInvocationJudgment>;
