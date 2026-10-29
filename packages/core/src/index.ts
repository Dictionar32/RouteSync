export { ResourceNamingConvention, toPascalCase, toCamelCase, toSnakeCase, capitalize } from './utils/resource-naming'

// Client
export { HttpClient } from './client/HttpClient'
export { Request } from './client/Request'
export { Response } from './client/Response'
export { Interceptor } from './client/Interceptor'

// Auth
export { TokenManager } from './auth/TokenManager'
export { AuthMiddleware } from './auth/AuthMiddleware'

// Routing
export { PathResolver } from './routing/PathResolver'
export { QueryBuilder } from './routing/QueryBuilder'

// Errors
export { ApiError } from './errors/ApiError'
export { ErrorHandler } from './errors/ErrorHandler'

// AST semantic scanner contracts
export type {
  AstClassifierEvidenceRequest,
  AstClassifierEvidenceResult,
  AstClassifierEvidenceInterface,
  AstClassifierExpressionRequest,
  AstClassifierBlockRequest,
  AstClassifierExpressionResult,
  AstClassifierBlockResult,
} from './types/upstream/astClassifierEvidenceContract'
export type { PhpAstExpressionKind } from './types/upstream/phpAstSyntaxKind'
export type { AstSemanticEvidenceObservation, AstSemanticEvidenceProducerInterface } from './types/upstream/astSemanticEvidenceProducer'
export type { AstSemanticStageInterface } from './types/upstream/astSemanticStageInterfaceAlgebra'

// Types
export type { ServiceConfig, RetryConfig, AuthConfig } from './types/config'
export type { ApiResponse, PaginationMeta } from './types/response'
export type {
  RequestOptions,
  RouteDefinition,
  RouteDefinitionContract,
  RouteDefinitionDescriptorParams,
  MinimalRouteDefinitionParams,
  RouteContractConfig,
  ApiDefinition,
  ApiActionEntry,
  ApiGroupContract,
  ApiManifestContract,
  RouteMapper,
  RouteSchema,
  RouteSchemaMap,
  RouteSchemaValue,
  RouteParserSchema,
  RouteTransform,
  RouteTransformFn,
  RouteTransformMap,
  ResponseSchema,
  RouteParameterEntry,
  RouteQueryEntry,
  PayloadPropertyEntry
} from './types/request'
export {
  RouteDefinitionDescriptor,
  RequestHeaders,
  RouteParameters,
  RouteQueryParameters,
  RequestPayload,
  RouteSchemaModel,
  ResponseSchemaModel,
  RouteMapperModel,
  RouteTransformMapFactory,
  RouteSchemaMapFactory,
  RouteContractConfigFactory,
  RequestOptionsDescriptor,
  type RequestOptionsContract,
  type PhantomCarrier
} from './types/request'
// Domain & Route Contracts
export {
  AbstractCrudResourceGroupDescriptor,
  AbstractResourceGroupDescriptor,
  BROADCAST_CHANNEL_REGISTRY,
  BoundSemanticFactory,
  BroadcastChannelKind,
  CRUD_DISPATCH_REGISTRY,
  CRUD_ROLE_REGISTRY,
  CrudRole,
  DATABASE_COLUMN_KIND_REGISTRY,
  DATA_PROVENANCE_REGISTRY,
  DataProvenanceKind,
  DatabaseColumnKind,
  DatabaseColumnTypeMapper,
  ELOQUENT_CAST_REGISTRY,
  EloquentCastKind,
  EloquentCastMapper,
  EloquentRelationType,
  HOOK_KIND_REGISTRY,
  HTTP_ERROR_KIND_REGISTRY,
  HTTP_METHOD_REGISTRY,
  HTTP_STATUS_CODE_REGISTRY,
  HttpErrorKind,
  HttpMethod,
  HttpStatusCode,
  INVALIDATION_TARGET_REGISTRY,
  InlineResponseDescriptor,
  InvalidationTargetKind,
  MODEL_KEY_TYPE_REGISTRY,
  ModelAccessorMap,
  ModelControllerMap,
  ModelFieldMap,
  ModelKeyType,
  ModelKeyTypeMapper,
  ModelNodeMap,
  ModelRelationMap,
  ModelResponseDescriptor,
  ModelServiceMap,
  MutationCapability,
  PAGE_ENDPOINT_REGISTRY,
  PAGINATION_KIND_REGISTRY,
  PARAMETER_LOCATION_REGISTRY,
  POLYMORPHIC_RELATION_REGISTRY,
  PageEndpointKind,
  PaginationKind,
  PolymorphicMorphType,
  REQUEST_CONTENT_TYPE_REGISTRY,
  RESOURCE_EXPRESSION_REGISTRY,
  RESOURCE_GROUP_REGISTRY,
  RESPONSE_DESCRIPTOR_REGISTRY,
  RESPONSE_SHAPE_REGISTRY,
  ROUTE_ACTION_KIND_REGISTRY,
  ROUTE_DESCRIPTOR_REGISTRY,
  ROUTE_HANDLER_KIND_REGISTRY,
  ROUTE_PARAMETER_TYPE_REGISTRY,
  ROUTE_PAYLOAD_MODE_REGISTRY,
  ROUTE_POLICY_REGISTRY,
  RequestContentType,
  ResourceExpressionKind,
  ResourceFieldSemanticBinding,
  type ResourceFieldSemanticBindingInput,
  ResourceFieldExpressionFactory,
  PHP_AST_KIND_REGISTRY,
  PhpAstKind,
  ResourceGroupKind,
  ResourceResponseDescriptor,
  type ResponseDescriptorBase,
  ResponseKind,
  ResponseShape,
  RouteActionKind,
  RouteDescriptorKind,
  RouteHandlerKind,
  RouteHookKind,
  RouteParameterLocation,
  RouteParameterType,
  RoutePayloadMode,
  RoutePolicyKind,
  RouteSecurityClassifier,
  SDK_RESPONSE_KIND_REGISTRY,
  SECURITY_SCHEME_REGISTRY,
  ScannedCrudResourceGroupDescriptor,
  ScannedCrudRoleDescriptor,
  ScannedCustomResourceGroupDescriptor,
  ScannedEndpointContract,
  ScannedEndpointProvenanceDescriptor,
  ScannedFlexibleCrudResourceGroupDescriptor,
  ScannedFormRequestDescriptor,
  ScannedFullCrudResourceGroupDescriptor,
  ScannedInvalidationTarget,
  ScannedPaginatedEnvelopeDescriptor,
  ScannedPolymorphicRelationDescriptor,
  ScannedReadOnlyCrudResourceGroupDescriptor,
  ScannedRequestContentTypeDescriptor,
  ScannedResourceGroupGraph,
  ScannedResourceGroupTypeSignature,
  RouteSemanticFlowCacheInvalidationDescriptor,
  RouteSemanticFlowExecutionSignature,
  RouteSemanticFlowHookDescriptor,
  RouteSemanticFlowInvalidationPayload,
  RouteSemanticFlowRegistry,
  ScannedSdkResponseResolution,
  ScannedSingletonResourceGroupDescriptor,
  SdkResponseKind,
  SecuritySchemeKind,
  SemanticModelMap,
  SemanticRelationMap,
  VALIDATION_FIELD_REGISTRY,
  VALIDATION_RULE_REGISTRY,
  ValidationFieldKind,
  ValidationRuleKind,
  ValidationRuleNodeFactory,
  ValidationRuleParser,
  VoidResponseDescriptor,
  ZOD_CONSTRAINT_REGISTRY,
  ZodSchemaReducer,
  classifyRoute,
  createEndpointContract,
  createResourceGroupGraph,
  foldValidationField,
  getManifestContractMap,
  getRouteContract,
  matchBoundSemantic,
  matchBroadcastChannel,
  matchCrudRole,
  matchDataProvenance,
  matchDatabaseColumnKind,
  matchEloquentCastKind,
  matchEndpointResponse,
  matchFineGrainedResourceGroup,
  matchHookKind,
  matchHttpError,
  matchHttpMethod,
  matchHttpStatusCode,
  matchInvalidationTarget,
  matchModelKeyType,
  matchPageEndpoint,
  foldPhpAstNode,
  matchPaginatedEnvelope,
  matchPaginationKind,
  matchPhpAstKind,
  matchPhpAstNode,
  matchPolymorphicMorphType,
  matchPolymorphicRelation,
  matchRelation,
  matchRelationCardinality,
  matchRelationType,
  matchRequestContentType,
  matchResourceExpression,
  matchResourceFieldExpression,
  matchResourceGroup,
  matchResponse,
  matchResponseShape,
  matchRoute,
  matchRouteActionKind,
  matchRouteExecutionSignature,
  matchRouteHandler,
  matchRouteHookKind,
  matchRouteParameter,
  matchRouteParameterType,
  matchRoutePayloadMode,
  matchRoutePolicy,
  matchRouteSecurity,
  matchRule,
  matchSdkResponse,
  matchSdkResponseResolution,
  matchUnifiedResourceGroup,
  matchValidationField,
  matchValidationRule
} from './types/route'

