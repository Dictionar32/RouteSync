// Utils
export { camelCase, camelCaseKeys, snakeCase, snakeCaseKeys } from './utils'
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
export { SemanticResolutionKernel as SemanticKernelV2Impl } from './semantic/SemanticResolutionKernel'
export { SemanticResolutionKernel } from './semantic/SemanticResolutionKernel'
export type { EndpointRequestBodyContract } from './types/domain/contracts'
export type { FieldBinding, ResolvedFieldBinding, UnresolvedFieldBinding } from './types/domain/fieldBinding'
export type { ModelNode as SemanticModelNode, ResolverMeta, ResolutionContext, ResolverPlugin } from './semantic/types'
export type { ModelNode } from './semantic/modelNodes'

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
export { createServiceGraphBuilder } from './graph/ServiceGraphBuilder'
export { createServiceGraphAssembly } from './graph/ServiceGraphBuilder'
export type { ServiceGraphAssemblyInterface } from './graph/ServiceGraphAssemblyInterface'
export { GraphEdgeRelationSink, createGraphEdgeRelation } from './graph/service'
export type { GraphEdgeRelation, GraphEdgeRelationOrigin } from './graph/service'

// IR v3 (CompilerRoadmap.md Stage 2)
export { buildSemanticIRNode, computeStableHash, IRNodeRegistry } from './ir/buildIRNode'
export { projectSemanticDataflowToIR, semanticDataflowIRProjection } from './compiler/ir/SemanticDataflowIRProjection'
export type { SemanticDataflowIRNode, SemanticDataflowIRRelation, SemanticDataflowIRProjection } from './compiler/ir/SemanticDataflowIRProjectionTypes'
export type { SemanticDataflowIRProjectionInterface } from './compiler/ir/SemanticDataflowIRProjectionInterface'
export type { BuildIRNodeInput } from './ir/buildIRNode'

// Canonical PHP AST is the sole syntax-node contract; legacy FieldNode/ParsedField exports were removed.
export { createFieldBinding } from './types/domain/fieldBinding';

export {
  createRoutePath,
  createHttpVerb
} from './types/domain/routeEntityDefinition';

export type {
  ResponseDescriptorContract,
  JsonTransportContract,
  BinaryTransportContract,
  StreamTransportContract,
  RedirectTransportContract,
  EmptyTransportContract
} from './compiler/ir/response/responseDescriptorContract';

export type {
  ResponseFieldContract,
  PrimitiveResponseFieldContract,
  ObjectResponseFieldContract,
  ArrayResponseFieldContract,
  VariableResponseFieldContract,
  PropertyAccessResponseFieldContract
} from './compiler/generators/contract-generation/response-field/types';

export type {
  SemanticRelationContract,
  BelongsToManyRelationContract,
  DirectRelationContract,
  MorphRelationContract
} from './types/semantic';

// SymbolTable — O(1) model/member lookup (roadmap: next after ResolverMeta unification)
export type { SymbolTable, ModelSymbol } from './semantic/SymbolTable'

// RouteSync Compiler Core v6.0
export * as v6 from './compiler'

// ResponseArtifact and related types (SSOT for response analysis)
export {
  ResponseArtifact,
  ResponseArtifactBuilder,
  InferenceMethod,
  TransportKind
} from './compiler/ir/ResponseArtifact'
export { RouteManifestArtifact } from './compiler/artifacts/RouteManifestArtifact'
export { ResponseAnalysisArtifact } from './compiler/artifacts/ResponseAnalysisArtifact'
export type {
  ResponseDescriptor,
  ResponseBody,
  ResourceBody,
  ModelBody,
  ObjectBody,
  PrimitiveBody,
  ConfidenceScore,
  ObjectSchema,
  ObjectSchemaProperty,
  PropertyType,
  PropertyDescriptor,
  ModelAttribute
} from './compiler/ir/ResponseArtifact'

export {
  type TokenType,
  type TokenDescriptor,
  type SourceOffset,
  type SourceLineNumber,
  type AstIdentifier,
  createSourceOffset,
  createSourceLineNumber,
  createAstIdentifier,
  type PhpLiteralValue,
  type PhpAstValue,
  type PhpAstValueVisitor,
  type PhpMicroAstVisitor,
  matchPhpAstValue,
  type PhpArrayEntry,
  type ParsedPhpArrayResult,
  PhpAstFactory,
  type SourceStream,
  phpSourceTokenizer,
  phpArrayParser,
  classifyAstTokens,
  classifyAstValue,
  LaravelSourceLexer
} from './compiler/scanner/LaravelSourceLexer'
export type { PhpSourceTokenizerInterface, PhpArrayParserInterface } from './compiler/scanner/LaravelSourceLexer'

