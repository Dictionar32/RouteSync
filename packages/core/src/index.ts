// Utils
export { camelCase, camelCaseKeys, snakeCase, snakeCaseKeys } from './utils'
export { ResourceNamingConvention, toPascalCase, toCamelCase, toSnakeCase } from './utils/resource-naming'

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
  ApiDefinition,
  RouteMapper,
  RouteSchema,
  RouteSchemaMap,
  RouteSchemaValue,
  RouteParserSchema,
  RouteTransform,
  RouteTransformMap,
  ResponseSchema
} from './types/request'
export {
  HttpMethod,
  RouteActionKind,
  RouteParameterLocation,
  RouteParameterType,
  ResponseShape,
  ResponseKind,
  ResourceResponseDescriptor,
  ModelResponseDescriptor,
  InlineResponseDescriptor,
  VoidResponseDescriptor,
  ResourceExpressionKind,
  EloquentRelationType,
  EloquentRelationClassifier,
  ELOQUENT_RELATION_REGISTRY,
  DatabaseColumnTypeMapper,
  ValidationRuleKind,
  ValidationRuleParser,
  ZOD_CONSTRAINT_REGISTRY,
  ZodSchemaReducer,
  EloquentCastKind,
  EloquentCastMapper,
  SecuritySchemeKind,
  RouteSecurityClassifier,
  ModelKeyType,
  RequestContentType,
  PaginationKind,
  BroadcastChannelKind,
  DatabaseColumnKind,
  HttpStatusCode,
  RouteHookKind,
  RoutePayloadMode,
  SdkResponseKind,
  InvalidationTargetKind,
  ScannedInvalidationTarget,
  ScannedRouteCacheInvalidationDescriptor,
  ScannedRouteExecutionSignature,
  ScannedSdkResponseResolution,
  ScannedPaginatedEnvelopeDescriptor,
  ScannedPolymorphicRelationDescriptor,
  ScannedRouteHookDescriptor,
  ResourceFieldExpressionFactory,
  ValidationRuleNodeFactory,
  ScannedRouteSecurityDescriptor,
  CRUD_DISPATCH_REGISTRY,
  classifyRoute,
  matchRoute,
  RouteDescriptorKind,
  ROUTE_DESCRIPTOR_REGISTRY,
  ScannedRouteRegistry,
  RESPONSE_DESCRIPTOR_REGISTRY,
  matchResponse,
  ValidationFieldKind,
  VALIDATION_FIELD_REGISTRY,
  matchValidationField,
  foldValidationField,
  SECURITY_SCHEME_REGISTRY,
  matchRouteSecurity,
  BROADCAST_CHANNEL_REGISTRY,
  matchBroadcastChannel,
  INVALIDATION_TARGET_REGISTRY,
  matchInvalidationTarget,
  PARAMETER_LOCATION_REGISTRY,
  matchRouteParameter,
  matchRelationCardinality,
  matchRelation,
  matchRelationType,
  SDK_RESPONSE_KIND_REGISTRY,
  matchSdkResponseResolution,
  matchSdkResponse,
  REQUEST_CONTENT_TYPE_REGISTRY,
  ScannedRequestContentTypeDescriptor,
  matchRequestContentType,
  PAGINATION_KIND_REGISTRY,
  matchPaginatedEnvelope,
  matchPaginationKind,
  ROUTE_PAYLOAD_MODE_REGISTRY,
  matchRouteExecutionSignature,
  matchRoutePayloadMode,
  DATABASE_COLUMN_KIND_REGISTRY,
  matchDatabaseColumnKind,
  ELOQUENT_CAST_REGISTRY,
  matchEloquentCastKind,
  PolymorphicMorphType,
  POLYMORPHIC_RELATION_REGISTRY,
  matchPolymorphicRelation,
  matchPolymorphicMorphType,
  HOOK_KIND_REGISTRY,
  matchRouteHookKind,
  matchHookKind,
  RESOURCE_EXPRESSION_REGISTRY,
  matchResourceFieldExpression,
  matchResourceExpression,
  VALIDATION_RULE_REGISTRY,
  matchValidationRule,
  matchRule
} from './types/route'
export type {
  RouteManifest,
  ParsedRoute,
  RouteDescriptor,
  RouteDescriptorRegistry,
  RouteKindSpecification,
  RouteCollectionRegistry,
  GetCollectionRouteDescriptor,
  GetItemRouteDescriptor,
  MutationRouteDescriptor,
  DeletionRouteDescriptor,
  RouteClassifier,
  RouteVisitor,
  ResponseDescriptorRegistry,
  ResponseKindSpecification,
  ResponseVisitor,
  SecuritySchemeSpecification,
  SecuritySchemeRegistry,
  RouteSecurityVisitor,
  InvalidationTarget,
  SelfListInvalidationTarget,
  ParentListInvalidationTarget,
  ParentDetailInvalidationTarget,
  AuthResourceInvalidationTarget,
  AnyInvalidationTarget,
  InvalidationTargetSpecification,
  InvalidationTargetRegistry,
  InvalidationTargetVisitor,
  RouteCacheInvalidationDescriptor,
  BaseRouteHookDescriptor,
  QueryHookDescriptor,
  MutationHookDescriptor,
  InfiniteQueryHookDescriptor,
  AnyRouteHookDescriptor,
  RouteHookDescriptor,
  HookKindSpecification,
  HookKindRegistry,
  RouteHookKindVisitor,
  RouteExecutionSignature,
  BaseRouteExecutionSignature,
  NoPayloadExecutionSignature,
  RequiredPayloadExecutionSignature,
  OptionalPayloadExecutionSignature,
  AnyRouteExecutionSignature,
  RoutePayloadModeSpecification,
  RoutePayloadModeRegistry,
  RouteExecutionSignatureVisitor,
  SdkResponseResolution,
  VoidSdkResponseResolution,
  RawSdkResponseResolution,
  ValidatedSdkResponseResolution,
  MappedSdkResponseResolution,
  ValidatedAndMappedSdkResponseResolution,
  AnySdkResponseResolution,
  SdkResponseKindSpecification,
  SdkResponseKindRegistry,
  SdkResponseResolutionVisitor,
  BaseRequestContentTypeDescriptor,
  JsonRequestContentTypeDescriptor,
  MultipartRequestContentTypeDescriptor,
  UrlEncodedRequestContentTypeDescriptor,
  NoneRequestContentTypeDescriptor,
  RequestContentTypeDescriptor,
  RequestContentTypeSpecification,
  RequestContentTypeRegistry,
  RequestContentTypeVisitor,
  CrudRole,
  RoutePolicyDescriptor,
  RateLimitDescriptor,
  BroadcastChannelDescriptor,
  PublicBroadcastChannelDescriptor,
  PrivateBroadcastChannelDescriptor,
  PresenceBroadcastChannelDescriptor,
  BroadcastChannelSpecification,
  BroadcastChannelRegistry,
  BroadcastChannelVisitor,
  RouteSecurityDescriptor,
  ParsedChannel,
  ParsedModel,
  ParsedColumn,
  SqlTypeFamily,
  DatabaseColumnKindSpecification,
  DatabaseColumnKindRegistry,
  DatabaseColumnKindVisitor,
  ParsedCast,
  EloquentCastKindSpecification,
  EloquentCastKindRegistry,
  EloquentCastKindVisitor,
  ParsedAccessor,
  ParsedRelation,
  SingleRelationDescriptor,
  CollectionRelationDescriptor,
  RelationCardinalityDescriptor,
  RelationCardinalityVisitor,
  EloquentRelationTypeVisitor,
  EloquentRelationDescriptor,
  EloquentRelationRegistry,
  EloquentRelationCardinality,
  PaginatedEnvelopeDescriptor,
  BasePaginatedEnvelopeDescriptor,
  LengthAwarePaginatedEnvelopeDescriptor,
  CursorPaginatedEnvelopeDescriptor,
  AnyPaginatedEnvelopeDescriptor,
  PaginationKindSpecification,
  PaginationKindRegistry,
  PaginatedEnvelopeVisitor,
  PolymorphicRelationDescriptor,
  BasePolymorphicRelationDescriptor,
  MorphToRelationDescriptor,
  MorphOneRelationDescriptor,
  MorphManyRelationDescriptor,
  MorphToManyRelationDescriptor,
  MorphedByManyRelationDescriptor,
  AnyPolymorphicRelationDescriptor,
  PolymorphicRelationSpecification,
  PolymorphicRelationRegistry,
  PolymorphicRelationVisitor,
  ResourceFieldDescriptor,
  BaseResourceFieldExpression,
  PrimitiveResourceExpression,
  ModelResourceExpression,
  ResourceResourceExpression,
  ObjectResourceExpression,
  ArrayResourceExpression,
  PropertyAccessResourceExpression,
  NullsafePropertyAccessResourceExpression,
  VariableResourceExpression,
  TypeCastResourceExpression,
  BinaryResourceExpression,
  MethodCallResourceExpression,
  StaticMethodCallResourceExpression,
  LiteralResourceExpression,
  UnknownResourceExpression,
  AnyResourceFieldExpression,
  ResourceExpressionCategory,
  ResourceExpressionSpecification,
  ResourceExpressionRegistry,
  ResourceFieldExpressionVisitor,
  ParsedResource,
  RouteParameter,
  PathParameterDescriptor,
  QueryParameterDescriptor,
  HeaderParameterDescriptor,
  AnyRouteParameter,
  RouteParameterLocationSpecification,
  RouteParameterLocationRegistry,
  RouteParameterVisitor,
  RouteQueryParameter,
  HttpErrorResponseDescriptor,
  ValidationFieldNode,
  ScalarValidationFieldNode,
  ArrayValidationFieldNode,
  ObjectValidationFieldNode,
  ValidationFieldSpecification,
  ValidationFieldRegistry,
  ValidationFieldVisitor,
  ValidationFieldFolder,
  InlineResponseDescriptorParams,
  BaseValidationRuleNode,
  RequiredValidationRuleNode,
  NullableValidationRuleNode,
  OptionalValidationRuleNode,
  StringValidationRuleNode,
  NumberValidationRuleNode,
  BooleanValidationRuleNode,
  ArrayValidationRuleNode,
  EmailValidationRuleNode,
  UrlValidationRuleNode,
  UuidValidationRuleNode,
  DateValidationRuleNode,
  MinValidationRuleNode,
  MaxValidationRuleNode,
  BetweenValidationRuleNode,
  InValidationRuleNode,
  ExistsValidationRuleNode,
  UniqueValidationRuleNode,
  FileValidationRuleNode,
  ImageValidationRuleNode,
  CustomValidationRuleNode,
  ValidationRuleNode,
  AnyValidationRuleNode,
  ValidationRuleCategory,
  ValidationRuleSpecification,
  ValidationRuleRegistry,
  ValidationRuleVisitor,
  RouteValidationRuleEntry,
  RouteMessageEntry,
  RouteAttributeEntry,
  RouteSchemaPayload,
  ZodNode,
  ExtractRule,
  ConstraintHandler,
  ConstraintRegistry
} from './types/route'
export { SemanticResolutionKernel as SemanticKernelV2Impl } from './semantic/SemanticResolutionKernel'
export { SemanticResolutionKernel } from './semantic/SemanticResolutionKernel'
export type { ModelNode as SemanticModelNode, ResolverMeta, ResolutionContext, ResolverPlugin } from './semantic/types'
export * from './types/semantic'
export * from './types/emit'
export { ServiceGraphBuilder } from './graph/ServiceGraphBuilder'