export type {
  AbsentMutation,
  AnyCrudRoleDescriptor,
  AnyInvalidationTarget,
  AnyPaginatedEnvelopeDescriptor,
  AnyPolymorphicRelationDescriptor,
  AnyResourceFieldExpression,
  AnyRouteHookDescriptor,
  AnyRouteParameter,
  AnySdkResponseResolution,
  AnyValidationRuleNode,
  ArrayValidationFieldNode,
  ArrayValidationRuleNode,
  AuthResourceInvalidationTarget,
  AvailableMutation,
  BaseCrudParams,
  BaseCrudResourceGroupDescriptor,
  BaseCrudRoleDescriptor,
  BasePaginatedEnvelopeDescriptor,
  BasePolymorphicRelationDescriptor,
  BaseRequestContentTypeDescriptor,
  BaseResourceGroupDescriptor,
  BaseResourceGroupParams,
  BaseResourceGroupTypeSignature,
  BaseRouteHandlerDescriptor,
  BaseRouteHookDescriptor,
  BaseValidationRuleNode,
  BetweenValidationRuleNode,
  BooleanValidationRuleNode,
  BoundBinaryNode,
  BoundConditionalNode,
  BoundMethodCallNode,
  BoundModelColumnNode,
  BoundPrimitiveNode,
  BoundPropertyChainNode,
  BoundRelationNode,
  BoundSemanticKind,
  BoundSemanticNode,
  BoundSemanticVisitor,
  BoundStepEdge,
  BoundTernaryNode,
  BoundUnsupportedNode,
  BroadcastChannelDescriptor,
  BroadcastChannelRegistry,
  BroadcastChannelSpecification,
  BroadcastChannelVisitor,
  ClassifiedDomainGraph,
  ClosureHandlerDescriptor,
  CollectionRelationDescriptor,
  ConditionalWrapperKind,
  ConstraintHandler,
  ConstraintRegistry,
  ControllerActionHandlerDescriptor,
  CreateCrudRoleDescriptor,
  CrudEndpointsTrait,
  CrudResourceGroupDescriptor,
  CrudResourceGroupDescriptorParams,
  CrudRoleRegistry,
  CrudRoleSpecification,
  CrudRoleVisitor,
  CursorPaginatedEnvelopeDescriptor,
  CustomCrudRoleDescriptor,
  CustomResourceGroupDescriptor,
  CustomResourceGroupDescriptorParams,
  CustomTypeSignature,
  CustomValidationRuleNode,
  DataProvenanceKindRegistry,
  DataProvenanceKindSpecification,
  DataProvenanceVisitor,
  DatabaseColumnKindRegistry,
  DatabaseColumnKindSpecification,
  DatabaseColumnKindVisitor,
  DateValidationRuleNode,
  DeleteCrudRoleDescriptor,
  DeletionRouteDescriptor,
  DomainConfigEntry,
  DomainDefinitionEntry,
  DomainIntentConfig,
  DomainOperationEntry,
  EloquentCastKindRegistry,
  EloquentCastKindSpecification,
  EloquentCastKindVisitor,
  EloquentRelationCardinality,
  EloquentRelationDescriptor,
  EloquentRelationTypeVisitor,
  EmailValidationRuleNode,
  EndpointContract,
  EndpointErrorResponseContract,
  EndpointProvenanceDescriptor,
  EndpointRequestContract,
  EndpointResponseContract,
  EndpointResponseVisitor,
  EndpointSuccessResponseContract,
  ExhaustiveFineGrainedResourceGroupVisitor,
  ExistsValidationRuleNode,
  ExtractRule,
  FileValidationRuleNode,
  FlexibleCrudParams,
  FlexibleCrudResourceGroupDescriptor,
  FlexibleCrudTypeSignature,
  FlexibleMutationEndpointsTrait,
  FormRequestDescriptor,
  FrontendConfig,
  FullCrudParams,
  FullCrudResourceGroupDescriptor,
  FullCrudTypeSignature,
  GetCollectionRouteDescriptor,
  GetItemRouteDescriptor,
  GroupAliasEntry,
  HeaderDeclaration,
  HeaderParameterDescriptor,
  HookKindRegistry,
  HookKindSpecification,
  HttpErrorKindRegistry,
  HttpErrorKindSpecification,
  HttpErrorResponseDescriptor,
  HttpErrorVisitor,
  HttpMethodRegistry,
  HttpMethodSpecification,
  HttpMethodVisitor,
  HttpStatusCodeCategory,
  HttpStatusCodeRegistry,
  HttpStatusCodeSpecification,
  HttpStatusCodeVisitor,
  ImageValidationRuleNode,
  InValidationRuleNode,
  IndexCrudRoleDescriptor,
  InfiniteQueryHookDescriptor,
  InlineResponseDescriptorParams,
  InvalidationTarget,
  InvalidationTargetRegistry,
  InvalidationTargetSpecification,
  InvalidationTargetVisitor,
  InvokableControllerHandlerDescriptor,
  ItemEndpointContract,
  ItemEndpointRequestContract,
  JsonRequestContentTypeDescriptor,
  KnownHttpStatusCode,
  LaravelForbiddenError,
  LaravelNotFoundError,
  LaravelServerError,
  LaravelUnauthorizedError,
  LaravelValidationError,
  LengthAwarePaginatedEnvelopeDescriptor,
  MappedSdkResponseResolution,
  MaxValidationRuleNode,
  MinValidationRuleNode,
  ModelAccessorEntry,
  ModelAccessorInfo,
  ModelControllerEntry,
  ModelFieldEntry,
  ModelFieldInfo,
  ModelKeyTypeRegistry,
  ModelKeyTypeSpecification,
  ModelKeyTypeVisitor,
  ModelNodeEntry,
  ModelRelationEntry,
  ModelRelationInfo,
  ModelResponseParams,
  ModelServiceEntry,
  MorphManyRelationDescriptor,
  MorphOneRelationDescriptor,
  MorphToManyRelationDescriptor,
  MorphToRelationDescriptor,
  MorphedByManyRelationDescriptor,
  MultipartRequestContentTypeDescriptor,
  MutationHookDescriptor,
  MutationRouteDescriptor,
  NoPayloadExecutionSignature,
  NoneRequestContentTypeDescriptor,
  NullableValidationRuleNode,
  NumberValidationRuleNode,
  ObjectValidationFieldNode,
  OptionalPayloadExecutionSignature,
  OptionalValidationRuleNode,
  PageConfig,
  PageEndpointDescriptor,
  PageEndpointKindRegistry,
  PageEndpointKindSpecification,
  PageEndpointVisitor,
  PageMetaEntry,
  PagePropEntry,
  PaginatedEnvelopeDescriptor,
  PaginatedEnvelopeVisitor,
  PaginationKindRegistry,
  PaginationKindSpecification,
  ParentDetailInvalidationTarget,
  ParentListInvalidationTarget,
  ModelAccessorFact,
  ModelCastFact,
  ParsedChannel,
  ModelSemanticRelation,
  RouteSemanticFlow,
  PathParameterDescriptor,
  PhpAstCategory,
  PhpAstFolder,
  PhpAstKindRegistry,
  PhpAstKindSpecification,
  PhpAstNode,
  PhpAstVisitor,
  PolymorphicRelationDescriptor,
  PolymorphicRelationRegistry,
  PolymorphicRelationSpecification,
  PolymorphicRelationVisitor,
  PresenceBroadcastChannelDescriptor,
  PrivateBroadcastChannelDescriptor,
  ProvenanceSourceRef,
  PublicBroadcastChannelDescriptor,
  QueryHookDescriptor,
  QueryParameterDescriptor,
  RateLimitDescriptor,
  RawSdkResponseResolution,
  ReadOnlyCrudParams,
  ReadOnlyCrudResourceGroupDescriptor,
  ReadOnlyCrudTypeSignature,
  RelationCardinalityDescriptor,
  RelationCardinalityVisitor,
  RequestContentTypeDescriptor,
  RequestContentTypeRegistry,
  RequestContentTypeSpecification,
  RequestContentTypeVisitor,
  RequiredPayloadExecutionSignature,
  RequiredValidationRuleNode,
  ResourceAssignment,
  ResourceExpressionCategory,
  ResourceExpressionRegistry,
  ResourceExpressionSpecification,
  ResourceFieldExpression,
  ResourceFieldExpressionVisitor,
  ResourceGroupDescriptor,
  ResourceGroupGraph,
  ResourceGroupIdentityTrait,
  ResourceGroupLoweringOperations,
  ResourceGroupQueryKeysTrait,
  ResourceGroupRegistry,
  ResourceGroupSpecification,
  ResourceGroupTypeSignature,
  ResourceGroupTypeSignatureParams,
  ResourceGroupVisitor,
  ResourceGroupVisitorCapability,
  ResourceResponseParams,
  ResourceRouteGroup,
  ResponseDescriptorRegistry,
  ResponseKindSpecification,
  ResponseMetadata,
  ResponseShapeRegistry,
  ResponseShapeSpecification,
  ResponseShapeVisitor,
  ResponseVisitor,
  RouteActionKindRegistry,
  RouteActionKindSpecification,
  RouteActionKindVisitor,
  RouteAttributeEntry,
  RouteBindingContract,
  RouteCacheInvalidationDescriptor,
  RouteCapabilityContract,
  RouteClassifier,
  RouteCollectionRegistry,
  RouteDescriptor,
  RouteDescriptorRegistry,
  RouteExecutionSignature,
  RouteExecutionSignatureVisitor,
  RouteHandlerDescriptor,
  RouteHandlerKindRegistry,
  RouteHandlerKindSpecification,
  RouteHandlerVisitor,
  RouteHookDescriptor,
  RouteHookKindVisitor,
  RouteIdentityContract,
  RouteKindSpecification,
  RouteMessageEntry,
  RouteParameter,
  RouteParameterDescriptor,
  RouteParameterKind,
  RouteParameterLocationRegistry,
  RouteParameterLocationSpecification,
  RouteParameterSpecification,
  RouteParameterTypeRegistry,
  RouteParameterTypeSpecification,
  RouteParameterTypeVisitor,
  RouteParameterVisitor,
  RoutePayloadModeRegistry,
  RoutePayloadModeSpecification,
  RoutePolicyDescriptor,
  RoutePolicyKindRegistry,
  RoutePolicyKindSpecification,
  RoutePolicyVisitor,
  RouteProvenanceContract,
  RouteQueryParameter,
  RouteResponseAnalysis,
  RouteSchemaPayload,
  RouteSecurityDescriptor,
  createRouteSecurityDescriptor,
  RouteSecurityVisitor,
  RouteValidationRuleEntry,
  RouteVisitor,
  ScalarValidationFieldNode,
  ScannedPaginatedEnvelopeParams,
  ScannedPolymorphicRelationParams,
  SdkResponseKindRegistry,
  SdkResponseKindSpecification,
  SdkResponseResolution,
  SdkResponseResolutionVisitor,
  SecuritySchemeRegistry,
  SecuritySchemeSpecification,
  SelfListInvalidationTarget,
  SemanticModelEntry,
  SemanticRelationEntry,
  ShowCrudRoleDescriptor,
  SingleRelationDescriptor,
  SingletonResourceGroupDescriptor,
  SingletonResourceGroupDescriptorParams,
  SingletonTypeSignature,
  SqlTypeFamily,
  StrictMutationEndpointsTrait,
  StringValidationRuleNode,
  UnifiedCrudResourceGroupVisitor,
  UniqueValidationRuleNode,
  UpdateCrudRoleDescriptor,
  UrlEncodedRequestContentTypeDescriptor,
  UrlValidationRuleNode,
  UuidValidationRuleNode,
  ValidatedAndMappedSdkResponseResolution,
  ValidatedSdkResponseResolution,
  ValidationFieldFolder,
  ValidationFieldNode,
  ValidationFieldRegistry,
  ValidationFieldSpecification,
  ValidationFieldVisitor,
  ValidationRuleCategory,
  ValidationRuleNode,
  ValidationRuleRegistry,
  ValidationRuleSpecification,
  ValidationRuleVisitor,
  VoidSdkResponseResolution,
  ZodNode
} from './types/route'

// Semantic Kernel Types & IR
export { SemanticValueFactory } from './types/domain/semanticValues'
export type { ResourceAst } from './types/upstream/ast'
export type { ServiceResult } from './types/upstream/service'
export type { EndpointRequestBodyContract } from './types/domain/contracts'
export type { FieldBinding, ResolvedFieldBinding, UnresolvedFieldBinding } from './types/domain/fieldBinding'

export {
  IRHintsFactory,
  IRRawNodeDescriptor,
  SemanticFieldSet,
  SourceRefFactory,
  ZodObjectShape,
  createSourceColumnNumber,
  createConfidenceScore,
  createModelNodeName,
  createServiceNodeName,
  createControllerNodeName
} from './types/semantic'

export type {
  AccessKind,
  ControllerAction,
  ControllerNode,
  ExecutionLayer,
  GeneratedSDKModule,
  IRContext,
  IRFrameworkContext,
  IRHintPattern,
  IRHints,
  IRKind,
  IRMeta,
  IRRawNode,
  JsonMemberResolution,
  JsonObjectResolution,
  ReactQueryHooks,
  RequestContract,
  ResolutionStatus,
  ResponseContract,
  RouteParamTypeMap,
  RouteQueryTypeMap,
  SemanticFieldEntry,
  SemanticIRNode,
  SemanticKernelV2,
  SemanticNode,
  SemanticRelation,
  SemanticResolution,
  SemanticType,
  ServiceDependency,
  ServiceGraph,
  ServiceNode,
  SourceContext,
  SourceRef,
  SemanticTraceNode,
  ZodAST,
  ZodArrayNode,
  ZodBooleanNode,
  ZodContract,
  ZodLiteralNode,
  ZodNumberNode,
  ZodObjectNode,
  ZodOptionalNode,
  ZodPropertyEntry,
  ZodStringNode,
  ZodUnionNode,
  ZodUnknownNode
} from './types/semantic'
export type {
  TSEmitModule,
  TSFileUnit,
  TSExport,
  ImportStatement,
  TSInterfaceField,
  TSInterface,
  TSFunction,
  TSConst
} from './types/emit'
export { serviceGraphBuilderFactory } from './graph/ServiceGraphBuilder'
export type { ServiceGraphBuilderFactoryInterface } from './graph/ServiceGraphBuilder'
export type { ServiceGraphAssemblyInterface } from './graph/ServiceGraphAssemblyInterface'
export { GraphEdgeRelationSink, graphEdgeRelationOperations } from './graph/service'
export type { GraphEdgeRelation, GraphEdgeRelationOrigin } from './graph/service'