export { createLaravelSourceProjectIdentity, LARAVEL_SOURCE_IDENTITY_SEMANTICS_CONTRACT, laravelSourceIdentitySemantics } from './types/upstream/sourceProjectIdentity';
export type { SourceProjectIdentityRelationJudgment, SourceFileIdentityRelationJudgment, LaravelSourceIdentitySemanticsContract, LaravelSourceIdentitySemanticsInterface } from './types/upstream/sourceProjectIdentity';
export { routeSyncManifestScanOperationFactory, routeSyncManifestScanOperation, routeSyncManifestScanner, routeSyncManifestFlowProjection } from './compiler/scanner/orchestrator/upstreamManifestScanner'
export type { RouteSyncManifestScannerInterface } from './compiler/scanner/orchestrator/upstreamManifestScanner'
export type { RouteSyncManifestFlowCompleteJudgment, RouteSyncManifestFlowScanJudgment, RouteSyncManifestScanOperationInput, RouteSyncManifestScanOperationFactoryInterface, RouteSyncManifestScanOperationInterface } from './compiler/scanner/orchestrator/RouteSyncManifestScanOperationInterface'
export type { RouteSyncManifestFlowProjectionInterface } from './compiler/scanner/orchestrator/RouteSyncManifestFlowProjectionInterface'
export { analyzeSemanticDataflowInput } from './compiler/analysis/semanticDataflowPipeline'
export { analyzeRouteSyncManifestDataflow, analyzeRouteSyncManifestDataflowWithPolicy } from './compiler/analysis/routeSyncDataflowAnalysis'
export { routeSyncManifestDataflowSurfaceFromFlow } from './compiler/analysis/routeSyncManifestDataflowProjection'
export type { RouteSyncManifestDataflowSurface, RouteSyncManifestDataflowProjectionInterface, RouteSyncManifestDataflowControllerSurface } from './compiler/analysis/routeSyncManifestDataflowProjectionInterface'
export type { SemanticDataflowRuntimeBoundary } from './compiler/analysis/semanticDataflowRuntimeBoundary'
export { semanticDataflowRuntimeBoundary } from './compiler/analysis/semanticDataflowRuntimeComposition'
export type { ControlFlowSolverInterface, ControlFlowDataFlowInterface, DataFlowAnalysisInterface } from './compiler/analysis/dataflow/controlFlowDataFlowInterface'
export type { DataFlowSolveJudgment } from './compiler/analysis/dataflow/controlFlowDataFlowInterface'
export { DataFlowFixedPointIncompleteError } from './compiler/analysis/dataflow/dataFlowSolveJudgment'
export type { DataFlowInterface, DataFlowSourceInterface, DataFlowStepInterface, DataFlowFixpointInterface, DataFlowExecutionInterface, DataFlowInputInterface, DataFlowStateInterface, DataFlowQueryInterface, DataFlowClosureInterface, DataFlowAuthorityInterface, DataFlowAuthorityContractInterface, DataFlowProducerContractInterface, DataFlowProducerInterface, DataFlowCapabilityAuthorityInterface, DataFlowConsumerInterface, DataFlowProjectionAlgebraInterface, DataFlowProjectionContract, DataFlowProjectionInterface, DataFlowCapabilityProjectionAlgebraInterface, DataFlowCapabilityProjectionContract, DataFlowCapabilityProjectionInterface } from './types/dataflow'
export type { SemanticCapabilityAuthority, SemanticCapabilityKind, SemanticCapabilityEvidence, SemanticCapabilityIdentityInterface, SemanticCapabilityEvidenceInterface, SemanticCapabilityAlgebraInterface, SemanticCapabilityContractInterface, SemanticCapabilityDerivationInterface, SemanticCapabilityProvenanceInterface, SemanticCapabilityClosureInterface, SemanticCapabilityDerivation, SemanticCapabilityProvenance, SemanticCapabilityContract, SemanticCapabilityConsumerInterface, SemanticCapabilityInterface, SemanticCapabilityAuthorityInterface, SemanticCapabilityConsumerAlgebraInterface, SemanticCapabilityConsumerContractInterface } from './types/upstream/semanticCapability'
export type { SemanticReasoningAuthority, SemanticReasoningStrategy, SemanticReasoningEvidenceKind, SemanticReasoningExecutionInterface, SemanticReasoningRelationInterface, SemanticReasoningRewriteInterface, SemanticReasoningFixedPointInterface, SemanticReasoningJudgmentInterface, SemanticReasoningExecutionAlgebraInterface, SemanticReasoningAlgebraInterface, SemanticReasoningProducerContractInterface, SemanticReasoningProducerInterface, SemanticReasoningInterface, SemanticReasoningEvidenceInterface, SemanticReasoningDerivationInterface, SemanticReasoningProvenanceInterface, SemanticReasoningClosureInterface, SemanticReasoningProofInterface, SemanticReasoningAuthorityInterface, SemanticReasoningConsumerAlgebraInterface, SemanticReasoningConsumerContractInterface, SemanticReasoningConsumerInterface, SemanticReasoningWiringInterface, SemanticReasoningContractInterface, SemanticReasoningContract } from './types/upstream/semanticReasoning'
export { routeCapabilityAuthority, routeCapabilityAuthorityAlgebra, createRouteCapabilityAuthority } from './types/upstream/routeCapabilityAuthority'
export { routeSecurityAuthority, routeSecurityAuthorityAlgebra, createRouteSecurityAuthority } from './types/upstream/routeSecurityAuthority'
export type { RouteSecurityAuthorityAlgebraInterface, RouteSecurityAuthorityContractInterface, RouteSecurityAuthorityInterface, RouteSecurityAuthorityInput, RouteSecurityResolution, RouteSecurityJudgment } from './types/upstream/routeSecurityAuthority'
export { routeCapabilitySemanticAuthority, routeCapabilitySemanticAuthorityAlgebra, createRouteCapabilitySemanticAuthority, hasCanonicalRequestFields } from './types/upstream/routeCapabilitySemanticAuthority'
export type { RouteCapabilitySemanticAuthorityAlgebraInterface, RouteCapabilitySemanticAuthorityContractInterface, RouteCapabilitySemanticAuthorityInterface, RouteCapabilitySemanticEvidence, RouteCapabilitySemanticOverrides, RouteCapabilitySemanticInput, RouteCapabilitySemanticResolution } from './types/upstream/routeCapabilitySemanticAuthority'
export type { RouteCapabilityAuthorityAlgebraInterface, RouteCapabilityAuthorityContractInterface, RouteCapabilityAuthorityInterface, RouteCapabilityCrudInput, RouteCrudRoleResolution } from './types/upstream/routeCapabilityAuthority'
export type { AstDataflowFact, AstDataflowIdentity, AstDataflowInput, AstDataflowInterface, AstDataflowJudgment } from './types/upstream/semanticDataflowInterface'
export type { SemanticDataflowIdentity, SemanticDataflowInput, SemanticDataflowAlgebraInterface, SemanticDataflowContractInterface, SemanticDataflowInterface, SemanticDataflowJudgment, SemanticDataflowJudgmentInterface, SemanticDataflowJudgmentIdentityInterface, SemanticDataflowJudgmentEvidenceInterface, SemanticDataflowJudgmentFixpointInterface, SemanticDataflowJudgmentAuthorityInterface, SemanticDataflowJudgmentClosureInterface, SemanticDataflowClosureCertificate, SemanticDataflowReasoningAuthorityInterface, SemanticDataflowFact } from './types/upstream/semanticDataflow'
export { semanticDataflowIdentityEqual } from './types/upstream/semanticDataflow'
export { createSemanticDataflowJudgment, semanticDataflowReasoningAuthority } from './types/upstream/semanticDataflowAuthority'
export type { InterfaceDependencyAlgebraInterface, InterfaceDependencyContractInterface, InterfaceDependencyBoundary, UpstreamWiringInterface, InterfaceCompositionAlgebra, InterfaceCompositionContract, InterfaceComposition, SemanticCapabilityProjectionAlgebraInterface, SemanticCapabilityProjectionContract, SemanticCapabilityProjectionInterface } from './types/interfaces';
export { composeUpstreamWiring } from './types/interfaces/interfaceComposition';
export { createDataFlowConfig } from './compiler/analysis/dataflow/dataFlowConfigInterface'
export { composeDataFlowConfigContributors } from './compiler/analysis/dataflow/dataFlowConfigContributorInterface'
export { selectDataFlowFacts } from './compiler/analysis/dataflow/dataFlowFactPolicyInterface';
export { createSemanticDataflowAnalysisPolicy, semanticDataflowFlowsUnderPolicy } from './compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy';
export { materializeSemanticDataflowQueryPolicy, semanticDataflowQueryPolicyMatches, semanticDataflowFactContractKey, validateSemanticDataflowQueryPolicyContract, decodeSemanticDataflowQueryPolicyContract } from './types/upstream/semanticDataflowQueryPolicy';
export type { SemanticDataflowQueryPolicyIntent, SemanticDataflowQueryPolicyContract } from './types/upstream/semanticDataflowQueryPolicy';
export type { DataFlowFactPolicyInterface } from './compiler/analysis/dataflow/dataFlowFactPolicyInterface';
export type { DataFlowConfigInterface, DataFlowSourcePredicateInterface, DataFlowSinkPredicateInterface, DataFlowAdditionalStepInterface, DataFlowBarrierInterface } from './compiler/analysis/dataflow/dataFlowConfigInterface'
export { liftDataFlowConfigToState } from './compiler/analysis/dataflow/dataFlowStateConfigInterface'
export { createSemanticDataflowRequestStateConfig, createSemanticDataflowStatePolicy } from './compiler/analysis/dataflow/semanticDataflowStatePolicy'
export type { SemanticDataflowRequestState, SemanticDataflowStatePolicy } from './compiler/analysis/dataflow/semanticDataflowStatePolicy'
export type { DataFlowStateConfigInterface } from './compiler/analysis/dataflow/dataFlowStateConfigInterface'
export type { DataFlowConfigContribution, DataFlowConfigContributorInterface } from './compiler/analysis/dataflow/dataFlowConfigContributorInterface'

