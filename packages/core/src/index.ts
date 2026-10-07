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
  ResponseDescriptorBase,
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
export { SymbolTable, ModelSymbol } from './semantic/SymbolTable'

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
  SourceStream,
  tokenizePhpSource,
  parsePhpArray,
  classifyAstTokens,
  classifyAstValue,
  LaravelSourceLexer
} from './compiler/scanner/LaravelSourceLexer'

export { createLaravelSourceProjectIdentity } from './types/upstream/sourceProjectIdentity'
export { scanRouteSyncManifest, scanRouteSyncManifestFlow, routeSyncManifestFlowFromManifest, routeSyncManifestFlowProjection } from './compiler/scanner/orchestrator/upstreamManifestScanner'
export type { RouteSyncManifestFlowProjectionInterface } from './compiler/scanner/orchestrator/RouteSyncManifestFlowProjectionInterface'
export { analyzeSemanticDataflowInput } from './compiler/analysis/semanticDataflowPipeline'
export { analyzeRouteSyncManifestDataflow, analyzeRouteSyncManifestDataflowWithPolicy } from './compiler/analysis/routeSyncDataflowAnalysis'
export { routeSyncManifestDataflowSurfaceFromFlow } from './compiler/analysis/routeSyncManifestDataflowProjection'
export type { RouteSyncManifestDataflowSurface, RouteSyncManifestDataflowProjectionInterface, RouteSyncManifestDataflowControllerSurface } from './compiler/analysis/routeSyncManifestDataflowProjectionInterface'
export type { SemanticDataflowRuntimeBoundary } from './compiler/analysis/semanticDataflowRuntimeBoundary'
export { semanticDataflowRuntimeBoundary } from './compiler/analysis/semanticDataflowRuntimeComposition'
export type { ControlFlowSolverInterface, ControlFlowDataFlowInterface, DataFlowAnalysisInterface } from './compiler/analysis/dataflow/controlFlowDataFlowInterface'
export type { DataFlowInterface, DataFlowSourceInterface, DataFlowStepInterface, DataFlowFixpointInterface, DataFlowStateInterface, DataFlowQueryInterface } from './types/dataflow'
export type { SemanticDataflowIdentity, SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowFact } from './types/upstream/semanticDataflow'
export { semanticDataflowIdentityEqual } from './types/upstream/semanticDataflow'
export { createSemanticDataflowJudgment } from './types/upstream/semanticDataflowAuthority'
export type { DataFlowProjectionInterface } from './types/dataflow'
export type { InterfaceDependencyBoundary } from './types/interfaces'
export { createDataFlowConfig } from './compiler/analysis/dataflow/dataFlowConfigInterface'
export { composeDataFlowConfigContributors } from './compiler/analysis/dataflow/dataFlowConfigContributorInterface'
export { selectDataFlowFacts } from './compiler/analysis/dataflow/dataFlowFactPolicyInterface';
export { createSemanticDataflowAnalysisPolicy, semanticDataflowFlowsUnderPolicy } from './compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy';
export type { DataFlowFactPolicyInterface } from './compiler/analysis/dataflow/dataFlowFactPolicyInterface';
export type { DataFlowConfigInterface, DataFlowSourcePredicateInterface, DataFlowSinkPredicateInterface, DataFlowAdditionalStepInterface, DataFlowBarrierInterface } from './compiler/analysis/dataflow/dataFlowConfigInterface'
export { liftDataFlowConfigToState } from './compiler/analysis/dataflow/dataFlowStateConfigInterface'
export { createSemanticDataflowRequestStateConfig, createSemanticDataflowStatePolicy } from './compiler/analysis/dataflow/semanticDataflowStatePolicy'
export type { SemanticDataflowRequestState, SemanticDataflowStatePolicy } from './compiler/analysis/dataflow/semanticDataflowStatePolicy'
export type { DataFlowStateConfigInterface } from './compiler/analysis/dataflow/dataFlowStateConfigInterface'
export type { DataFlowConfigContribution, DataFlowConfigContributorInterface } from './compiler/analysis/dataflow/dataFlowConfigContributorInterface'

export { lowerRouteSyncManifestToRouteManifest } from './compiler/scanner/wiring/routeManifestLowerer'
export { projectRouteSyncManifestForRouteManifest, routeManifestProjection } from './compiler/scanner/wiring/routeManifestProjection'
export type { RouteManifestProjection, RouteManifestProjectionInterface } from './compiler/scanner/wiring/routeManifestProjectionInterface'
export type { RouteManifest } from './compiler/scanner/wiring/routeManifestInterface'
export { IdentifierCase, extractClassBasename, inferLaravelTableName } from './utils/resource-naming'
export {
  ScannedObjectProperty,
  PrimitiveKind,
  PrimitiveType,
  JsonValueType,
  ObjectType,
  ReferenceType,
  UnionType,
  IntersectionType,
  ReadonlyCollectionType,
  MutableCollectionType,
  OptionalType,
  NullableType,
  CollectionKind
} from './types/domain/semanticType'

export {
  ResolvedPhpType,
  PrimitivePhpType,
  EloquentModelPhpType,
  ResourceWrapperPhpType,
  VoidPhpType,
  UnknownPhpType,
  matchResolvedPhpType
} from './compiler/types/ResolvedPhpType'
export type { ResolvedPhpTypeVisitor } from './compiler/types/ResolvedPhpType'

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
  CompilerValidationError,
  DiagnosticCategory,
  DIAGNOSTIC_CATEGORY_REGISTRY,
  matchDiagnosticCategory
} from './compiler/diagnostics'
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
export { ModelSymbolTable, OriginModelSymbol } from './compiler/scanner/symbols/ModelSymbolTable'
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

// Canonical upstream AST/semantic lowering boundary.
export type { ModelAst } from './types/upstream/ast';
export type { MigrationInterface } from './types/upstream/migrationInterface';
export type { GraphSemanticRelation, GraphSemanticNodeReference, GraphSemanticEdgeType, GraphSemanticRelationOrigin } from './graph/service/graphRelation';
export type { SchemaInterface } from './types/upstream/schema';
export type { ModelPrimaryKeyReconciliationInterface, ModelPrimaryKeyReconciliationStatus } from './types/upstream/modelPrimaryKey';
export { migrationInterfaceFromAst } from './compiler/scanner/wiring/migrationInterfaceAdapter';
export type { ResourceField } from './types/upstream/resource';
export { typeExpressionToSemanticType } from './types/domain/typeExpressionSemanticType';
export * from './types/upstream/semanticDataflowRouteProjection';
export * from './types/upstream/semanticDataflowRequestProjection';

export type { ManifestBuilderInterface } from './types/upstream/manifestBuilderInterface'
export { manifestBuilder } from './compiler/scanner/wiring/upstreamManifestBuilder'
export type { ServiceGraphBuilderInterface } from './graph/ServiceGraphBuilderInterface'
export { routeSyncManifestGraphSurfaceFromFlow } from './graph/RouteSyncManifestGraphProjection'
export type { RouteSyncManifestGraphSurface, RouteSyncManifestGraphProjectionInterface } from './graph/RouteSyncManifestGraphProjectionInterface'