// IR v3 (CompilerRoadmap.md Stage 2)
export { buildSemanticIRNode, computeStableHash, IRNodeRegistry } from './ir/buildIRNode'
export type { BuildIRNodeInput } from './ir/buildIRNode'

// Canonical PHP AST is the sole syntax-node contract; legacy FieldNode/ParsedField exports were removed.
export { createFieldBinding } from './types/domain/fieldBinding';

export {
  createRoutePath,
  createHttpVerb
} from './types/domain/routeEntityDefinition';

export type {
  SemanticRelationContract,
  BelongsToManyRelationContract,
  DirectRelationContract,
  MorphRelationContract
} from './types/semantic';

export { createLaravelSourceProjectIdentity, LARAVEL_SOURCE_IDENTITY_SEMANTICS_CONTRACT, laravelSourceIdentitySemantics } from './types/upstream/sourceProjectIdentity';
export type { SourceProjectIdentityRelationJudgment, SourceFileIdentityRelationJudgment, SourceFileIdentityRelationHandlers, SourceFileIdentityRelationOperations, LaravelSourceIdentitySemanticsContract, LaravelSourceIdentitySemanticsInterface, LaravelSourceProjectIdentityWithPolicyInput, LaravelSourceProjectIdentityFactoryInterface, ControllerSourceProjectIdentityCanonicalizedJudgment, ControllerSourceProjectIdentityCanonicalizationBlockedJudgment, ControllerSourceProjectIdentityCanonicalizationBlockedEvidence, ControllerSourceProjectIdentityCanonicalizationResult, ControllerSourceProjectIdentityCanonicalizationInput, ControllerSourceProjectIdentityCanonicalizationInterface } from './types/upstream/sourceProjectIdentity';
export type { SourceProjectIdentity } from './types/upstream/highLevelSourceModel';
export type { RouteManifest } from './types/domain/base';
export type { RequestType } from './types/domain/request';
export type { SemanticPresence, SemanticAbsenceReasonCode, SemanticAbsenceReasonDefinition } from './types/upstream/semanticDataflowKnowledge'
export type { DataFlowInterface, DataFlowSourceInterface, DataFlowStepInterface, DataFlowFixpointInterface, DataFlowExecutionInterface, DataFlowInputInterface, DataFlowStateInterface, DataFlowQueryInterface, DataFlowClosureInterface, DataFlowAuthorityInterface, DataFlowAuthorityContractInterface, DataFlowProducerContractInterface, DataFlowCapabilityAuthorityInterface, DataFlowConsumerInterface, DataFlowProjectionAlgebraInterface, DataFlowProjectionContract, DataFlowProjectionInterface, DataFlowCapabilityProjectionAlgebraInterface, DataFlowCapabilityProjectionContract, DataFlowCapabilityProjectionInterface } from './types/dataflow'
export type { SemanticCapabilityAuthority, SemanticCapabilityKind, SemanticCapabilityEvidence, SemanticCapabilityIdentityInterface, SemanticCapabilityEvidenceInterface, SemanticCapabilityAlgebraInterface, SemanticCapabilityContractInterface, SemanticCapabilityDerivationInterface, SemanticCapabilityProvenanceInterface, SemanticCapabilityClosureInterface, SemanticCapabilityDerivation, SemanticCapabilityProvenance, SemanticCapabilityContract, SemanticCapabilityConsumerInterface, SemanticCapabilityInterface, SemanticCapabilityAuthorityInterface, SemanticCapabilityConsumerAlgebraInterface, SemanticCapabilityConsumerContractInterface } from './types/upstream/semanticCapability'
export type { SemanticReasoningAuthority, SemanticReasoningStrategy, SemanticReasoningEvidenceKind, SemanticReasoningExecutionInterface, SemanticReasoningRelationInterface, SemanticReasoningRewriteInterface, SemanticReasoningFixedPointInterface, SemanticReasoningJudgmentInterface, SemanticReasoningExecutionAlgebraInterface, SemanticReasoningAlgebraInterface, SemanticReasoningProducerContractInterface, SemanticReasoningProducerInterface, SemanticReasoningInterface, SemanticReasoningEvidenceInterface, SemanticReasoningDerivationInterface, SemanticReasoningProvenanceInterface, SemanticReasoningClosureInterface, SemanticReasoningProofInterface, SemanticReasoningAuthorityInterface, SemanticReasoningConsumerAlgebraInterface, SemanticReasoningConsumerContractInterface, SemanticReasoningConsumerInterface, SemanticReasoningWiringInterface, SemanticReasoningContractInterface, SemanticReasoningContract } from './types/upstream/semanticReasoning'
export { routeCapabilityAuthority, routeCapabilityAuthorityAlgebra, routeCapabilityAuthorityFactory } from './types/upstream/routeCapabilityAuthority'
export { routeSecurityAuthority, routeSecurityAuthorityAlgebra, routeSecurityAuthorityFactory } from './types/upstream/routeSecurityAuthority'
export type { RouteSecurityAuthorityAlgebraInterface, RouteSecurityAuthorityContractInterface, RouteSecurityAuthorityInterface, RouteSecurityAuthorityInput, RouteSecurityResolution, RouteSecurityJudgment, RouteSecurityAuthorityFactoryInterface } from './types/upstream/routeSecurityAuthority'
export { routeCapabilitySemanticAuthority, routeCapabilitySemanticAuthorityAlgebra, routeCapabilitySemanticAuthorityFactory, hasCanonicalRequestFields } from './types/upstream/routeCapabilitySemanticAuthority'
export type { RouteCapabilitySemanticAuthorityFactoryInterface } from './types/upstream/routeCapabilitySemanticAuthority'
export type { RouteCapabilitySemanticAuthorityAlgebraInterface, RouteCapabilitySemanticAuthorityContractInterface, RouteCapabilitySemanticAuthorityInterface, RouteCapabilitySemanticEvidence, RouteCapabilitySemanticOverrides, RouteCapabilitySemanticInput, RouteCapabilitySemanticResolution } from './types/upstream/routeCapabilitySemanticAuthority'
export type { RouteCapabilityAuthorityAlgebraInterface, RouteCapabilityAuthorityContractInterface, RouteCapabilityAuthorityFactoryInterface, RouteCapabilityAuthorityInterface, RouteCapabilityCrudInput, RouteCrudRoleResolution } from './types/upstream/routeCapabilityAuthority'
export type { AstDataflowFact, AstDataflowIdentity, AstDataflowInput, AstDataflowInterface, AstDataflowJudgment, SemanticDataflowRuntimeExecutorFactoryInterface } from './types/upstream/semanticDataflowInterface'
export type { SemanticDataflowIdentity, SemanticDataflowIdentityOperationsInterface, SemanticDataflowFactLineageOperationsInterface, SemanticDataflowInput, SemanticDataflowAlgebraInterface, SemanticDataflowContractInterface, SemanticDataflowInterface, SemanticDataflowJudgment, SemanticDataflowJudgmentInterface, SemanticDataflowJudgmentIdentityInterface, SemanticDataflowJudgmentEvidenceInterface, SemanticDataflowJudgmentFixpointInterface, SemanticDataflowJudgmentAuthorityInterface, SemanticDataflowJudgmentClosureInterface, SemanticDataflowJudgmentOperationsInterface,
  SemanticDataflowInterfaceFactoryInterface, SemanticDataflowClosureCertificate, SemanticDataflowReasoningAuthorityInterface, SemanticDataflowFact } from './types/upstream/semanticDataflow'
export { semanticDataflowIdentityOperations, semanticDataflowFactLineageOperations, semanticDataflowInterfaceFactory } from './types/upstream/semanticDataflow'
export { semanticDataflowReasoningAuthority } from './types/upstream/semanticDataflowAuthority'
export type { InterfaceDependencyAlgebraInterface, InterfaceDependencyContractInterface, InterfaceDependencyBoundary, UpstreamWiringInterface, InterfaceCompositionAlgebra, InterfaceCompositionContract, SemanticCapabilityProjectionAlgebraInterface, SemanticCapabilityProjectionContract, SemanticCapabilityProjectionInterface } from './types/interfaces';
export { composeUpstreamWiring } from './types/interfaces/interfaceComposition';
export { materializeSemanticDataflowQueryPolicy, semanticDataflowQueryPolicySelectionFactory, semanticDataflowQueryPolicyMatches, semanticDataflowFactContractKey, validateSemanticDataflowQueryPolicyContract, decodeSemanticDataflowQueryPolicyContract } from './types/upstream/semanticDataflowQueryPolicy';
export type { SemanticDataflowQueryPolicyMaterializerInterface, SemanticDataflowQueryPolicyContractMatcherInterface, SemanticDataflowFactContractKeyInterface, SemanticDataflowQueryPolicyContractValidatorInterface, SemanticDataflowQueryPolicyContractDecoderInterface } from './types/upstream/semanticDataflowQueryPolicy';
export type { SemanticDataflowQueryPolicyIntent, SemanticDataflowQueryPolicyContract, SemanticDataflowQueryPolicySelection, SemanticDataflowQueryPolicySelectionOperations, SemanticDataflowQueryPolicySelectionFactoryInterface } from './types/upstream/semanticDataflowQueryPolicy';

export { IdentifierCase, extractClassBasename, inferLaravelTableName } from './utils/resource-naming'
export {
  ScannedObjectProperty,
  PrimitiveKind,
  CollectionKind
} from './types/domain/semanticType'
export type {
  PrimitiveType,
  JsonValueType,
  ObjectType,
  ReferenceType,
  UnionType,
  IntersectionType,
  ReadonlyCollectionType,
  MutableCollectionType,
  OptionalType,
  NullableType
} from './types/domain/semanticType'

// Contract IR & Semantic Types
export {
  ResolvedSemanticTypeFactory,
  matchResolvedSemanticTypeIR,
  TypeIRUtils,
  createEndpointId,
  
} from './types/ir'
export type {
  ContractIR,
  ResourceIR,
  ResourceVariantIR,
  RequestIR,
  EndpointIR,
  TypeIR,
  PrimitiveSemanticTypeIR,
  ObjectSemanticTypeIR,
  UnionSemanticTypeIR,
  ResolvedSemanticType as ResolvedSemanticTypeIR,
  ResolvedSemanticTypeVisitor as ResolvedSemanticTypeIRVisitor,
  EndpointId,
  ResourceId,
  RequestId,
  HttpHeaderName
} from './types/ir'
export { createResourceId, createRequestId, createHttpHeaderName } from './types/ir/nominalVocabulary'