export { lowerRouteSyncManifestToRouteManifest } from './compiler/scanner/wiring/routeManifestLowerer'
export { projectRouteSyncManifestForRouteManifest, createRouteManifestProjection } from './compiler/scanner/wiring/routeManifestProjection'
export { routeManifestRequestResolutionPreflight } from './compiler/scanner/wiring/routeManifestRequestResolutionPreflight'
export type { RouteManifestProjection, RouteManifestProjectionInput, RouteManifestProjectionInterface, RouteManifestRequestResolutionPreflight, RouteManifestRequestResolutionPreflightInterface } from './compiler/scanner/wiring/routeManifestProjectionInterface'
export type { RouteManifest } from './compiler/scanner/wiring/routeManifestInterface'
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

export {
  PrimitivePhpType,
  EloquentModelPhpType,
  ResourceWrapperPhpType,
  VoidPhpType,
  UnknownPhpType,
  matchResolvedPhpType
} from './compiler/types/ResolvedPhpType'
export type { ResolvedPhpType, ResolvedPhpTypeVisitor } from './compiler/types/ResolvedPhpType'

export { ContractActionGenerator } from './compiler/generators/contract-generation/ContractActionGenerator'
export { FormActionGenerator } from './compiler/generators/form-generation/FormActionGenerator'
export { defaultTypeResolver } from './compiler/domain/common/ResponseFieldLowering'
export {
  ResolvedObjectType,
  ResolvedOptionalType,
  ResolvedCollectionType,
  ResolvedPrimitiveType,
  ResolvedReferenceType,
  ResolvedNullableType,
  ResolvedUnionType,
  ResolvedIntersectionType,
  ResolvedUnknownType,
  ResolvedSemanticTypeKind,
  RESOLVED_SEMANTIC_TYPE_REGISTRY,
  matchResolvedSemanticType
} from './compiler/domain/common/ResolvedSemanticType'
export type {
  ResolvedSemanticType,
  ResolvedPrimitiveKind,
  ObjectKind,
  ResolvedProperty,
  ResolvedObjectIdentity,
  ResolvedSemanticTypeSpecification,
  ResolvedSemanticTypeRegistry,
  ResolvedSemanticTypeVisitor
} from './compiler/domain/common/ResolvedSemanticType'

// Compiler Diagnostics (Stage 2: Validation Gatekeeper)
export {
  DiagnosticBag,
  DiagnosticCategory,
  DIAGNOSTIC_CATEGORY_REGISTRY,
  matchDiagnosticCategory
} from './compiler/diagnostics'
export type { CompilerValidationError } from './compiler/diagnostics'
export type {
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticFix,
  TextEdit,
  DiagnosticCategorySpecification,
  DiagnosticCategoryRegistry,
  DiagnosticCategoryVisitor
} from './compiler/diagnostics'
// Compiler Passes (Pure Transforms & Output Lowerers)
export { lowerTypeScriptArtifact } from './compiler/passes/TypeScriptGeneratorPass'
export { lowerFormArtifact } from './compiler/passes/FormGeneratorPass'
export { lowerContractArtifact } from './compiler/passes/ContractGeneratorPass'
export { lowerApiFieldArtifact } from './compiler/passes/ApiFieldGeneratorPass'
export { lowerMapperArtifact } from './compiler/passes/MapperGeneratorPass'
export {
  lowerReadTypesOutput,
  lowerFormTypesOutput,
  lowerContractsOutput,
  lowerApiFieldsOutput,
  lowerMappersOutput,
  type CompilerOutput,
  type FormOutput,
  type ContractOutput,
  type ApiFieldOutput,
  type MapperOutput
} from './compiler/passes/outputLowerers'

// Compiler Scanner Descriptors & Resolvers
export {
  LaravelValidationType,
  type LaravelValidationConstraint,
  type ResourceExpressionDescriptor,
  ScannedRouteValidationRuleEntry,
  type ScannedRouteValidationRuleParams,
  RouteSemanticFlowValidationRuleSet,
  type RouteValidationRuleSet,
  ValidationTreeBuilder,
  buildValidationTree,
  RouteParameterSemanticFactory,
    type RouteSemanticFlowCompleteContracts,
  type RouteSemanticFlowConstructorInput,
  type RouteSemanticFlowParams,
  type ScannedRouteParameterParams,
  type ScannedRouteQueryParameterParams,
  compileBroadcastRuntimePattern,
  ScannedFormFieldDescriptor,
  type ScannedFormFieldParams,
  ScannedFormActionDescriptor,
  type ScannedFormActionParams,
  ScannedControllerActionDescriptor,
  type ScannedControllerActionParams,
  ScannedRequestTypeDescriptor,
  type ScannedRequestTypeParams,
  type ControllerActionInfo,
  type RequestActionDefinition,
  buildRequestTypeWithActions,
} from './compiler/scanner/descriptors'


export {
  type RouteDomainResolutionContext,
  RouteDomainResolver,
  RouteCrudClassifier,
  type RouteSecurityResolution,
  RouteSecurityResolver,
  type RouteBoundaryContract,
  type RouteBoundaryOptions,
  RouteBoundaryContractFactory
} from './compiler/scanner/resolvers'
export type { ModelSymbolTable, OriginModelSymbol } from './compiler/scanner/symbols/ModelSymbolTable'
export { SemanticResourceBinder } from './compiler/scanner/binders/SemanticResourceBinder'
export { ResourceModelResolver } from './compiler/scanner/resolvers/resource'
export {
  type ResourceModelBinding,
  ResourceModelBindingSource,
  type MonoModelBinding,
  type PolyModelBinding,
  type UnbackedDtoBinding,
  ResourceModelBindingFactory,
  matchResourceModelBinding
} from './compiler/scanner/symbols/resource'

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