// IR v3 (CompilerRoadmap.md Stage 2)
export { buildSemanticIRNode, computeStableHash, IRNodeRegistry } from './ir/buildIRNode'
export type { BuildIRNodeInput } from './ir/buildIRNode'

// Unified FieldNode model (compiler/CompilerBacklog.md H1/H3 follow-up) — phase 1 of 3
export * from './types/field'

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
  PropertyType,
  PropertyDescriptor,
  ModelAttribute
} from './compiler/ir/ResponseArtifact'

// Scanner Module & Resource Naming
export * from './compiler/scanner/LaravelSourceLexer'
export * from './compiler/scanner/StaticLaravelScanner'
export { IdentifierCase, extractClassBasename, inferLaravelTableName } from './utils/resource-naming'
export {
  ScannedObjectProperty,
  PrimitiveKind,
  PrimitiveType,
  ObjectType,
  ReferenceType,
  UnionType,
  IntersectionType,
  ReadonlyCollectionType,
  MutableCollectionType,
  OptionalType,
  NullableType,
  CollectionKind
} from './compiler/types/SemanticType'

export { ContractActionGenerator } from './compiler/generators/contract-generation/ContractActionGenerator'
export { FormActionGenerator } from './compiler/generators/form-generation/FormActionGenerator'
export { defaultTypeResolver } from './compiler/domain/common/ResponseFieldLowering'
export {
  ResolvedObjectType,
  ResolvedOptionalType,
  ResolvedCollectionType,
  ResolvedPrimitiveType
} from './compiler/domain/common/ResolvedSemanticType'