// Schema Morphisms & Functor Composition (Level 7 Architecture)
export {
  TypeWrapperKind,
  type IdentityWrapper,
  type NullableWrapper,
  type CollectionWrapper,
  type PaginatedWrapper,
  type TypeWrapper,
  TypeWrapperFactory,
  DomainCarrierKind,
  type ScalarCarrier,
  type ModelCarrier,
  type ResourceCarrier,
  type StructuralCarrier,
  type DomainCarrier,
  type SchemaFieldMorphism,
  DomainCarrierFactory,
  type WrapperAlgebra,
  type CarrierVisitor,
  matchDomainCarrier,
  foldTypeWrapper,
} from './types/domain/schemaMorphism'


export type {
  PhpArgument, PhpBlock, PhpStatement, PhpReturnExpression, PhpParameter, PhpClosureCapture,
  PhpPropertyName, PhpClassName, PhpMethodName, PhpFunctionName, PhpVariableName, PhpConstantName,
  PhpBinaryOperator, PhpUnaryOperator, PhpCastType, ArrayKey, PhpAstSource,
} from './types/domain/phpAst';
export type { BoundLiteralValue } from './types/domain/semanticValues';

// High-level invocation algebra boundary; internal derivation stages are not public caller APIs.
export { INVOCATION_SEMANTIC_ALGEBRA_BOUNDARY_CONTRACT } from './types/upstream/invocationSemanticAlgebraBoundaryInterface';
export type {
  InvocationSemanticAlgebraBoundaryInterface,
  InvocationSemanticAlgebraBoundaryContract,
} from './types/upstream/invocationSemanticAlgebraBoundaryInterface';

// Canonical upstream AST/semantic lowering boundary.
export type { ModelAst } from './types/upstream/ast';
export type { MigrationInterface } from './types/upstream/migrationInterface';
export type { GraphSemanticRelation, GraphSemanticNodeReference, GraphSemanticEdgeType, GraphSemanticRelationOrigin } from './graph/service/graphRelation';
export type { SchemaInterface } from './types/upstream/schema';
export type { ModelPrimaryKeyReconciliationInterface, ModelPrimaryKeyReconciliationStatus } from './types/upstream/modelPrimaryKey';
export type { ResourceField } from './types/upstream/resource';
export { typeExpressionToSemanticType } from './types/domain/typeExpressionSemanticType';
export * from './types/upstream/semanticDataflowRouteProjection';
export * from './types/upstream/semanticDataflowRequestProjection';

export { ManifestBuilderBlockedError } from './types/upstream/manifestBuilderInterface'
export type { ManifestBuilderInterface, ManifestBuilderInput, ManifestBuilderJudgment, ManifestBuilderCompleteJudgment, ManifestBuilderBlockedJudgment, ManifestBuilderBlocker, ManifestBuilderSourceAstBlocker, ManifestBuilderSourceModelBlocker, ManifestBuilderSourceAstBlockedJudgment, ManifestBuilderSourceModelBlockedJudgment, ManifestBuilderOperationPreparationInterface, ManifestBuilderFlowProjectionInterface, ManifestBuilderFlowCompleteJudgment, ManifestBuilderFlowScanJudgment } from './types/upstream/manifestBuilderInterface'
export { laravelRouteSourceSelectionAuthority } from './types/upstream/laravelRouteSourceSelection'
export type { ExplicitRouteSourceSelectionOperations, LaravelRouteSourceSelectionIntentOperations, LaravelDefaultRouteSourceResolutionInterface, LaravelRouteSourceObservationReadyOperations, LaravelRouteSourceObservationBlockedOperations, LaravelRouteSourcePresenceInterface, LaravelRouteSourcePresenceJudgment, LaravelRouteSourcePresenceJudgmentOperations, LaravelRouteSourcePresenceHandlers, LaravelRouteSourcePresenceJudgmentFactoryInterface } from './types/upstream/laravelRouteSourceSelection'
export { laravelRouteSourcePresenceJudgmentFactory, laravelRouteSourceObservationReadyFactory } from './types/upstream/laravelRouteSourceSelection'
export type { LaravelRouteSourceObservationReadyFactoryInterface } from './types/upstream/laravelRouteSourceSelection'
export type { LaravelRouteSourceSelectionIntent } from './types/upstream/laravelRouteSourceSelection'
export type { LaravelRouteSourceSelection, LaravelRouteSourceSelectionInterface } from './types/upstream/laravelRouteSourceSelection'
export type { ServiceGraphBuilderInterface } from './graph/ServiceGraphBuilderInterface'
export { routeSyncManifestGraphProjection } from './graph/RouteSyncManifestGraphProjection'
export type { RouteSyncManifestGraphSurface, RouteSyncManifestGraphProjectionInterface } from './graph/RouteSyncManifestGraphProjectionInterface'
export {
  routeSyncManifestFlowProjection,
  routeSyncManifestDataflowProjection,
  routeManifestRequestResolutionPreflight,
  routeManifestProjectionCompositionFactory,
  routeSyncManifestDataflowAnalysisOperations,
  semanticDataflowIRProjection,
  semanticDataflowRuntimeBoundary,
} from './types/upstream/runtimeManifestOperations'
export {
  RouteManifestProjectionBlockedError,
  RouteManifestRequestResolutionPreflightBlockedError,
} from './types/upstream/runtimeManifestOperations'
export type {
  RouteSyncManifestFlowProjectionInterface,
  RouteSyncManifestDataflowControllerSurface,
  RouteSyncManifestDataflowSurface,
  RouteSyncManifestDataflowProjectionInterface,
  RouteManifestRequestResolutionPreflight,
  RouteManifestRequestResolutionPreflightInterface,
  ManifestProjectedOutcome,
  ManifestProjectionBlockedOutcome,
  RouteManifestProjectionCompositionResult,
  RouteManifestProjectionCompositionInterface,
  RouteManifestProjectionCompositionFactoryInterface,
  SemanticDataflowRuntimeDataFlow,
  SemanticDataflowRuntimeBoundary,
  RouteSyncControllerDataflowAnalysis,
  RouteSyncManifestDataflowAnalysisOperationsInterface,
  SemanticDataflowIRProjection,
} from './types/upstream/runtimeManifestOperations'

export type { InterfaceComposition } from './types/interfaces/interfaceComposition';
export type { DataFlowExecutionAlgebraInterface, DataFlowAuthorityAlgebraInterface } from './types/dataflow/dataFlowInterface';

export * from './types/upstream/routeDomainAuthority';
export type { ResourceModelCandidateSource, ResourceModelCandidate, ResourceModelReasoningInput, ResourceModelReasoningEvidence, ResourceModelJudgment } from './types/upstream/resourceModelReasoning'
export { reasonResourceModel } from './types/upstream/resourceModelReasoning'
export type { ResourceModelBindingSemanticRelation, ResourceModelBindingSemanticRuleSetInterface, ResourceModelBindingSemanticJudgmentModelInterface, ResourceModelBindingInvocationIntegrationModelInterface, ResourceModelBindingOutcomeFormationModelInterface, ResourceModelBindingCandidateCardinality, ResourceModelBindingBatchClosureModelInterface } from './types/upstream/resourceModelBindingSemanticInterface';
export { RESOURCE_MODEL_BINDING_SEMANTIC_JUDGMENT_MODEL, RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET, RESOURCE_MODEL_BINDING_INVOCATION_INTEGRATION_MODEL, RESOURCE_MODEL_BINDING_OUTCOME_FORMATION_MODEL, RESOURCE_MODEL_BINDING_BATCH_CLOSURE_MODEL } from './types/upstream/resourceModelBindingSemanticInterface';

export type { ResourceModelKeyCapabilityEvidence, ResourceModelKeyCapabilityIdentity, ResourceModelKeyCapabilityContract } from './types/upstream/resourceModelKeyCapability';
export { resourceModelKeyCapabilitiesFromAsts, resourceModelKeyCapabilityFor } from './types/upstream/resourceModelKeyCapability';
export type { OperationIdentityCapabilityEvidence, OperationIdentity, OperationIdentityCapabilityAlgebraInterface, OperationIdentityCapabilityContract, OperationIdentityCapabilityInterface, OperationIdentityCapabilityConsumerInterface, OperationIdentityCapabilityInput, OperationIdentityCapabilityRuntimeAlgebraInterface, OperationIdentityCapabilityContractMaterializerInterface, OperationIdentityCapabilityAuthorityInterface, OperationIdentityReference } from './types/upstream/operationIdentityCapability';
export type { DomainIntentCapabilityKind, DomainIntentCapabilityEvidence, DomainIntentOperationReference, AggregateCollectionIntentCapability, GenericDomainIntentCapability, DomainIntentCapabilityAlgebraInterface, DomainIntentCapabilityContract, DomainIntentCapabilityInterface, DomainIntentCapabilityConsumerInterface, DomainIntentCapabilityReference, DomainIntentCapabilityRuntimeOperationsInterface } from './types/upstream/domainIntentCapability';
export { domainIntentCapabilityRuntimeOperations } from './types/upstream/domainIntentCapability';
export type { RouteParameterCapabilityEvidence, RouteParameterCapabilityAlgebraInterface, RouteParameterCapabilityContract, RouteParameterCapabilityInterface, RouteParameterCapabilityConsumerInterface, RouteParameterCapabilityReference } from './types/upstream/routeParameterCapability';
export { routeParameterCapabilityOperations } from './types/upstream/routeParameterCapability';
export type { RouteParameterCapabilityOperationsInterface } from './types/upstream/routeParameterCapability';
export { operationIdentityCapabilityAlgebra } from './types/upstream/operationIdentityCapabilityAlgebra';
export { operationIdentityCapabilityAuthority, operationIdentityCapabilityAuthorityOperations } from './types/upstream/operationIdentityCapabilityAuthority';
export type { OperationIdentityCapabilityAuthorityOperationsInterface } from './types/upstream/operationIdentityCapabilityAuthority';
export type { ResourceModelKeyCapabilityProjectionInterface } from './types/upstream/resourceModelKeyCapability';
export type { ResourceGroupCapabilityAlgebraInterface, ResourceGroupCapabilityContract, ResourceGroupCapabilityEvidence, ResourceGroupExecutionSlots, ResourceGroupRouteReference, ResourceGroupShape, ResourceGroupSlotDecision } from './types/upstream/resourceGroupCapability';
export { resourceGroupCapabilityAuthority, resourceGroupCapabilityAuthorityOperations } from './types/upstream/resourceGroupCapabilityAuthority';
export type { ResourceGroupCapabilityAuthorityOperationsInterface } from './types/upstream/resourceGroupCapabilityAuthority';

export type { OperationIdentityProjectionAlgebraInterface, OperationIdentityProjectionContract, OperationIdentityProjectionInterface } from './types/interfaces/operationIdentityProjectionInterface';

export { semanticMappingRuntimeOperations, type SemanticMappingRuntimeOperationsInterface } from './types/upstream/semanticMapping'
export type { SemanticMappingDirection, SemanticMappingKind, SemanticMappingField, SemanticReadMapperContract, SemanticWriteMapperField, SemanticWriteMapperContract, SemanticMappingEvidence, SemanticMappingContractInterface, SemanticMappingContract, MapperContract, MapperInterface, MapperConsumerInterface, MapperWiringInterface, SemanticMappingConsumerInterface, SemanticMappingWiringInterface } from './types/upstream/semanticMapping'

export type { MapperProjectionTarget, MapperProjectionAlgebraInterface, MapperProjectionContract, MapperProjectionInterface } from './types/interfaces/mapperProjectionInterface'