// Utilities & Type Guards
export {
  isObject,
  hasProperty,
  isString,
  isNumber,
  isBoolean,
  isArray
} from './utils/guards'

// Code Sinks & Catamorphic Domain Projectors
export {
  type CodeSink,
  type SinkMetadata,
  MemoryCodeSink
} from './compiler/sink'

export {
  type DomainProjector,
  type ProjectorOutput,
  deriveApiFieldKey,
  extractFieldNamesFromField,
  streamAllRequestFieldNames,
  projectApiFieldConstants,
  type FormProjectorDependencies,
  FormModelProjector,
  ContractProjector,
  ReadModelProjector,
  MapperProjector
} from './compiler/projectors'

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

export { SemanticTypeResolver } from './compiler/domain/common/SemanticTypeResolver'
export { toTypeScriptTypeExpression } from './compiler/domain/common/ts-lowerer/typeScriptNodeLowerer'
export { toZodSchemaExpression } from './compiler/domain/common/ZodSchemaLowerer'

// Declarative relation execution primitives used by compiler/parser boundaries.
export {
  relationResolve,
  relationOptionFold,
  relationOptionalFold,
  relationFirstOption,
  relationFirst,
  relationProject,
  relationSelect,
  relationAll,
  relationAny,
  relationEqual,
  relationNotEqual,
  relationIsSome,
  relationIsNone,
  relationFixedPoint,
  relationNone,
  relationSome,
  relationVariant,
  relationVariantFold,
  relationVariantValue,
  walkRelation,
  projectRelation,
  selectRelation,
  expandRelation,
  distinctRelation,
  visitRelation,
  accumulateRelation,
  firstRelation,
} from './compiler/relational/sequence';

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
export { migrationInterfaceAdapter } from './compiler/scanner/wiring/migrationInterfaceAdapter';
export type { ResourceField } from './types/upstream/resource';
export { typeExpressionToSemanticType } from './types/domain/typeExpressionSemanticType';
export * from './types/upstream/semanticDataflowRouteProjection';
export * from './types/upstream/semanticDataflowRequestProjection';

export type { ManifestBuilderInterface, ManifestBuilderInput, ManifestBuilderJudgment, ManifestBuilderCompleteJudgment, ManifestBuilderBlockedJudgment, ManifestBuilderOperationPreparationInterface } from './types/upstream/manifestBuilderInterface'
export { laravelRouteSourceSelectionAuthority } from './types/upstream/laravelRouteSourceSelection'
export type { LaravelRouteSourceSelectionIntent } from './types/upstream/laravelRouteSourceSelection'
export type { LaravelRouteSourceSelection, LaravelRouteSourceSelectionInterface } from './types/upstream/laravelRouteSourceSelection'
export { manifestBuilderOperationPreparation } from './compiler/scanner/wiring/upstreamManifestBuilder'
export type { ServiceGraphBuilderInterface } from './graph/ServiceGraphBuilderInterface'
export { routeSyncManifestGraphSurfaceFromFlow } from './graph/RouteSyncManifestGraphProjection'
export type { RouteSyncManifestGraphSurface, RouteSyncManifestGraphProjectionInterface } from './graph/RouteSyncManifestGraphProjectionInterface'

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
export type { DomainIntentCapabilityKind, DomainIntentCapabilityEvidence, DomainIntentOperationReference, AggregateCollectionIntentCapability, GenericDomainIntentCapability, DomainIntentCapabilityAlgebraInterface, DomainIntentCapabilityContract, DomainIntentCapabilityInterface, DomainIntentCapabilityConsumerInterface, DomainIntentCapabilityReference } from './types/upstream/domainIntentCapability';
export { domainIntentCapabilityFromRuntimeConfig, domainIntentCapabilitiesFromFrontend, domainIntentCapabilityReferenceFromCapability } from './types/upstream/domainIntentCapability';
export type { RouteParameterCapabilityEvidence, RouteParameterCapabilityAlgebraInterface, RouteParameterCapabilityContract, RouteParameterCapabilityInterface, RouteParameterCapabilityConsumerInterface, RouteParameterCapabilityReference } from './types/upstream/routeParameterCapability';
export { routeParameterCapabilityFromRoute, routeParameterCapabilityReferenceFromCapability, routeParameterCapabilityReferenceFromRoute, routeParameterCapabilityReferencesFromRoute, routeTargetScopeFromRoute } from './types/upstream/routeParameterCapability';
export { operationIdentityCapabilityAlgebra } from './types/upstream/operationIdentityCapabilityAlgebra';
export { createOperationIdentityCapabilityAuthority, operationIdentityCapabilityAuthority, operationIdentityCapabilityFromRoute, materializeOperationIdentityCapability } from './types/upstream/operationIdentityCapabilityAuthority';
export { operationIdentityProjection } from './compiler/scanner/wiring/operationIdentityProjection';
export type { ResourceModelKeyCapabilityProjectionInterface } from './types/upstream/resourceModelKeyCapability';
export type { ResourceGroupCapabilityAlgebraInterface, ResourceGroupCapabilityContract, ResourceGroupCapabilityEvidence, ResourceGroupExecutionSlots, ResourceGroupRouteReference, ResourceGroupShape, ResourceGroupSlotDecision } from './types/upstream/resourceGroupCapability';

export type { OperationIdentityProjectionAlgebraInterface, OperationIdentityProjectionContract, OperationIdentityProjectionInterface } from './types/interfaces/operationIdentityProjectionInterface';

export type { SemanticMappingDirection, SemanticMappingKind, SemanticMappingField, SemanticReadMapperContract, SemanticWriteMapperField, SemanticWriteMapperContract, SemanticMappingEvidence, SemanticMappingContractInterface, SemanticMappingContract, MapperContract, MapperInterface, MapperConsumerInterface, MapperWiringInterface, SemanticMappingConsumerInterface, SemanticMappingWiringInterface } from './types/upstream/semanticMapping'

export type { MapperProjectionTarget, MapperProjectionAlgebraInterface, MapperProjectionContract, MapperProjectionInterface } from './types/interfaces/mapperProjectionInterface'

// Phase 1408: closed upstream source-evidence and route-action identity contracts.
export type { SourceAstEvidenceKind, SourceAstFileEvidence, SourceAstEvidenceAcquisitionContract, SourceAstEvidenceAcquisitionInterface } from './types/upstream/sourceAstEvidenceAcquisitionInterface';
export type { RouteActionIdentityCandidate, RouteActionIdentityResolution, RouteActionIdentityCapabilityContract, RouteActionIdentityCapabilityInterface } from './types/upstream/routeActionIdentityCapability';
export { routeActionIdentityCapabilityAuthority } from './types/upstream/routeActionIdentityCapabilityAuthority';

// Phase 1410: semantic source-origin classification is owned by upstream reasoning.
export type { SourceAstSemanticOriginEvidence, SourceAstSemanticOriginJudgment, SourceAstSemanticOriginInterface } from './types/upstream/sourceAstSemanticOriginInterface';
export { sourceAstSemanticOriginAuthority } from './compiler/semantic/sourceAstSemanticOriginAuthority';

// Phase 1512: declarative query-operation semantic rule contracts.
export { validateQueryOperationSemanticRuleCatalog } from './types/upstream/queryProducerSemanticInterface';
export { queryOperationSemanticRuleRequirements } from './types/upstream/queryProducerSemanticInterface';
export { queryOperationSemanticRules } from './types/upstream/queryProducerSemanticReasoning';
export type { QueryOperationSemanticPremise, QueryOperationSemanticConstraint, QueryOperationSemanticRule, QueryOperationSemanticRuleFamily, QueryOperationSemanticRuleDeclarationFor, QueryOperationEvidence, QueryOperationSemanticRuleDeclaration, QueryOperationSemanticRuleExecution, QueryOperationSemanticRuleCatalogValidation, QueryOperationSemanticDerivationFor, QueryOperationSemanticDerivation, QueryOperationSemanticDecisionFor, QueryOperationSemanticDecision, QueryOperationSemanticEvidenceAnchor, QueryOperationSemanticObligationReceipt, QueryOperationSemanticSatisfiedReceipt, QueryOperationSemanticEvaluatedReceipt, QueryOperationSemanticPremiseFor, QueryOperationSemanticConstraintFor, QueryOperationSemanticObligationLedgerFor, QueryOperationSemanticSatisfiedObligationLedgerFor, QueryOperationSemanticEvaluatedObligationLedgerFor, QueryOperationSemanticDerivationJudgmentFor, QueryOperationSemanticDerivationJudgment, QueryOperationSemanticExecutorRequest, QueryOperationSemanticExecutorTable, QueryOperationSemanticEvidenceBoundExecution, QueryOperationSemanticRuntimeAuthority, QueryOperationSemanticSourceEvidence, QueryOperationSemanticProvenanceJudgmentFor, QueryOperationSemanticProvenanceJudgment, QueryOperationSemanticOwnedExecutionPlanFor, QueryOperationSemanticOwnedExecutionPlan, QueryOperationSemanticRuntimeClaim, QueryProducerSemanticInterface } from './types/upstream/queryProducerSemanticInterface';

// Phase 2421: explicit assembly of the existing RequestType semantic capabilities.
export { createRequestTypeDerivationSemanticPipelineAssembler } from './compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler';
export { createRequestTypeDerivationOperationPreparation } from './compiler/semantic/request-type-derivation/requestTypeDerivationOperationPreparation';
export type { RequestTypeDerivationOperationPreparationInterface, RequestTypeDerivationRuntimeExecutionResult, RequestTypeDerivationJudgmentConsumerInterface } from './types/upstream/requestTypeDerivationInterface';
export type { RequestTypeDerivationSourceEvidenceInventoryInterface, RequestTypeCanonicalIdentity, RequestTypeCanonicalRouteIdentity, RequestTypeCanonicalResourceIdentity, RequestTypeCanonicalRequestIdentity } from './types/upstream/requestTypeDerivationInterface';
export type { RequestTypeDerivationSemanticInputPreparation, RequestTypeDerivationSemanticInputPreparationInterface, RequestTypeDerivationIdentityCollisionInventory } from './types/upstream/requestTypeDerivationInterface';
export {
  requestTypeDerivationSourceEvidenceInventory,
  requestTypeDerivationSourceEvidenceKeys,
  requestTypeDerivationDuplicateIdentityWitnesses, requestTypeDerivationIdentityCollisionInventory,
  inventoryRequestTypeDerivationSourceEvidence,
  canonicalRouteIdentity,
  canonicalResourceIdentity,
  canonicalRequestIdentity,
  canonicalRouteOccurrenceKey,
  canonicalResourceOccurrenceKey,
  canonicalRequestOccurrenceKey,
} from './compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory';
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
  RequestTypeRequestEvidenceReference,
} from './types/upstream/requestTypeDerivationInterface';
export { requestTypeDerivationRequestResolution, requestTypeRequestCandidateSelection } from './compiler/semantic/request-type-derivation/requestTypeDerivationRequestResolution';
export { requestTypeDerivationRequestResolutionInventory } from './compiler/semantic/request-type-derivation/requestTypeDerivationRequestResolutionInventory';
export { prepareRequestTypeDerivationSemanticInput, requestTypeDerivationSemanticInputPreparation } from './compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation';
export { requestTypeDerivationRequestResolutionAssessment } from './compiler/semantic/request-type-derivation/requestTypeDerivationRequestResolutionAssessment';
export { requestTypeResourceCandidateSelection, requestTypeDerivationResourceResolution } from './compiler/semantic/request-type-derivation/requestTypeDerivationResourceResolution';
export { requestTypeDerivationResourceResolutionInventory } from './compiler/semantic/request-type-derivation/requestTypeDerivationResourceResolutionInventory';
export { requestTypeDerivationResourceResolutionAssessment } from './compiler/semantic/request-type-derivation/requestTypeDerivationResourceResolutionAssessment';
export type { RequestTypeDerivationRequestResolutionInterface, RequestTypeRequestCandidateSelectionInterface, RequestTypeRequestCandidateSelection, RequestTypeRequestResolution, RequestTypeRequestEvidenceReference } from './types/upstream/requestTypeDerivationInterface';
export { createSourceOccurrenceGuardedRequestTypeDerivationProofVerifier, REQUEST_TYPE_SOURCE_OCCURRENCE_GUARDED_LAWS } from './compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification';

// Phase 1588: opt-in authority-backed RouteManifest projection. This path
// requires a proof-producing semantic pipeline and never falls back to legacy inference.
export { createAuthorityBackedRouteManifestProjection } from './compiler/scanner/wiring/routeManifestProjectionAuthority';
export type { AuthorityBackedRouteManifestProjectionInterface, AuthorityBackedRouteManifestProjectionResult } from './compiler/scanner/wiring/routeManifestProjectionAuthority';