// Phase 1408: closed upstream source-evidence and route-action identity contracts.
export type { SourceAstEvidenceKind, SourceAstFileEvidence, SourceAstEvidenceAcquisitionContract, SourceAstEvidenceAcquisitionInterface } from './types/upstream/sourceAstEvidenceAcquisitionInterface';
export type { RouteActionIdentityCandidate, RouteActionIdentityResolution, RouteActionIdentityCapabilityContract, RouteActionIdentityCapabilityInterface } from './types/upstream/routeActionIdentityCapability';
export { routeActionIdentityCapabilityAuthority } from './types/upstream/routeActionIdentityCapabilityAuthority';

// Phase 1410: semantic source-origin classification is owned by upstream reasoning.
export type { SourceAstSemanticOriginEvidence, SourceAstSemanticOriginJudgment, SourceAstSemanticOriginInterface } from './types/upstream/sourceAstSemanticOriginInterface';
// Phase 1512: declarative query-operation semantic rule contracts.
export { validateQueryOperationSemanticRuleCatalog } from './types/upstream/queryProducerSemanticInterface';
export { queryOperationSemanticRuleRequirements } from './types/upstream/queryProducerSemanticInterface';
export { queryOperationSemanticRules } from './types/upstream/queryProducerSemanticReasoning';
export type { QueryOperationSemanticPremise, QueryOperationSemanticConstraint, QueryOperationSemanticRule, QueryOperationSemanticRuleFamily, QueryOperationSemanticRuleDeclarationFor, QueryOperationEvidence, QueryOperationSemanticRuleDeclaration, QueryOperationSemanticRuleExecution, QueryOperationSemanticRuleCatalogValidation, QueryOperationSemanticDerivationFor, QueryOperationSemanticDerivation, QueryOperationSemanticDecisionFor, QueryOperationSemanticDecision, QueryOperationSemanticEvidenceAnchor, QueryOperationSemanticObligationReceipt, QueryOperationSemanticSatisfiedReceipt, QueryOperationSemanticEvaluatedReceipt, QueryOperationSemanticPremiseFor, QueryOperationSemanticConstraintFor, QueryOperationSemanticObligationLedgerFor, QueryOperationSemanticSatisfiedObligationLedgerFor, QueryOperationSemanticEvaluatedObligationLedgerFor, QueryOperationSemanticDerivationJudgmentFor, QueryOperationSemanticDerivationJudgment, QueryOperationSemanticExecutorRequest, QueryOperationSemanticExecutorTable, QueryOperationSemanticEvidenceBoundExecution, QueryOperationSemanticRuntimeAuthority, QueryOperationSemanticSourceEvidence, QueryOperationSemanticProvenanceJudgmentFor, QueryOperationSemanticProvenanceJudgment, QueryOperationSemanticOwnedExecutionPlanFor, QueryOperationSemanticOwnedExecutionPlan, QueryOperationSemanticRuntimeClaim, QueryProducerSemanticInterface } from './types/upstream/queryProducerSemanticInterface';

export type { RequestTypeDerivationOperationPreparationInterface, RequestTypeDerivationRuntimeExecutionResult, RequestTypeDerivationRuntimeExecutionResultData, RequestTypeDerivationProjectableRuntimeExecutionData, RequestTypeDerivationBlockedRuntimeExecutionData, RequestTypeDerivationManifestProjectionDisposition, RequestTypeDerivationJudgmentConsumerInterface } from './types/upstream/requestTypeDerivationInterface';
export type { RequestTypeCanonicalIdentity, RequestTypeCanonicalRouteIdentity, RequestTypeCanonicalResourceIdentity, RequestTypeCanonicalRequestIdentity } from './types/upstream/requestTypeDerivationInterface';
export type { RequestTypeDerivationSemanticInputPreparation, RequestTypeDerivationSemanticInputPreparationInterface, RequestTypeDerivationIdentityCollisionInventory } from './types/upstream/requestTypeDerivationInterface';
export { REQUEST_TYPE_DERIVATION_LAW_IDS, REQUEST_TYPE_DERIVATION_LAW_OBLIGATIONS } from './types/upstream/requestTypeDerivationInterface';
export type { RequestTypeDerivationLawObligation, RequestTypeDerivationLawWitnessKind } from './types/upstream/requestTypeDerivationInterface';
export type {
  RequestTypeDerivationLawId,
  RequestTypeDerivationRequiredLawCoverage,
  RequestTypeDerivationVerifiedLawCoverage,
  RequestTypeDerivationPolicy,
  RequestTypeDerivationInput,
  RequestTypeEvidenceKey,
  RequestTypeSourceOccurrenceKey,
  RequestTypeSourceOccurrenceLocation,
  RequestTypeRouteOccurrenceKey,
  RequestTypeResourceOccurrenceKey,
  RequestTypeRequestOccurrenceKey,
  RequestTypeRouteEvidenceReference,
  RequestTypeResourceEvidenceReference,

} from './types/upstream/requestTypeDerivationInterface';
export type { RequestTypeDerivationRequestResolutionInterface, RequestTypeRequestCandidateSelectionInterface, RequestTypeRequestCandidateSelection, RequestTypeRequestResolution, RequestTypeRequestEvidenceReference } from './types/upstream/requestTypeDerivationInterface';

// Canonical invocation semantic pipeline, inventory/publication authorities, and integrated-response scanner boundary.
export { INVOCATION_STATIC_SEMANTIC_ALGEBRA_CONTRACT, INVOCATION_SEMANTIC_PIPELINE_CONTRACT, INVOCATION_SEMANTIC_SCANNER_BOUNDARY_CONTRACT, INVOCATION_SEMANTIC_JUDGMENT_TRACE_CONTRACT, INVOCATION_SEMANTIC_COVERAGE_CONTRACT, INVOCATION_STATIC_JUDGMENT_MODEL_CONTRACT, INVOCATION_STATIC_TARGET_RESOLUTION_CONTRACT, INVOCATION_STATIC_ARGUMENT_AND_EFFECT_CONTRACT, INVOCATION_STATIC_SEMANTIC_JUDGMENT_CONTRACT, INVOCATION_STATIC_JUDGMENT_COMPATIBILITY_CONTRACT, INVOCATION_STATIC_SEMANTIC_AUTHORITY_VALIDATION_CONTRACT } from './types/upstream/invocationSemanticPipelineInterface';
export { invocationSemanticPipelineFactory, invocationSemanticPipeline, invocationSemanticIntegratedResponseCompositionFactory, invocationSemanticIntegratedResponseComposition } from './types/upstream/invocationSemanticPipeline';
export { invocationSemanticSubjectCoverageInventory } from './types/upstream/invocationSemanticCoverageInventory';
export { invocationSemanticCoveragePublicationAuthority } from './types/upstream/invocationSemanticCoveragePublicationAuthority';
export { INVOCATION_SEMANTIC_RULE_MEANING_SIGNATURES, INVOCATION_SEMANTIC_RULE_JUDGMENT_RELATIONS } from './types/upstream/invocationSemanticJudgmentInterface';
export {
  INVOCATION_SEMANTIC_AUTHORITY_BOUNDARY_CONTRACT,
  INVOCATION_SEMANTIC_RUNTIME_EXECUTOR_CONTRACT,
} from './types/upstream/invocationSemanticExecutionBoundaryContract';
export type {
  InvocationSemanticAuthorityBoundaryContract,
  InvocationSemanticRuntimeExecutorContract,
} from './types/upstream/invocationSemanticExecutionBoundaryContract';
export { INVOCATION_STATIC_SEMANTIC_RULE_OBLIGATION_CONTRACT, INVOCATION_STATIC_SEMANTIC_PROOF_LEDGER_CONTRACT, INVOCATION_SEMANTIC_INTEGRATED_RESPONSE_CONTRACT, INVOCATION_SEMANTIC_INTEGRATED_RESPONSE_COMPOSITION_CONTRACT, INVOCATION_SEMANTIC_COVERAGE_PUBLICATION_AUTHORITY_BOUNDARY_CONTRACT } from './types/upstream/invocationSemanticPipelineInterface';
export type {
  InvocationSemanticPipelineEntry,
  InvocationSemanticPipelineBatch,
  InvocationSemanticPipelineInterface,
  InvocationSemanticPipelineContract,
  InvocationSemanticScannerBoundaryContract,
  InvocationSemanticJudgmentTraceContract,
  InvocationSemanticCoverageContract,
  InvocationStaticSemanticAlgebraInput,
  InvocationStaticSemanticAlgebraInterface,
  InvocationStaticSemanticAlgebraContract,
  InvocationStaticResolvedSourceContext,
  InvocationStaticPositionalEvidenceJudgment,
  InvocationStaticTargetResolutionJudgment,
  InvocationStaticArgumentBindingStageJudgment,
  InvocationStaticEffectProjectionStageJudgment,
  InvocationStaticSemanticJudgmentCandidate,
  InvocationStaticSubjectPresenceResult,
  InvocationStaticSubjectPresenceInput,
  InvocationStaticSubjectPresenceInterface,
  InvocationStaticPositionalEvidenceResult,
  InvocationStaticPositionalEvidenceInput,
  InvocationStaticPositionalEvidenceInterface,
  InvocationStaticSemanticAlgebraResult,
  InvocationStaticTargetResolutionAlgebraInput,
  InvocationStaticTargetResolutionAlgebraInterface,
  InvocationStaticArgumentBindingAlgebraInput,
  InvocationStaticArgumentBindingAlgebraInterface,
  InvocationStaticEffectProjectionAlgebraInput,
  InvocationStaticEffectProjectionAlgebraInterface,
  InvocationStaticJudgmentAssemblyInput,
  InvocationStaticJudgmentAssemblyInterface,
  InvocationStaticJudgmentModelContract,
  InvocationStaticSemanticJudgmentContract,
  InvocationStaticSemanticJudgment,
  InvocationStaticSemanticAuthorityViolationCode,
  InvocationStaticSemanticAuthorityViolation,
  InvocationStaticSemanticAuthorityValidationReceipt,
  InvocationStaticSemanticAuthorityValidationResult,
  InvocationStaticSemanticAuthorityValidationInput,
  InvocationStaticSemanticAuthorityValidationInterface,
  InvocationStaticSemanticAuthorityValidationContract,
  InvocationStaticSemanticRuleObligationContract,
  InvocationStaticSemanticProofLedgerContract,
  InvocationStaticIncompleteProofWitnessSequence,
  InvocationStaticSemanticRuleObligationRelation,
  InvocationStaticSemanticObligation,
  InvocationStaticSemanticObligationIdentity,
  InvocationStaticSemanticRuleId,
  InvocationStaticSemanticRuleWitness,
  InvocationStaticClosedProofReceipt,
  InvocationStaticIncompleteProofReceipt,
  InvocationStaticSemanticProofReceipt,
  InvocationStaticArgumentAndEffectContract,
  InvocationStaticPositionalArgumentEvidence,
  InvocationStaticArgumentBindingClaim,
  InvocationStaticUnboundArgument,
  InvocationStaticArgumentDisposition,
  InvocationStaticArgumentBindingJudgment,
  InvocationStaticEffectProjectionJudgment,
  InvocationStaticEffectProjectionUnresolvedObligation,
  InvocationStaticTargetCandidateEvidence,
  InvocationStaticTargetCandidate,
  InvocationStaticTargetUnresolvedObligation,
  InvocationStaticTargetResolution,
  InvocationStaticTargetResolutionContract,
  InvocationSemanticSubject,
  InvocationSemanticSubjectIdentity,
  InvocationSemanticSubjectCoverageEntry,
  InvocationSemanticSubjectCoverageInventoryInterface,
  InvocationSemanticCoveragePublicationEntry,
  InvocationSemanticCoveragePublication,
  InvocationSemanticCoveragePublicationViolation,
  InvocationSemanticCoveragePublicationCorrespondence,
  InvocationSemanticCoveragePublicationResult,
  InvocationSemanticCoveragePublicationInput,
  InvocationSemanticCoveragePublicationInterface,
  InvocationSemanticCoveragePublicationAuthorityBoundaryContract,
  InvocationSemanticIntegratedResponseContract,
  InvocationSemanticIntegratedResponse,
  InvocationSemanticIntegratedResponseCompositionContract,
  InvocationSemanticIntegratedResponseCompositionInput,
  InvocationSemanticIntegratedResponseCompositionDependencies,
  InvocationSemanticIntegratedResponseCompositionResult,
  InvocationSemanticIntegratedResponseCompositionInterface,
  InvocationSemanticPipelineFactoryInterface,
  InvocationSemanticIntegratedResponseCompositionFactoryInterface,
} from './types/upstream/invocationSemanticPipelineInterface';
export type {
  InvocationSemanticRuleTraceEntry,
  InvocationSemanticTraceRuleId,
  InvocationSemanticTraceOutcomeFor,
  InvocationSemanticTraceRuleContractCatalog,
  InvocationSemanticRuleMeaningSignature,
  InvocationSemanticRuleMeaningCatalog,
  InvocationSemanticEstablishedFact,
  InvocationSemanticRulePrerequisite,
  InvocationSemanticRuleJudgmentRelation,
  InvocationSemanticRuleJudgmentRelationCatalog,
} from './types/upstream/invocationSemanticJudgmentInterface';