// Canonical invocation semantic pipeline, inventory/publication authorities, and integrated-response scanner boundary.
export { INVOCATION_STATIC_SEMANTIC_ALGEBRA_CONTRACT, INVOCATION_SEMANTIC_PIPELINE_CONTRACT, INVOCATION_SEMANTIC_SCANNER_BOUNDARY_CONTRACT, INVOCATION_SEMANTIC_JUDGMENT_TRACE_CONTRACT, INVOCATION_SEMANTIC_COVERAGE_CONTRACT, INVOCATION_STATIC_JUDGMENT_MODEL_CONTRACT, INVOCATION_STATIC_TARGET_RESOLUTION_CONTRACT, INVOCATION_STATIC_ARGUMENT_AND_EFFECT_CONTRACT, INVOCATION_STATIC_SEMANTIC_JUDGMENT_CONTRACT, INVOCATION_STATIC_JUDGMENT_COMPATIBILITY_CONTRACT, INVOCATION_STATIC_SEMANTIC_AUTHORITY_VALIDATION_CONTRACT } from './types/upstream/invocationSemanticPipelineInterface';
export { invocationSemanticPipeline, createInvocationSemanticIntegratedResponseComposition, invocationSemanticIntegratedResponseComposition } from './types/upstream/invocationSemanticPipeline';
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
export type { LaravelSourceAstProjectionJudgment, LaravelSourceAstPipelineExecutionInput } from './types/upstream/laravelSourceAstPipelineInterface'
export type { LaravelRouteScannerInterface, LaravelRouteScannerAuthorityInterface, LaravelRouteScanOperationInterface, LaravelRouteScanInput, LaravelRouteScanJudgment, LaravelRouteScanArtifact, LaravelRouteScanOutcome, LaravelRouteScanBlockedJudgment, LaravelRouteScanPolicyBlockedJudgment, LaravelRouteScanResponseBlockedJudgment, LaravelRouteSourceFileObservation, LaravelRouteMethod, LaravelResourceRouteMethod, LaravelStandardRouteMethod, LaravelRouteDeclarationMethodJudgment, LaravelRouteDeclarationMethodJudgmentInput, LaravelRouteDeclarationMethodJudgmentAuthority } from './types/upstream/laravelRouteScannerInterface';
export type { RouteResourceFlowAuthority, RouteResourceFlowJudgment, RouteResourceFlowPlan, RouteResourceActionPlan, RouteResourceMode, RouteResourceDeclarationInput } from './types/upstream/routeResourceFlow';
export type { LaravelRouteAuthorizationSemanticJudgment, LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface } from './types/upstream/routeAuthorizationSemanticJudgmentInterface';
export { laravelRouteDeclarationMethodSemanticAuthority } from './types/upstream/laravelRouteDeclarationMethodSemanticAuthority';
export { LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_BOUNDARY_CONTRACT } from './types/upstream/laravelControllerScannerInterface';
export type { LaravelControllerScannerInterface, LaravelControllerScanInput, LaravelControllerScanJudgment, LaravelControllerScanArtifact, ControllerResourceBindingEvidence, ControllerDeclarationSelectionBlocker, ControllerDeclarationSelectionInventoryOutcome, LaravelControllerInvocationSemanticBoundaryContract } from './types/upstream/laravelControllerScannerInterface';
export type { LaravelControllerFormRequestBindingEvidence, LaravelControllerRequestParameterEvidence, LaravelControllerRequestBindingEvidence, LaravelControllerRequestBindingEvidenceProjectionInterface, LaravelControllerRequestSemanticBindingAuthorityInterface } from './types/upstream/laravelControllerRequestSemanticBindingInterface';
export { laravelControllerRequestSemanticBindingAuthority } from './types/upstream/laravelControllerRequestSemanticBindingAuthority';
export { controllerActionProjectionMigration } from './types/upstream/laravelControllerActionSemanticJudgmentInterface';
export type { LaravelControllerActionSemanticJudgmentInput, LaravelControllerActionSemanticKnowledge, LaravelControllerActionBodySemanticKnowledge, LaravelControllerActionProjectionRemainder, LaravelControllerActionDerivationOwnershipObligation, LaravelControllerActionProjectionMigration, LaravelControllerActionContractResolverInput, LaravelControllerActionContractResolverInterface, LaravelControllerActionSemanticJudgment, LaravelControllerActionSemanticJudgmentContract, LaravelControllerActionSemanticJudgmentInterface, LaravelControllerActionSemanticJudgmentPublication, LaravelControllerActionSemanticJudgmentAuthorityInterface, LaravelControllerRequestSemanticBinding, UnresolvedPhpParameterTypeJudgment } from './types/upstream/laravelControllerActionSemanticJudgmentInterface';
export type { ControllerDeclarationParentEvidence, ControllerDeclarationMethodVisibility, ControllerDeclarationMethodCandidate, ControllerDeclarationAttributeCandidate, ControllerDeclarationSemanticCandidate, ControllerDeclarationSemanticSubject, ControllerDeclarationSemanticCorrespondence, ControllerDeclarationAncestryTermination, ControllerDeclarationSemanticSelection, ControllerDeclarationSemanticJudgment, ControllerDeclarationSemanticJudgmentAuthorityInterface } from './types/upstream/controllerDeclarationSemanticJudgmentInterface';
export type { PhpQualifiedClassName, PhpClassImportBinding, PhpClassNameResolution, PhpClassNameResolutionContext, PhpClassNameResolutionInput, PhpClassNameResolutionRuleInterface } from './types/upstream/phpClassNameResolutionInterface';
export { createPhpQualifiedClassName } from './types/upstream/phpClassNameResolutionInterface';
export { phpClassNameResolutionAuthority } from './types/upstream/phpClassNameResolutionAuthority';
export { controllerDeclarationSemanticJudgmentAuthority } from './types/upstream/controllerDeclarationSemanticJudgmentAuthority';
export { controllerDeclarationSelectionInventoryClosureAuthority } from './types/upstream/controllerDeclarationSelectionInventoryClosureAuthority';
export type { ControllerDeclarationSelectionInventoryBlocker, ControllerDeclarationSelectionInventoryClosure, ControllerDeclarationSelectionInventoryClosureAuthorityInterface } from './types/upstream/controllerDeclarationSelectionInventoryClosureInterface';
export type { ControllerPolicyActionScopeJudgmentInterface } from './types/upstream/controllerPolicyActionScopeJudgmentInterface';
export type { ControllerPolicyActionScopeJudgment, ControllerPolicyActionScopeBlockReason, ControllerPolicyNamedScopeArgument } from './types/upstream/controller';
export { controllerPolicyActionScopeJudgmentAuthority } from './types/upstream/controllerPolicyActionScopeJudgmentAuthority';
export type { LaravelControllerInvocationSemanticInput, LaravelControllerInvocationSemanticJudgment, LaravelControllerInvocationSemanticJudgmentContract, LaravelControllerInvocationSemanticJudgmentInterface, LaravelControllerInvocationSemanticJudgmentAuthorityDependencies, LaravelControllerInvocationSemanticJudgmentAuthorityInterface } from './types/upstream/laravelControllerInvocationSemanticJudgmentInterface';
export type { LaravelControllerAstProjectionContext, LaravelControllerAstProjectionResponseJudgment, LaravelControllerAstProjectionSemanticJudgment, LaravelControllerAstProjectionSemanticAuthorityInterface } from './types/upstream/laravelControllerInvocationSemanticJudgmentInterface';
export { laravelControllerAstProjectionSemanticAuthority } from './types/upstream/laravelControllerAstProjectionSemanticAuthority';
export type { LaravelControllerSourceInventoryCompletenessWitness, LaravelControllerSourceInventoryInterface, LaravelControllerSourceDiscoveryBlocker, LaravelControllerSourceDiscoveryResult, LaravelControllerSourceDiscoveryInput, LaravelControllerSourceDiscoveryInterface, LaravelControllerInvocationSemanticJudgmentInventoryRejection, LaravelControllerInvocationSemanticJudgmentInventoryInput, LaravelControllerInvocationSemanticJudgmentInventoryCompletenessWitness, LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt, LaravelControllerInvocationSemanticJudgmentInventoryResult, LaravelControllerInvocationSemanticJudgmentInventoryProjectBindingRule, LaravelControllerInvocationSemanticJudgmentInventoryCompletenessRule, LaravelControllerInvocationSemanticJudgmentInventorySourceIdentityRule, LaravelControllerInvocationSemanticJudgmentInventoryCorrespondenceRule, LaravelControllerInvocationSemanticJudgmentInventoryOutcomePreservationRule, LaravelControllerInvocationSemanticJudgmentInventoryRejectionAggregationRule, LaravelControllerInvocationInventoryProjectBindingJudgment, LaravelControllerInvocationInventoryCompletenessJudgment, LaravelControllerInvocationInventorySourceIdentityJudgment, LaravelControllerInvocationInventoryCorrespondenceJudgment, LaravelControllerInvocationSemanticJudgmentInventoryContract, LaravelControllerInvocationSemanticJudgmentInventoryReasoningContract, LaravelControllerInvocationSemanticJudgmentInventoryReasoningInterface, LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface } from './types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface';
export { LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT, LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT } from './types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface';
export { laravelControllerInvocationSemanticJudgmentInventoryAuthority } from './types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority';
export { LaravelControllerInvocationSemanticJudgmentAuthority, laravelControllerInvocationSemanticJudgmentAuthority, LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT } from './types/upstream/laravelControllerInvocationSemanticJudgmentAuthority';
export type { LaravelModelScannerInterface, LaravelModelScanInput, LaravelModelScanJudgment, LaravelModelScanArtifact } from './types/upstream/laravelModelScannerInterface';
export type { ModelProducerInterface, ModelProducerInput, ModelProducerResult } from './types/upstream/modelProducerInterface';
export type { LaravelFormRequestScannerInterface, LaravelFormRequestScanInput, LaravelFormRequestScanJudgment, LaravelFormRequestScanArtifact } from './types/upstream/laravelFormRequestScannerInterface';
export type { LaravelResourceScannerInterface, LaravelResourceSourceEvidence, ResourceSourceEvidenceScannerInterface, LaravelResourceScanInput, LaravelResourceScanJudgment, LaravelResourceScanArtifact, LaravelResourceScanArtifactSequence, LaravelResourceIntegratedResponse, LaravelResourceResolvedArtifact, LaravelResourceRejectedArtifact, ResolvedResourceModelBindingJudgment, LaravelResourceIntegratedResponseContract } from './types/upstream/laravelResourceScannerInterface';
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
export { LARAVEL_CONTROLLER_RESPONSE_DTO_DECLARATION_RESOLUTION_CONTRACT, laravelControllerResponseDtoDeclarationResolutionAuthority, laravelControllerResponseDtoDeclarationResolutionRuntimeExecutor } from './types/upstream/laravelControllerResponseDtoDeclarationResolutionAuthority';
export type { LaravelControllerResponseEvidenceProductionContract, LaravelControllerResponseEvidenceProductionInput, LaravelControllerResponseEvidenceProductionInterface, LaravelControllerResponseEvidenceProductionInventory, LaravelControllerResponseEvidenceProductionObservation, LaravelControllerResponseEvidenceProductionEvidence, LaravelControllerResponseEvidenceProductionSourceCorrelation, LaravelControllerResponseEvidenceProductionSourceCorrelationJudgment, LaravelControllerResponseEvidenceProductionSourceCorrelationRejectedJudgment, LaravelControllerResponseDeclarationSourceCorrelationInput, LaravelControllerResponseReferenceCandidateEvidence, LaravelControllerResponseEvidenceSourceBindingAuthorityInterface, LaravelControllerResponseEvidenceSourceBindingContract, LaravelControllerResponseEvidenceSourceBindingEntry, LaravelControllerResponseEvidenceSourceBindingInput, LaravelControllerResponseEvidenceSourceBindingJudgment, LaravelControllerResponseEvidenceSourceBindingJudgmentFromInput, LaravelControllerResponseEvidenceSourceBindingRejectedJudgment, LaravelControllerResponseSemanticBlocker, LaravelControllerResponseSemanticEvidence, LaravelControllerResponseSemanticEvidenceForSource, LaravelControllerResponseSemanticJudgment, LaravelControllerResponseSemanticJudgmentAuthorityInterface, LaravelControllerResponseSemanticJudgmentContract, LaravelControllerResponseSemanticJudgmentFor, LaravelControllerResponseSemanticJudgmentFromInput, LaravelControllerResponseSemanticJudgmentInput, LaravelControllerResponseSemanticProduct, LaravelControllerResponseSemanticRuntimeExecutorInterface, LaravelControllerResponseSemanticPipelineInterface, LaravelControllerResponseSemanticPipelineContract } from './types/upstream/laravelControllerResponseSemanticJudgmentInterface';
export type { LaravelControllerInvocationResponseWiringArtifact, LaravelControllerInvocationResponseWiringInterface, LaravelControllerInvocationResponseWiringResult } from './types/upstream/laravelControllerInvocationResponseWiringInterface';

// PHP whole-file frontend contracts and the typed vocabulary consumed by parser adapters.
export type { Expression, ExpressionArgument, ExpressionArguments } from './types/upstream/expression';
export type { Sequence } from './semantic/relations/relationalSequence';
export { stringValue, numberValue, type StringValue, type NumberValue } from './types/upstream/valueObjects';
export { createSourceFile } from './types/upstream/names';
export type { FunctionName, SourceFile } from './types/upstream/names';
export type { SourceSpan } from './types/upstream/provenance';
export * from './types/upstream/phpFunctionNameResolutionInterface';
export * from './types/upstream/phpSourceFrontendInterface';
export * from './types/upstream/phpSourceDocumentIdentityBindingInterface';
export { PHP_SOURCE_DOCUMENT_IDENTITY_BINDING_CONTRACT, phpSourceDocumentIdentityBinding } from './types/upstream/phpSourceDocumentIdentityBindingAuthority';

export { phpSourceFrontendExtractionValidationAuthority } from './types/upstream/phpSourceFrontendExtractionValidationAuthority';
export { phpFunctionResolutionSourceInventoryAuthority } from './types/upstream/phpFunctionResolutionSourceInventoryAuthority';
export { phpFunctionResolutionEnvironmentProjectionAuthority } from './types/upstream/phpFunctionResolutionEnvironmentProjectionAuthority';
export { phpFunctionNameResolutionAuthority } from './types/upstream/phpFunctionNameResolutionAuthority';
export { phpFunctionInvocationSemanticJudgmentBatchClosureAuthority } from './types/upstream/phpFunctionInvocationSemanticJudgmentBatchClosureAuthority';
export { createPhpSourceInvocationSemanticPipelineAuthority } from './types/upstream/phpSourceInvocationSemanticPipelineAuthority';
export * from './types/upstream/phpSourceInvocationSemanticPipelineInterface';
export type { PhpSourceInvocationSemanticSourceBindingInput, PhpSourceInvocationSemanticSourceBindingJudgment, PhpSourceInvocationSemanticSourceBindingContract, PhpSourceInvocationSemanticSourceBindingAuthorityInterface } from './types/upstream/phpSourceInvocationSemanticSourceBindingInterface';
export { phpSourceInvocationSemanticSourceBindingAuthority, PHP_SOURCE_INVOCATION_SEMANTIC_SOURCE_BINDING_CONTRACT, phpSourceInvocationPipelineEvidenceFromSourceBinding } from './types/upstream/phpSourceInvocationSemanticSourceBindingAuthority';