export type { LaravelSourceAstPipelineInterface } from './types/upstream/laravelSourceAstPipelineInterface'
export type { LaravelSourceAstProjectionJudgment, LaravelSourceAstProjectionJudgmentData, LaravelSourceAstProjectionCompleteJudgment, LaravelSourceAstProjectionBlockedJudgment, LaravelSourceAstProjectionManifestBuildContinuationInterface, LaravelSourceAstProjectionOperationsInterface, LaravelSourceAstPipelineExecutionInput } from './types/upstream/laravelSourceAstPipelineInterface'
export { laravelSourceAstProjectionOperations } from './types/upstream/laravelSourceAstPipelineInterface'
export { laravelRouteScanOutcomeOperations } from './types/upstream/laravelRouteScannerInterface';
export type { LaravelRouteScannerInterface, LaravelRouteScannerAuthorityInterface, LaravelRouteScanOperationInterface, LaravelRouteScanInput, LaravelRouteScanJudgment, LaravelRouteScanArtifact, LaravelRouteScanOutcome, LaravelRouteScanBlockedJudgment, LaravelRouteSourceObservationJudgment, LaravelRouteScanPolicyBlockedJudgment, LaravelRouteScanResponseBlockedJudgment, LaravelRouteScanSourceReadBlockedJudgment, LaravelRouteScanSourceReadBlockedEvidence, LaravelRouteScanProjectionContinuationInterface, LaravelRouteScanOutcomeContinuationInterface, LaravelRouteScanOutcomeOperationsInterface, LaravelRouteSourceFileObservation, LaravelRouteMethod, LaravelResourceRouteMethod, LaravelStandardRouteMethod, LaravelRouteDeclarationMethodJudgment, LaravelRouteDeclarationMethodJudgmentInput, LaravelRouteDeclarationMethodJudgmentAuthority } from './types/upstream/laravelRouteScannerInterface';
export type { RouteResourceFlowAuthority, RouteResourceFlowJudgment, RouteResourceFlowPlan, RouteResourceActionPlan, RouteResourceMode, RouteResourceDeclarationInput } from './types/upstream/routeResourceFlow';
export { routeResourceFlowOperations, routeResourceFlowAuthority } from './types/upstream/routeResourceFlow';
export type { RouteResourceFlowOperationsInterface } from './types/upstream/routeResourceFlow';
export type { LaravelRouteAuthorizationSemanticJudgment, LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface } from './types/upstream/routeAuthorizationSemanticJudgmentInterface';
export { laravelRouteDeclarationMethodSemanticAuthority } from './types/upstream/laravelRouteDeclarationMethodSemanticAuthority';
export { LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_BOUNDARY_CONTRACT } from './types/upstream/laravelControllerScannerInterface';
export type { LaravelControllerScannerInterface, LaravelControllerScanInput, LaravelControllerScanJudgment, LaravelControllerScanArtifact, LaravelControllerSemanticBodyBlocker, ControllerResourceBindingEvidence, ControllerDeclarationSelectionBlocker, ControllerDeclarationSelectionInventoryOutcome, LaravelControllerInvocationSemanticBoundaryContract } from './types/upstream/laravelControllerScannerInterface';
export type { LaravelControllerFormRequestBindingEvidence, LaravelControllerRequestParameterEvidence, LaravelControllerRequestBindingEvidence, LaravelControllerRequestBindingEvidenceProjectionInterface, LaravelControllerRequestSemanticBindingAuthorityInterface } from './types/upstream/laravelControllerRequestSemanticBindingInterface';
export { laravelControllerRequestSemanticBindingAuthority } from './types/upstream/laravelControllerRequestSemanticBindingAuthority';
export { controllerActionProjectionMigration } from './types/upstream/laravelControllerActionSemanticJudgmentInterface';
export type { LaravelControllerActionSemanticJudgmentInput, LaravelControllerActionSemanticKnowledge, LaravelControllerActionBodySemanticKnowledge, LaravelControllerActionProjectionRemainder, LaravelControllerActionDerivationOwnershipObligation, LaravelControllerActionProjectionMigration, LaravelControllerActionContractResolverInput, LaravelControllerActionContractResolverInterface, LaravelControllerActionSemanticJudgment, LaravelControllerActionSemanticJudgmentContract, LaravelControllerActionSemanticJudgmentInterface, LaravelControllerActionSemanticJudgmentPublication, LaravelControllerActionSemanticJudgmentAuthorityInterface, LaravelControllerRequestSemanticBinding, UnresolvedPhpParameterTypeJudgment } from './types/upstream/laravelControllerActionSemanticJudgmentInterface';
export type { ControllerDeclarationParentEvidence, ControllerDeclarationMethodVisibility, ControllerDeclarationMethodCandidate, ControllerDeclarationAttributeCandidate, ControllerDeclarationSemanticCandidate, ControllerDeclarationSemanticSubject, ControllerDeclarationSemanticCorrespondence, ControllerDeclarationAncestryTermination, ControllerDeclarationSemanticSelection, ControllerDeclarationSemanticJudgment, ControllerDeclarationSemanticJudgmentAuthorityInterface } from './types/upstream/controllerDeclarationSemanticJudgmentInterface';
export type { PhpQualifiedClassName, PhpClassImportBinding, PhpClassNameResolution, PhpClassNameResolutionContext, PhpClassNameResolutionInput, PhpClassNameResolutionRuleInterface } from './types/upstream/phpClassNameResolutionInterface';
export { phpQualifiedClassNameFactory } from './types/upstream/phpClassNameResolutionInterface';
export { phpClassNameResolutionAuthority } from './types/upstream/phpClassNameResolutionAuthority';
export { controllerDeclarationSemanticJudgmentAuthority } from './types/upstream/controllerDeclarationSemanticJudgmentAuthority';
export { controllerDeclarationSelectionInventoryClosureAuthority } from './types/upstream/controllerDeclarationSelectionInventoryClosureAuthority';
export type { ControllerDeclarationSelectionInventoryBlocker, ControllerDeclarationSelectionInventoryClosure, ControllerDeclarationSelectionInventoryClosureAuthorityInterface } from './types/upstream/controllerDeclarationSelectionInventoryClosureInterface';
export type { ControllerPolicyActionScopeJudgmentInterface } from './types/upstream/controllerPolicyActionScopeJudgmentInterface';
export type { ControllerPolicyActionScopeJudgment, ControllerPolicyActionScopeBlockReason, ControllerPolicyNamedScopeArgument } from './types/upstream/controller';
export { controllerPolicyActionScopeJudgmentAuthority } from './types/upstream/controllerPolicyActionScopeJudgmentAuthority';
export type { LaravelControllerInvocationSemanticInput, LaravelControllerInvocationSemanticInputDomainOperationsInterface, LaravelControllerInvocationSemanticJudgment, LaravelControllerInvocationSemanticJudgmentContract, LaravelControllerInvocationSemanticJudgmentInterface, LaravelControllerInvocationSemanticJudgmentAuthorityDependencies, LaravelControllerInvocationSemanticJudgmentAuthorityInterface } from './types/upstream/laravelControllerInvocationSemanticJudgmentInterface';
export type { LaravelControllerAstProjectionContext, LaravelControllerAstProjectionResponseJudgment, LaravelControllerAstProjectionSemanticJudgment, LaravelControllerAstProjectionSemanticAuthorityInterface } from './types/upstream/laravelControllerInvocationSemanticJudgmentInterface';
export { laravelControllerAstProjectionSemanticAuthority } from './types/upstream/laravelControllerAstProjectionSemanticAuthority';
export type { LaravelControllerSourceInventoryCompletenessWitness, LaravelControllerSourceInventoryInterface, LaravelControllerSourceDiscoveryBlockerOperations, LaravelControllerSourceDiscoveryBlockerEvidence, LaravelControllerSourceDiscoveryBlocker, LaravelControllerSourceDiscoveryBlockerFactoryInterface, LaravelControllerSourceDiscoveryEvidence, LaravelControllerSourceDiscoveryJudgmentOperations, LaravelControllerSourceDiscoveryResult, LaravelControllerSourceDiscoveryDirectoryContinuationInterface, LaravelControllerSourceDiscoverySymbolicLinkContinuationInterface, LaravelControllerSourceDiscoveryPhpSourceContinuationInterface, LaravelControllerSourceDiscoveryIgnoredContinuationInterface, LaravelControllerSourceDiscoveryEntryOperations, LaravelControllerSourceDiscoveryEntry, LaravelControllerSourceDiscoveryEntryFactoryInterface, LaravelControllerSourceDiscoveryInput, LaravelControllerSourceDiscoveryInterface, LaravelControllerSourceDiscoveryJudgmentFactoryInterface, LaravelControllerInvocationSemanticJudgmentInventoryRejection, LaravelControllerInvocationSemanticJudgmentInventoryInput, LaravelControllerInvocationSemanticJudgmentInventoryCompletenessWitness, LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt, LaravelControllerInvocationSemanticJudgmentInventoryValidated, LaravelControllerInvocationSemanticJudgmentInventoryRejected, LaravelControllerInvocationSemanticJudgmentInventoryManifestBuildInput, LaravelControllerInvocationSemanticJudgmentInventoryResult, LaravelControllerInvocationSemanticJudgmentInventoryProjectBindingRule, LaravelControllerInvocationSemanticJudgmentInventoryCompletenessRule, LaravelControllerInvocationSemanticJudgmentInventorySourceIdentityRule, LaravelControllerInvocationSemanticJudgmentInventoryCorrespondenceRule, LaravelControllerInvocationSemanticJudgmentInventoryOutcomePreservationRule, LaravelControllerInvocationSemanticJudgmentInventoryRejectionAggregationRule, LaravelControllerInvocationInventoryProjectBindingJudgment, LaravelControllerInvocationInventoryCompletenessJudgment, LaravelControllerInvocationInventorySourceIdentityJudgment, LaravelControllerInvocationInventoryCorrespondenceJudgment, LaravelControllerInvocationJudgmentMatchCardinalityHandlers, LaravelControllerInvocationJudgmentMatchCardinalityOperations, LaravelControllerInvocationJudgmentMatchCardinality, LaravelControllerInvocationSemanticJudgmentInventoryContract, LaravelControllerInvocationSemanticJudgmentInventoryReasoningContract, LaravelControllerInvocationSemanticJudgmentInventoryReasoningInterface, LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface } from './types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface';
export { LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT, LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT, laravelControllerSourceDiscoveryBlockerFactory, laravelControllerSourceDiscoveryJudgmentFactory, laravelControllerSourceDiscoveryEntryFactory } from './types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface';
export { laravelControllerInvocationSemanticJudgmentInventoryAuthority } from './types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority';
export { LaravelControllerInvocationSemanticJudgmentAuthority, laravelControllerInvocationSemanticJudgmentAuthority, LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT } from './types/upstream/laravelControllerInvocationSemanticJudgmentAuthority';
export type { LaravelModelScannerInterface, LaravelModelScanInput, LaravelModelScanJudgment, LaravelModelScanArtifact } from './types/upstream/laravelModelScannerInterface';
export type { ModelProducerInterface, ModelProducerInput, ModelProducerResult } from './types/upstream/modelProducerInterface';
export type { LaravelFormRequestScannerInterface, LaravelFormRequestScanInput, LaravelFormRequestScanJudgment, LaravelFormRequestScanArtifact } from './types/upstream/laravelFormRequestScannerInterface';
export type { LaravelResourceScannerInterface, LaravelResourceSourceEvidence, ResourceSourceEvidenceScannerInterface, LaravelResourceScanInput, LaravelResourceScanJudgment, LaravelResourceScanArtifact, LaravelResourceIntegratedResponse, LaravelResourceResolvedArtifact, LaravelResourceRejectedArtifact, ResolvedResourceModelBindingJudgment, LaravelResourceIntegratedResponseContract } from './types/upstream/laravelResourceScannerInterface';
export { LARAVEL_RESOURCE_INTEGRATED_RESPONSE_CONTRACT } from './types/upstream/laravelResourceScannerInterface';
export type { ResourceModelBindingBatchJudgmentInput, ResourceModelBindingBatchJudgment, ResourceModelBindingSubjectJudgment, ResourceModelBindingBatchClosure, ResourceModelBindingClosureResolution, ResourceModelBindingBatchCompleteness, ResourceModelBindingBatchCompletenessVisitor, ResourceModelBindingBatchCompletenessFoldInterface, ResourceModelBindingOutcomeVisitor, ResourceModelBindingOutcomeFoldInterface } from './types/upstream/laravelScannerSemanticJudgment';
export { resourceModelBindingBatchCompletenessFold, resourceModelBindingOutcomeFold } from './types/upstream/laravelScannerSemanticJudgment';
export type { ResourceProducerInput, ResourceFieldProducerInput, ResourceProducerResult, ResourceFieldProductionOperationInterface, ResourceProducerInterface } from './types/upstream/resourceProducerInterface'
export type { ResourceDefinitionBindingInput, ResourceDefinitionBindingOperationInterface } from './types/upstream/resourceDefinitionBindingInterface';
export type { LaravelChannelScannerInterface, LaravelChannelScanInput, LaravelChannelScanJudgment, LaravelChannelScanArtifact, BroadcastChannelDeclarationAst, ResolvedBroadcastChannelKindJudgment, UnresolvedBroadcastChannelKindJudgment, AmbiguousBroadcastChannelKindJudgment, LaravelChannelScannerMigrationContract } from './types/upstream/laravelChannelScannerInterface';
export { LARAVEL_CHANNEL_SCANNER_MIGRATION_CONTRACT } from './types/upstream/laravelChannelScannerInterface';