export * from './types/upstream/phpSourceInvocationSemanticPipelineDeliveryInterface';

export { createLaravelControllerResponseSemanticPipeline, laravelControllerResponseSemanticPipeline } from './types/upstream/laravelControllerResponseSemanticPipeline';

export type { ControllerParameterClassNameRule, ControllerParameterClassNameReasoningContract, ControllerParameterClassNameJudgment, ControllerParameterClassNameJudgmentInterface } from './types/upstream/controllerParameterClassNameJudgmentInterface';

export type { ControllerBodySemanticJudgment, ControllerBodySemanticJudgmentAuthorityInterface } from './types/upstream/controllerBodySemanticJudgmentInterface';
export type { ControllerActionSchemaRequestEvidence, ControllerActionSchemaDerivation, ControllerActionSchemaSemanticJudgment, ControllerActionSchemaSemanticJudgmentAuthorityInterface } from './types/upstream/controllerActionSchemaSemanticJudgmentInterface';
export { controllerActionSchemaSemanticJudgmentAuthority } from './types/upstream/controllerActionSchemaSemanticJudgmentAuthority';
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
export { createIntegratedRouteManifestAuthority } from './compiler/scanner/wiring/integratedRouteManifestAuthority';
export type { IntegratedRouteManifestAuthorityInterface, IntegratedRouteManifestAuthorityResult } from './compiler/scanner/wiring/integratedRouteManifestAuthority';
export { routeManifestProjectionCompositionFactory } from './compiler/scanner/wiring/routeManifestProjectionComposition';
export type { RouteManifestProjectionCompositionFactoryInterface } from './compiler/scanner/wiring/routeManifestProjectionComposition';
export type { RouteManifestProjectionCompositionInterface, RouteManifestProjectionCompositionResult } from './compiler/scanner/wiring/routeManifestProjectionComposition';

export type { ResourceModelResolutionOrigin, ResourceModelResolutionFact, ResourceRelationKnowledgeFact, ResourceModelKnowledgeDataFlow } from './types/upstream/resourceModelKnowledgeDataFlowInterface';

export type { ResourceBinaryOperatorMappingOperationInterface, ResourceBinaryOperatorSourceKind } from './types/upstream/resourceBinaryOperatorInterface';
export type { ResourceAstExpressionMappingInput, ResourceAstExpressionMappingOperationInterface, ResourceAstExpressionMappingAuthorityInterface } from './types/upstream/resourceAstExpressionMappingInterface';
export { resourceBinaryOperatorMapping } from './compiler/semantic/resourceBinaryOperatorAuthority';

export type { PropertyProducerContext, PropertyProducerInput, PropertyProducerInterface } from './types/upstream/propertyProducerInterface';

export type { ExpressionFromPhpAstInput, ExpressionFromPhpAstOperationInterface, ExpressionProducerInput, ExpressionProducerInterface, ExpressionAstFromPhpAstInput, ExpressionAstFromPhpAstOperationInterface } from './types/upstream/expressionProducerInterface';

export type { TypeHasherInterface, TypeHashContext, TypeHashEntry } from './types/upstream/typeHasherInterface';
export { requestTypeDerivationProductionPipelineAssembler, requestTypeDerivationSemanticPipelineRequirement, requestTypeDerivationSemanticPipelineResolution } from './compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition';
export type { RequestTypeDerivationProductionPipelineAssemblerInterface, RequestTypeDerivationSemanticPipelineRequirementInterface } from './compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition';
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
export { createRequestTypeDerivationAuthorityIntegrityGate } from './compiler/semantic/request-type-derivation/requestTypeDerivationAuthorityIntegrityGate';
export type { RequestTypeDerivationAuthorityIntegrityGateInterface, RequestTypeDerivationAuthorityIntegrityGateResult } from './types/upstream/requestTypeDerivationInterface';
export { createRequestTypeDerivationSemanticAuthorityIntegrity } from './compiler/semantic/request-type-derivation/requestTypeDerivationAuthorityIntegrity';

export { routeConstraintArgumentAlgebra, matchRouteConstraintArgument } from './types/upstream/routeConstraints'
export type { RouteConstraintArgumentAlgebraInterface, RouteConstraintArgumentVisitor, RouteConstraintArgument, RouteConstraintFact, RouteConstraintContract, RouteConstraintFlow, RouteConstraintMatcher, RouteConstraintAllowedValue, RouteConstraintSource, RouteConstraintSyntaxMethod } from './types/upstream/routeConstraints'

export { requestTypeDerivationSemanticReasoning, requestTypeDerivationIdentityConflictLedgerVerification } from './compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning';
export type { RequestTypeDerivationIdentityConflictLedgerVerificationInterface } from './compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning';
export { requestTypeDerivationProofVerifier } from './compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier';
export { requestTypeDerivationGroupContributionAlgebra } from './compiler/semantic/request-type-derivation/requestTypeDerivationGroupContributionAlgebra';
export type { RequestTypeGroupFoldInput, RequestTypeGroupContributionAlgebraInterface, RequestTypeGroupContributionReceipt, RequestTypeGroupReceipt } from './types/upstream/requestTypeDerivationInterface';
export { RequestTypeDerivationSemanticProducerGapError } from './compiler/semantic/request-type-derivation/requestTypeDerivationSemanticProducerGap';
export { requestTypeDerivationSemanticComposition, requestTypeDerivationSemanticDecision, requestTypeDerivationSemanticAuthority, requestTypeDerivationSemanticAuthorityIntegrity } from './compiler/semantic/request-type-derivation/requestTypeDerivationSemanticComposition';