export * from './types/upstream/laravelScannerSemanticJudgment';

export type { InvocationStaticJudgmentCompatibilityContract, InvocationStaticJudgmentCompatibilityRelation } from './types/upstream/invocationSemanticPipelineInterface';
export type { LaravelControllerInvocationResponseAstContractMap, LaravelControllerSubscannerInterfaceFirstContract, LaravelControllerSubscannerResponsibility, LaravelControllerSubscannerResponsibilityKind, LaravelControllerSubscannerResponsibilityTypeMap, LaravelControllerSubscannerSemanticOwner, LaravelControllerSubscannerSemanticProduct, LaravelSubscannerRetirementDomain, LaravelSubscannerRetirementInterface } from './types/upstream/laravelSubscannerRetirementInterface';
export type { ControllerReturnExpressionEvidence } from './types/upstream/controllerEvidence';
export type { LaravelDtoDeclarationDiscoveryScope, LaravelDtoDeclarationDiscoveryBlocker, LaravelDtoDeclarationClassIdentity, LaravelDtoDeclarationSourceEvidence, LaravelDtoDeclarationResolvedSourceEvidence, LaravelDtoDeclarationDiscoveryReceipt, LaravelProjectDtoDeclarationInventoryInterface, LaravelControllerResponseDtoDeclarationResolutionInput, LaravelControllerResponseDtoDeclarationResolvedInput, LaravelControllerResponseDtoDeclarationIdentity, LaravelControllerResponseDtoDeclarationResolutionJudgment, LaravelControllerResponseDtoDeclarationResolutionContract, LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface, LaravelControllerResponseDtoDeclarationResolutionRuntimeExecutorInterface } from './types/upstream/laravelControllerResponseDtoDeclarationInterface';
export type { LaravelDtoResponseContractProjectionInput, LaravelDtoResponseContractFieldProjection, LaravelDtoResponseContractProjectionJudgment, LaravelDtoResponseContractProjectionContract, LaravelDtoResponseContractProjectionInterface, LaravelDtoResponseContractProjectionAuthorityInterface, LaravelDtoResponseContractProjectionRuntimeExecutorInterface, LaravelDtoResponseShapeEvidence } from './types/upstream/laravelDtoResponseContractProjectionInterface';
export { LARAVEL_DTO_RESPONSE_CONTRACT_PROJECTION_CONTRACT, createLaravelDtoResponseContractProjectionAuthority, laravelDtoResponseContractProjectionAuthority, laravelDtoResponseContractProjectionRuntimeExecutor } from './types/upstream/laravelDtoResponseContractProjectionAuthority';
export { LARAVEL_CONTROLLER_RESPONSE_DTO_DECLARATION_RESOLUTION_CONTRACT, laravelControllerResponseDtoDeclarationResolutionAuthority, laravelControllerResponseDtoDeclarationResolutionAuthorityFactory, laravelControllerResponseDtoDeclarationResolutionRuntimeExecutor } from './types/upstream/laravelControllerResponseDtoDeclarationResolutionAuthority';
export type { LaravelControllerResponseDtoDeclarationResolutionAuthorityFactoryInterface } from './types/upstream/laravelControllerResponseDtoDeclarationResolutionAuthority';
export type { LaravelControllerResponseEvidenceProductionContract, LaravelControllerResponseEvidenceProductionInput, LaravelControllerResponseEvidenceProductionInterface, LaravelControllerResponseEvidenceProductionInventory, LaravelControllerResponseEvidenceProductionObservation, LaravelControllerResponseEvidenceProductionEvidence, LaravelControllerResponseEvidenceProductionSourceCorrelation, LaravelControllerResponseEvidenceProductionSourceCorrelationJudgment, LaravelControllerResponseEvidenceProductionSourceCorrelationRejectedJudgment, LaravelControllerResponseDeclarationSourceCorrelationInput, LaravelControllerResponseReferenceCandidateEvidence, LaravelControllerResponseEvidenceSourceBindingAuthorityInterface, LaravelControllerResponseEvidenceSourceBindingContract, LaravelControllerResponseEvidenceSourceBindingEntry, LaravelControllerResponseEvidenceSourceBindingInput, LaravelControllerResponseEvidenceSourceBindingJudgment, LaravelControllerResponseEvidenceSourceBindingJudgmentFromInput, LaravelControllerResponseEvidenceSourceBindingRejectedJudgment, LaravelControllerResponseSemanticBlocker, LaravelControllerResponseSemanticEvidence, LaravelControllerResponseSemanticEvidenceForSource, LaravelControllerResponseSemanticJudgment, LaravelControllerResponseSemanticJudgmentAuthorityInterface, LaravelControllerResponseSemanticJudgmentContract, LaravelControllerResponseSemanticJudgmentFor, LaravelControllerResponseSemanticJudgmentFromInput, LaravelControllerResponseSemanticJudgmentInput, LaravelControllerResponseSemanticProduct, LaravelControllerResponseSemanticRuntimeExecutorInterface, LaravelControllerResponseSemanticPipelineInterface, LaravelControllerResponseSemanticPipelineContract } from './types/upstream/laravelControllerResponseSemanticJudgmentInterface';
export type { LaravelControllerInvocationResponseWiringArtifact, LaravelControllerInvocationResponseWiringInterface, LaravelControllerInvocationResponseWiringResult } from './types/upstream/laravelControllerInvocationResponseWiringInterface';

// PHP whole-file frontend contracts and the typed vocabulary consumed by parser adapters.
export type { Expression, ExpressionArgument, ExpressionArguments } from './types/upstream/expression';
export { stringValue, numberValue, type StringValue, type StringValueFactoryInterface, type NumberValue } from './types/upstream/valueObjects';
export { sourceFileIdentityFactory, sourceFileInventoryFactory, sourceFileIdentityInventoryCardinalityFactory } from './types/upstream/names';
export type { SourceFileIdentityFactoryInterface } from './types/upstream/names';
export type { FunctionName, SourceFile, SourceFileInventoryOperations, SourceFileInventoryHandlers, SourceFileInventory, SourceFileInventoryFactoryInterface, SourceFileIdentityInventoryCardinality, SourceFileIdentityInventoryCardinalityHandlers, SourceFileIdentityInventoryCardinalityOperations, SourceFileIdentityInventoryCardinalityFactoryInterface } from './types/upstream/names';
export { sourceSpanFactory, sourceSpanOperations, type SourceSpanFactoryInterface, type SourceSpanOperationsInterface } from './types/upstream/provenance';
export type { SourceSpan, SourceSpanEquality, SourceSpanValidity, SourceSpanContainment, SourceSpanDocumentCoverage, SourceSpanOverlap } from './types/upstream/provenance';
export * from './types/upstream/phpFunctionNameResolutionInterface';
export * from './types/upstream/phpSourceFrontendInterface';
export * from './types/upstream/phpSourceDocumentIdentityBindingInterface';
export { PHP_SOURCE_DOCUMENT_IDENTITY_BINDING_CONTRACT, phpSourceDocumentIdentityBinding } from './types/upstream/phpSourceDocumentIdentityBindingAuthority';
export { phpSourceDocumentIdentityBindingBatchFactory } from './types/upstream/phpSourceDocumentIdentityBindingBatchAuthority';

export { phpSourceFrontendExtractionValidationAuthority } from './types/upstream/phpSourceFrontendExtractionValidationAuthority';
export { phpSourceDocumentReader, nodeFilesystemFailureObservation } from './types/upstream/phpSourceDocumentReader';
export { laravelControllerInvocationSemanticJudgmentPreparationInputFactory } from './types/upstream/laravelControllerInvocationSemanticJudgmentPreparationAuthority';
export { manifestBuilderOperationPreparation } from './types/upstream/runtimeCompositionOperations';
export { phpFunctionResolutionSourceInventoryAuthority } from './types/upstream/phpFunctionResolutionSourceInventoryAuthority';
export { phpFunctionResolutionEnvironmentProjectionAuthority } from './types/upstream/phpFunctionResolutionEnvironmentProjectionAuthority';
export { phpFunctionNameResolutionAuthority } from './types/upstream/phpFunctionNameResolutionAuthority';
export { phpFunctionInvocationSemanticJudgmentBatchClosureAuthority } from './types/upstream/phpFunctionInvocationSemanticJudgmentBatchClosureAuthority';
export { phpSourceInvocationSemanticPipelineAuthorityFactory } from './types/upstream/phpSourceInvocationSemanticPipelineAuthority';
export type { PhpSourceInvocationSemanticPipelineAuthorityFactoryInterface } from './types/upstream/phpSourceInvocationSemanticPipelineAuthority';
export * from './types/upstream/phpSourceInvocationSemanticPipelineInterface';
export type { PhpSourceInvocationSemanticSourceBindingInput, PhpSourceInvocationSemanticSourceBindingJudgment, PhpSourceInvocationSemanticSourceBindingContract, PhpSourceInvocationSemanticSourceBindingAuthorityInterface } from './types/upstream/phpSourceInvocationSemanticSourceBindingInterface';
export { phpSourceInvocationSemanticSourceBindingAuthority, PHP_SOURCE_INVOCATION_SEMANTIC_SOURCE_BINDING_CONTRACT, phpSourceInvocationPipelineEvidenceFromSourceBinding } from './types/upstream/phpSourceInvocationSemanticSourceBindingAuthority';

export * from './types/upstream/phpSourceInvocationSemanticPipelineDeliveryInterface';

export { laravelControllerResponseSemanticRuntimeOperations, laravelControllerResponseSemanticPipeline } from './types/upstream/laravelControllerResponseSemanticPipeline';
export type { LaravelControllerResponseSemanticRuntimeOperationsInterface } from './types/upstream/laravelControllerResponseSemanticPipeline';

export type { ControllerParameterClassNameRule, ControllerParameterClassNameReasoningContract, ControllerParameterClassNameJudgment, ControllerParameterClassNameJudgmentInterface } from './types/upstream/controllerParameterClassNameJudgmentInterface';

export type { ControllerBodySemanticJudgment, ControllerBodySemanticJudgmentAuthorityInterface } from './types/upstream/controllerBodySemanticJudgmentInterface';
export type { ControllerActionSchemaRequestEvidence, ControllerActionSchemaDerivation, ControllerActionSchemaRouteRequestEvidence, RouteRequestSchemaEvidenceUnavailable, RouteRequestSchemaEvidence, ControllerActionSchemaSemanticJudgment, ControllerActionSchemaSemanticJudgmentAuthorityInterface } from './types/upstream/controllerActionSchemaSemanticJudgmentInterface';
export type { ControllerInlineSchemaEvidence } from './types/upstream/controllerBodySemanticJudgmentInterface';
export type { RouteRequestSchemaEvidenceFactoryInterface } from './types/upstream/controllerActionSchemaSemanticJudgmentAuthority';
export { controllerActionSchemaSemanticJudgmentAuthority, routeRequestSchemaEvidenceFactory } from './types/upstream/controllerActionSchemaSemanticJudgmentAuthority';
export type { LaravelDtoResponseValueProjectionInput, LaravelDtoResponseValueProjectionJudgment, LaravelDtoResponseValueProjectionContract, LaravelDtoResponseValueProjectionInterface, LaravelDtoResponseValueProjectionAuthorityInterface, LaravelDtoResponseValueProjectionRuntimeExecutorInterface, LaravelDtoResponseValueReferenceBindingEvidence } from './types/upstream/laravelDtoResponseValueProjectionInterface';
export { LARAVEL_DTO_RESPONSE_VALUE_PROJECTION_CONTRACT, laravelDtoResponseValueProjectionAuthority, laravelDtoResponseValueProjectionRuntimeExecutor } from './types/upstream/laravelDtoResponseValueProjectionAuthority';
export type { LaravelDtoTypeReferenceLexicalContext, LaravelDtoTypeReferenceBindingInput, LaravelDtoTypeReferenceBindingJudgment, LaravelDtoTypeReferenceBindingContract, LaravelDtoTypeReferenceBindingAuthorityInterface, LaravelDtoTypeReferenceBindingRuntimeExecutorInterface, LaravelDtoPropertyTypeReferenceBindingEvidence, LaravelDtoPropertyTypeReferenceBindingEvidenceContract } from './types/upstream/laravelDtoTypeReferenceBindingInterface';
export { LARAVEL_DTO_PROPERTY_TYPE_REFERENCE_BINDING_EVIDENCE_CONTRACT } from './types/upstream/laravelDtoTypeReferenceBindingInterface';
export { LARAVEL_DTO_TYPE_REFERENCE_BINDING_CONTRACT, laravelDtoTypeReferenceBindingAuthority, laravelDtoTypeReferenceBindingRuntimeExecutor } from './types/upstream/laravelDtoTypeReferenceBindingAuthority';

export type { DtoPropertyTypeEvidence, DtoPropertyTypeEvidenceContract } from './types/upstream/dtoPropertyTypeEvidenceInterface';
export { DTO_PROPERTY_TYPE_EVIDENCE_CONTRACT } from './types/upstream/dtoPropertyTypeEvidenceInterface';


// Phase 2192: interface-first semantic dataflow datum/projection/manifest/runtime boundaries.
export * from './types/upstream/semanticDataflowControllerProjection';
export * from './types/upstream/semanticDataflowControllerQueryProjection';
export * from './types/upstream/semanticDataflowInputFactory';
export * from './types/upstream/semanticDataflowManifestSurface';
export * from './types/upstream/semanticDataflowRuntimeExecutor';

export type { ControllerReturnSemanticProductionInput, ControllerReturnSemanticProductionInterface } from './types/upstream/controllerReturnSemanticProductionInterface';

// Phase 2244: controller dependency resolution is owned by one upstream closed judgment authority.
export type { ControllerDependencyAttributeEvidence, ControllerDependencySemanticInput, ControllerDependencySemanticJudgment, ControllerDependencySemanticJudgmentAuthorityInterface, ControllerDependencySemanticRule, ControllerDependencySemanticReasoningContract } from './types/upstream/controllerDependencySemanticJudgmentInterface';
export { controllerDependencySemanticJudgmentAuthority } from './types/upstream/controllerDependencySemanticJudgmentAuthority';

export type { HttpRequestExecution } from './client/HttpRequestExecution'

export type { ResourceModelResolutionOrigin, ResourceModelResolutionFact, ResourceRelationKnowledgeFact, ResourceModelKnowledgeDataFlow } from './types/upstream/resourceModelKnowledgeDataFlowInterface';

export type { ResourceBinaryOperatorMappingOperationInterface, ResourceBinaryOperatorSourceKind } from './types/upstream/resourceBinaryOperatorInterface';
export type { ResourceAstExpressionMappingInput, ResourceAstExpressionMappingOperationInterface, ResourceAstExpressionMappingAuthorityInterface } from './types/upstream/resourceAstExpressionMappingInterface';

export type { PropertyProducerContext, PropertyProducerInput, PropertyProducerInterface } from './types/upstream/propertyProducerInterface';

export type { ExpressionFromPhpAstInput, ExpressionFromPhpAstOperationInterface, ExpressionProducerInput, ExpressionProducerInterface, ExpressionAstFromPhpAstInput, ExpressionAstFromPhpAstOperationInterface } from './types/upstream/expressionProducerInterface';

export type { TypeHasherInterface, TypeHashContext, TypeHashEntry } from './types/upstream/typeHasherInterface';
// Canonical contract value and capability contracts are public because external
// composition roots must implement the same upstream authority, not deep-import
// internal source paths or reconstruct a structurally similar contract.
export { requestTypeDerivationContract } from './types/upstream/requestTypeDerivationInterface';
export type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticPipelineInterface,
  RequestTypeDerivationSemanticPipelineDerivationResult,
  RequestTypeDerivationSemanticPipelineResolution,
  RequestTypeDerivationSemanticPipelineResolutionInput,
  RequestTypeDerivationSemanticPipelineResolutionInterface,
  RequestTypeDerivationSemanticPipelineCompositionInterface,
  RequestTypeDerivationSemanticPipelineAssemblyResult,
  RequestTypeDerivationSemanticReasoningInterface,
  RequestTypeDerivationProofVerificationInterface,
  RequestTypeDerivationSemanticDecisionInterface,
  RequestTypeDerivationSemanticDecisionPremises,
  RequestTypeDerivationSemanticAuthorityInterface,
  RequestTypeDerivationSemanticAuthorityIntegrityInterface,
  RequestTypeDerivationContractEquivalenceInterface,
  RequestTypeDerivationSemanticInferenceFor,
  RequestTypeDerivationSemanticAuthorityCandidateFor,
  RequestTypeDerivationSemanticAuthorityAssessmentFor,
  RequestTypeDerivationSemanticPipelineAssemblerInterface,
  RequestTypeDerivationSourceEvidenceInventoryInterface,
} from './types/upstream/requestTypeDerivationInterface';
export type { RequestTypeDerivationAuthorityIntegrityGateInterface, RequestTypeDerivationAuthorityIntegrityGateResult } from './types/upstream/requestTypeDerivationInterface';

export { routeConstraintArgumentAlgebra, matchRouteConstraintArgument } from './types/upstream/routeConstraints'
export type { RouteConstraintArgumentAlgebraInterface, RouteConstraintArgumentVisitor, RouteConstraintArgument, RouteConstraintFact, RouteConstraintContract, RouteConstraintFlow, RouteConstraintMatcher, RouteConstraintAllowedValue, RouteConstraintSource, RouteConstraintSyntaxMethod } from './types/upstream/routeConstraints'

export type { RequestTypeGroupFoldInput, RequestTypeGroupContributionAlgebraInterface, RequestTypeGroupContributionReceipt, RequestTypeGroupReceipt } from './types/upstream/requestTypeDerivationInterface';

export type { RequestAstCanonicalizationInterface } from './types/upstream/requestAstCanonicalizationInterface';

export type { SemanticTypeConstructionInterface } from './types/upstream/semanticTypeConstructionInterface';

export { routePayloadLocationOperations } from './types/upstream/routeExecutionVocabulary';
export type { RoutePayloadLocationOperationsInterface } from './types/upstream/routeExecutionVocabulary';

export { routeBindingInterfaceFactory } from './types/upstream/routeBinding';
export type { RouteBindingInterface, RouteBindingDomainOperationsInterface, RouteBindingInterfaceFactoryInterface } from './types/upstream/routeBinding';
export * from './types/upstream/filesystemFailureInterface';

export { graphNodeFactoryOperations } from './graph/service/nodeFactories';
export type { GraphNodeFactoryOperationsInterface } from './graph/service/nodeFactories';

export type { GraphEdgeRelationOperationsInterface } from './graph/service/graphEdgeRelation';
export { structuralSemanticRelationProjectionOperations } from './graph/service/structuralSemanticRelationProjection';
export type { StructuralSemanticRelationProjectionOperationsInterface } from './graph/service/structuralSemanticRelationProjection';
