export * from './validationRules';

export * from './semanticResolution';
export * from './semanticResolutionFactory';

export * from './responseContracts';
export * from './semanticValueFactories';
export * from './modelValueFactories';

export * from './request';

export * from './boundAst';

export * from './objectPropertyOrigin';
export * from './resourceExpressionModel';
export * from './resourceBindingProvenance';
export * from './resourceBindingOrigin';
export * from './resourceBindingModel';

export * from './resourceQueryOperation';
export * from './resourceModelMethodMeaning';
export * from './resourceModelMethodSurface';
// Explicit compatibility exports for the current domain boundary.

export {
  SecuritySchemeKind,
  type RouteSecurityDescriptor,
  type ScannedRouteSecurityParams,
  RouteSemanticFlowSecurityDescriptor,
  RouteSecurityClassifier,
  type SecuritySchemeSpecification,
  type SecuritySchemeRegistry,
  SECURITY_SCHEME_REGISTRY,
  type RouteSecurityVisitor,
  matchRouteSecurity,
  type RateLimitDescriptor,
  RoutePolicyKind,
  type RoutePolicyKindSpecification,
  type RoutePolicyKindRegistry,
  ROUTE_POLICY_REGISTRY,
  type RoutePolicyVisitor,
  matchRoutePolicy,
  type RoutePolicyDescriptor,
} from './authAndPolicy';

export {
  type DomainOperationEntry,
  type DomainConfigEntry,
  type DomainIntentConfig,
  type GroupAliasEntry,
  type DomainDefinitionEntry,
  type FrontendConfig,
  type PagePropEntry,
  type PageMetaEntry,
  type PageConfig,
  type ResourceRouteGroup,
  type RouteManifest,
  type ParsedChannel,
} from './base';

export {
  type InvalidationTarget,
  type SelfListInvalidationTarget,
  type ParentListInvalidationTarget,
  type ParentDetailInvalidationTarget,
  type AuthResourceInvalidationTarget,
  type AnyInvalidationTarget,
  ScannedInvalidationTarget,
  type RouteCacheInvalidationDescriptor,
  RouteSemanticFlowCacheInvalidationDescriptor,
  RouteSemanticFlowInvalidationPayload,
} from './cacheInvalidation';

export {
  BroadcastChannelKind,
  type BroadcastChannelDescriptor,
  type PublicBroadcastChannelDescriptor,
  type PrivateBroadcastChannelDescriptor,
  type PresenceBroadcastChannelDescriptor,
  type BroadcastChannelSpecification,
  type BroadcastChannelRegistry,
  BROADCAST_CHANNEL_REGISTRY,
  type BroadcastChannelVisitor,
  matchBroadcastChannel,
} from './channels';

export {
  type EndpointRequestContract,
  type ItemEndpointRequestContract,
  type ItemEndpointContract,
  type EndpointSuccessResponseContract,
  type EndpointErrorResponseContract,
  type EndpointContract,
  ScannedEndpointContract,
  createEndpointContract,
  type EndpointResponseVisitor,
  matchEndpointResponse,
  getRouteContract,
  getManifestContractMap,
} from './contracts';

export {
  CrudRole,
  PageEndpointKind,
  type PageEndpointKindSpecification,
  type PageEndpointKindRegistry,
  PAGE_ENDPOINT_REGISTRY,
  type PageEndpointDescriptor,
  type PageEndpointVisitor,
  matchPageEndpoint,
  RouteHookKind,
  type BaseRouteHookDescriptor,
  type QueryHookDescriptor,
  type MutationHookDescriptor,
  type InfiniteQueryHookDescriptor,
  type AnyRouteHookDescriptor,
  type RouteHookDescriptor,
  type HookKindSpecification,
  type HookKindRegistry,
  HOOK_KIND_REGISTRY,
  type RouteHookKindVisitor,
  matchRouteHookKind,
  matchHookKind,
  RouteSemanticFlowHookDescriptor,
  type BaseCrudRoleDescriptor,
  type IndexCrudRoleDescriptor,
  type ShowCrudRoleDescriptor,
  type CreateCrudRoleDescriptor,
  type UpdateCrudRoleDescriptor,
  type DeleteCrudRoleDescriptor,
  type CustomCrudRoleDescriptor,
  type AnyCrudRoleDescriptor,
  type CrudRoleSpecification,
  type CrudRoleRegistry,
  CRUD_ROLE_REGISTRY,
  type CrudRoleVisitor,
  ScannedCrudRoleDescriptor,
  SdkResponseKind,
} from './crudRoles';

export {
  DatabaseColumnKind,
  type SqlTypeFamily,
  type DatabaseColumnKindSpecification,
  type DatabaseColumnKindRegistry,
  DATABASE_COLUMN_KIND_REGISTRY,
  type DatabaseColumnKindVisitor,
  matchDatabaseColumnKind,
  DatabaseColumnTypeMapper,
  type ParsedColumn,
} from './databaseColumns';

export {
  type ResourceGroupGraph,
  createResourceGroupGraph,
  ScannedResourceGroupGraph,
  type ClassifiedDomainGraph,
} from './domainGraph';

export {
  EloquentCastKind,
  type EloquentCastKindSpecification,
  type EloquentCastKindRegistry,
  ELOQUENT_CAST_REGISTRY,
  type EloquentCastKindVisitor,
  matchEloquentCastKind,
  EloquentCastMapper,
  type ModelCastFact,
  type ModelAccessorFact,
  EloquentRelationType,
  type EloquentRelationCardinality,
  type EloquentRelationDescriptor,
  type ModelSemanticRelation,
  type SingleRelationDescriptor,
  type CollectionRelationDescriptor,
  type RelationCardinalityDescriptor,
  type RelationCardinalityVisitor,
  matchRelation,
  type EloquentRelationTypeVisitor,
  matchRelationType,
  ModelKeyType,
  type ModelKeyTypeSpecification,
  type ModelKeyTypeRegistry,
  MODEL_KEY_TYPE_REGISTRY,
  type ModelKeyTypeVisitor,
  matchModelKeyType,
  ModelKeyTypeMapper,
} from './eloquentTypes';

export {
  RoutePayloadMode,
  type NoPayloadExecutionSignature,
  type RequiredPayloadExecutionSignature,
  type OptionalPayloadExecutionSignature,
  type RouteExecutionSignature,
  type RoutePayloadModeSpecification,
  type RoutePayloadModeRegistry,
  ROUTE_PAYLOAD_MODE_REGISTRY,
  type RouteExecutionSignatureVisitor,
  matchRouteExecutionSignature,
  matchRoutePayloadMode,
  RouteSemanticFlowExecutionSignature,
} from './executionSignatures';

export {
  type ResourceFieldExpression,
  type AnyResourceFieldExpression,
  type ResourceFieldExpressionVisitor,
  matchResourceFieldExpression,
  matchResourceExpression,
  ResourceFieldExpressionFactory,
  type ResourceAssignment,
} from './expressions';

export {
  ResourceFieldSemanticBinding,
  type ResourceFieldSemanticBindingInput,
} from './resourceFieldSemanticBinding';

export {
  matchFieldNode,
  type FieldNodeVisitor,
} from './fieldCatamorphism';

export {
  type RouteQueryParameter,
  type LaravelValidationError,
  type LaravelUnauthorizedError,
  type LaravelForbiddenError,
  type LaravelNotFoundError,
  type LaravelServerError,
  HttpErrorKind,
  type HttpErrorKindSpecification,
  type HttpErrorKindRegistry,
  HTTP_ERROR_KIND_REGISTRY,
  type HttpErrorSchemaRegistry,
  HTTP_ERROR_SCHEMA_REGISTRY,
  type HttpErrorVisitor,
  matchHttpError,
  type HttpErrorResponseDescriptor,
  type HttpErrorSchema,
  type HttpErrorSchemaField,
} from './httpErrors';

export {
  HttpMethod,
  RouteActionKind,
  type HttpMethodSpecification,
  type HttpMethodRegistry,
  HTTP_METHOD_REGISTRY,
  type HttpMethodVisitor,
  matchHttpMethod,
  type RouteActionKindSpecification,
  type RouteActionKindRegistry,
  ROUTE_ACTION_KIND_REGISTRY,
  type RouteActionKindVisitor,
  matchRouteActionKind,
  HttpStatusCode,
  type KnownHttpStatusCode,
  type HttpStatusCodeCategory,
  type HttpStatusCodeSpecification,
  type HttpStatusCodeRegistry,
  HTTP_STATUS_CODE_REGISTRY,
  type HttpStatusCodeVisitor,
  matchHttpStatusCode,
  RequestContentType,
  type BaseRequestContentTypeDescriptor,
  type JsonRequestContentTypeDescriptor,
  type MultipartRequestContentTypeDescriptor,
  type UrlEncodedRequestContentTypeDescriptor,
  type NoneRequestContentTypeDescriptor,
  type RequestContentTypeDescriptor,
  type RequestContentTypeSpecification,
  type RequestContentTypeRegistry,
  REQUEST_CONTENT_TYPE_REGISTRY,
  ScannedRequestContentTypeDescriptor,
  type RequestContentTypeVisitor,
  matchRequestContentType,
} from './httpVocabulary';

export {
  type ParsedModel,
} from './models';

export {
  RouteParameterLocation,
  RouteParameterType,
  type RouteParameterTypeSpecification,
  type RouteParameterTypeRegistry,
  ROUTE_PARAMETER_TYPE_REGISTRY,
  type RouteParameterTypeVisitor,
  matchRouteParameterType,
  type RouteParameter,
  type RouteParameterBinding,
  type RouteParameterConstraint,
  type PathParameterDescriptor,
  type QueryParameterDescriptor,
  type HeaderParameterDescriptor,
  type AnyRouteParameter,
  type RouteParameterLocationSpecification,
  type RouteParameterLocationRegistry,
  PARAMETER_LOCATION_REGISTRY,
  type RouteParameterVisitor,
  matchRouteParameter,
} from './parameters';

export {
  type PhpAstVisitor,
  matchPhpAstNode,
  type PhpAstFolder,
  foldPhpAstNode,
} from './phpAst/algebra';

export {
  type BasePhpAstNode,
  type PropertyLookupAstNode,
  type NullsafePropertyLookupAstNode,
  type OffsetLookupAstNode,
  type StaticPropertyLookupAstNode,
  type FunctionCallAstNode,
  type MethodCallAstNode,
  type NullsafeMethodCallAstNode,
  type StaticMethodCallAstNode,
  type VariableCallAstNode,
  type NewInstanceAstNode,
  type ClosureAstNode,
  type ArrowFuncAstNode,
} from './phpAst/astMemberNodes';

export {
  PhpAstKind,
  type PhpAstCategory,
  type PhpAstKindSpecification,
  type PhpAstKindRegistry,
  PHP_AST_KIND_REGISTRY,
  type PhpAstKindVisitor,
  matchPhpAstKind,
} from './phpAst/kinds';

export {
  type BinaryAstNode,
  type UnaryAstNode,
  type TypeCastAstNode,
  type TernaryAstNode,
  type ArrayEntryAstNode,
  type ArrayAstNode,
  type LiteralAstNode,
  type StaticConstantAstNode,
  type VariableAstNode,
  type PhpAstNode,
  type PhpArgument,
  type PhpBlock,
  type PhpStatement,
} from './phpAst/nodes';

export {
  type PhpPropertyName,
  type PhpClassName,
  type PhpMethodName,
  type PhpFunctionName,
  type PhpVariableName,
  type PhpConstantName,
  type PhpBinaryOperator,
  type PhpUnaryOperator,
  type PhpCastType,
  type ArrayKey,
  type PhpAstSource,
  type PhpParameter,
  type PhpClosureCapture,
} from './phpAst/astValues';

export type { BoundLiteralValue } from './semanticValues';

export {
  DataProvenanceKind,
  type DataProvenanceKindSpecification,
  type DataProvenanceKindRegistry,
  DATA_PROVENANCE_REGISTRY,
  type ProvenanceSourceRef,
  type DataProvenanceVisitor,
  matchDataProvenance,
} from './provenance/dataProvenanceKind';

export {
  type EndpointProvenanceDescriptor,
  ScannedEndpointProvenanceDescriptor,
} from './provenance/endpointProvenance';

export {
  type HeaderDeclaration,
  RequestHeaders,
  type RouteParameterKind,
  type RouteParameterDescriptor,
  type RouteParameterEntry,
  RouteParameters,
  type RouteQueryEntry,
  RouteQueryParameters,
  type PayloadPropertyEntry,
  RequestPayload,
  RouteSchemaModel,
  ResponseSchemaModel,
  RouteMapperModel,
} from './requestModels';

export {
  type ResourceFieldSemantic,
} from './resourceFieldSemantic';

export {
  ResourceGroupKind,
  type ResourceGroupSpecification,
  type ResourceGroupRegistry,
  RESOURCE_GROUP_REGISTRY,
  type AvailableMutation,
  type AbsentMutation,
  type MutationCapability as MutationCapabilityType,
  MutationCapability,
  type BaseResourceGroupTypeSignature,
  type FullCrudTypeSignature,
  type ReadOnlyCrudTypeSignature,
  type FlexibleCrudTypeSignature,
  type SingletonTypeSignature,
  type CustomTypeSignature,
  type ResourceGroupTypeSignature,
  type ResourceGroupTypeSignatureParams,
  ScannedResourceGroupTypeSignature,
  type ResourceGroupIdentityTrait,
  type ResourceGroupQueryKeysTrait,
  type CrudEndpointsTrait,
  type StrictMutationEndpointsTrait,
  type FlexibleMutationEndpointsTrait,
  type ResourceGroupVisitorCapability,
  type ResourceGroupLoweringOperations,
  type BaseResourceGroupDescriptor,
  type BaseCrudResourceGroupDescriptor,
  type FullCrudResourceGroupDescriptor,
  type ReadOnlyCrudResourceGroupDescriptor,
  type FlexibleCrudResourceGroupDescriptor,
  type CrudResourceGroupDescriptor,
  type SingletonResourceGroupDescriptor,
  type CustomResourceGroupDescriptor,
  type ResourceGroupDescriptor,
  type BaseResourceGroupParams,
  type BaseCrudParams,
  type FullCrudParams,
  type ReadOnlyCrudParams,
  type FlexibleCrudParams,
  type CrudResourceGroupDescriptorParams,
  type SingletonResourceGroupDescriptorParams,
  type CustomResourceGroupDescriptorParams,
  AbstractResourceGroupDescriptor,
  AbstractCrudResourceGroupDescriptor,
  ScannedFullCrudResourceGroupDescriptor,
  ScannedReadOnlyCrudResourceGroupDescriptor,
  ScannedFlexibleCrudResourceGroupDescriptor,
  ScannedCrudResourceGroupDescriptor,
  ScannedSingletonResourceGroupDescriptor,
  ScannedCustomResourceGroupDescriptor,
  type ExhaustiveFineGrainedResourceGroupVisitor,
  type UnifiedCrudResourceGroupVisitor,
  type ResourceGroupVisitor,
  matchFineGrainedResourceGroup,
  matchUnifiedResourceGroup,
  matchResourceGroup,
} from './resourceGroupDescriptors';

export {
  type RouteResponseAnalysis,
  ResponseDescriptorBase,
  type ResourceResponseParams,
  ResourceResponseDescriptor,
  type ModelResponseParams,
  ModelResponseDescriptor,
  VoidResponseDescriptor,
  type InlineResponseDescriptorParams,
  InlineResponseDescriptor,
  ResponseKind,
  type ResponseDescriptor,
  type ResponseKindSpecification,
  type ResponseDescriptorRegistry,
  RESPONSE_DESCRIPTOR_REGISTRY,
  type ResponseVisitor,
  matchResponse,
} from './responseDescriptors';

export {
  ResponseShape,
  type ResponseShapeSpecification,
  type ResponseShapeRegistry,
  RESPONSE_SHAPE_REGISTRY,
  type ResponseShapeVisitor,
  matchResponseShape,
  PaginationKind,
  type BasePaginatedEnvelopeDescriptor,
  type LengthAwarePaginatedEnvelopeDescriptor,
  type CursorPaginatedEnvelopeDescriptor,
  type AnyPaginatedEnvelopeDescriptor,
  type PaginatedEnvelopeDescriptor,
  type PaginationKindSpecification,
  type PaginationKindRegistry,
  PAGINATION_KIND_REGISTRY,
  type PaginatedEnvelopeVisitor,
  matchPaginatedEnvelope,
  matchPaginationKind,
  PolymorphicMorphType,
  type BasePolymorphicRelationDescriptor,
  type MorphToRelationDescriptor,
  type MorphOneRelationDescriptor,
  type MorphManyRelationDescriptor,
  type MorphToManyRelationDescriptor,
  type MorphedByManyRelationDescriptor,
  type PolymorphicRelationDescriptor,
  type AnyPolymorphicRelationDescriptor,
  type PolymorphicRelationSpecification,
  type PolymorphicRelationRegistry,
  POLYMORPHIC_RELATION_REGISTRY,
  type PolymorphicRelationVisitor,
  matchPolymorphicRelation,
  matchPolymorphicMorphType,
  type ScannedPaginatedEnvelopeParams,
  ScannedPaginatedEnvelopeDescriptor,
  type ScannedPolymorphicRelationParams,
  ScannedPolymorphicRelationDescriptor,
} from './responseShapes';

export {
  type RouteName,
  type RoutePath,
  type RouteMiddlewareName,
  type RouteSchemaEntry,
  type RouteAssignmentEntry,
  type StableRouteHash,
  type RouteEntityIdentityContract,
  type RouteSecurityContract,
  type RoutePayloadContract,
  type RouteEntityProvenanceContract,
  type RouteDefContract,
  type RouteDef,
  type RawRouteDefInput,
  createRouteName,
  createRoutePath,
  createHttpVerb,
} from './routeEntityDefinition';

export {
  RouteHandlerKind,
  type RouteHandlerKindSpecification,
  type RouteHandlerKindRegistry,
  ROUTE_HANDLER_KIND_REGISTRY,
  type BaseRouteHandlerDescriptor,
  type ControllerActionHandlerDescriptor,
  type InvokableControllerHandlerDescriptor,
  type ClosureHandlerDescriptor,
  type RouteHandlerDescriptor,
  type RouteHandlerVisitor,
  matchRouteHandler,
  type FormRequestDescriptor,
  ScannedFormRequestDescriptor,
} from './routeHandlers';

export {
  type RouteParameterSpecification,
  type RouteIdentityContract,
  type RouteProvenanceContract,
  type RouteBindingContract,
  type RouteCapabilityContract,
  type RouteSemanticFlow,
  type GetCollectionRouteDescriptor,
  type GetItemRouteDescriptor,
  type MutationRouteDescriptor,
  type DeletionRouteDescriptor,
  type RouteDescriptor,
  type RouteClassifier,
  CRUD_DISPATCH_REGISTRY,
  classifyRoute,
  type RouteVisitor,
  RouteDescriptorKind,
  type RouteKindSpecification,
  type RouteDescriptorRegistry,
  ROUTE_DESCRIPTOR_REGISTRY,
  type RouteCollectionRegistry,
  RouteSemanticFlowRegistry,
} from './routes';

export {
  type SdkResponseResolution,
  type VoidSdkResponseResolution,
  type RawSdkResponseResolution,
  type ValidatedSdkResponseResolution,
  type MappedSdkResponseResolution,
  type ValidatedAndMappedSdkResponseResolution,
  type AnySdkResponseResolution,
  type SdkResponseKindSpecification,
  type SdkResponseKindRegistry,
  SDK_RESPONSE_KIND_REGISTRY,
  type SdkResponseResolutionVisitor,
  matchSdkResponseResolution,
  matchSdkResponse,
  ScannedSdkResponseResolution,
} from './sdkResponses';

export {
  type ModelFieldInfo,
  type ModelFieldEntry,
  ModelFieldMap,
  type ModelRelationInfo,
  type ModelRelationEntry,
  ModelRelationMap,
  type ModelAccessorInfo,
  type ModelAccessorEntry,
  ModelAccessorMap,
  type ModelServiceEntry,
  ModelServiceMap,
  type ModelControllerEntry,
  ModelControllerMap,
  type ModelNodeEntry,
  ModelNodeMap,
  type SemanticModelEntry,
  SemanticModelMap,
  type SemanticRelationEntry,
} from './semanticCollections';

export {
  type ScalarValidationFieldNode,
  type ObjectValidationFieldNode,
  type ValidationFieldFolder,
  foldValidationField,
} from './validationFields';

// Root-07 completion: explicit compatibility exports whose canonical modules were
// already present but were not exposed through the domain boundary.
export {
  type EndpointResponseContract,
} from './contracts';

export {
  matchRelationCardinality,
} from './eloquentTypes';

export {
  ResourceExpressionKind,
  type ResourceExpressionCategory,
  type ResourceExpressionSpecification,
  type ResourceExpressionRegistry,
  RESOURCE_EXPRESSION_REGISTRY,
} from './expressions';

export {
  matchCrudRole,
} from './crudRoles';

export {
  InvalidationTargetKind,
  type InvalidationTargetSpecification,
  type InvalidationTargetRegistry,
  INVALIDATION_TARGET_REGISTRY,
  type InvalidationTargetVisitor,
  matchInvalidationTarget,
} from './cacheInvalidation';

export {
  type ResponseMetadata,
} from './sdkResponses';

export {
  matchRoute,
} from './routes';

export {
  type ArrayValidationFieldNode,
  type ValidationFieldNode,
  ValidationFieldKind,
  type ValidationFieldSpecification,
  type ValidationFieldRegistry,
  VALIDATION_FIELD_REGISTRY,
  type ValidationFieldVisitor,
  matchValidationField,
} from './validationFields';

export {
  SemanticRelationMap,
} from './semanticCollections';
export {
  type DomainOperationKind,
  type DomainOperationIntent,
  type DomainOperationContract,
  type DomainOperationGraph,
  createDomainOperation,
  createDomainOperationGraph
} from './operationGraph';
export { attachDomainOperations } from './domainGraph';

export {
  type ControllerAccessMode,
  type ControllerClosureCapture,
  type ControllerExpression,
  type ControllerPropertyPath,
  type ControllerArgument,
  type ControllerArrayKey,
  type ControllerArrayEntry,
  type ControllerMatchArm,
  type ControllerStatement,
  type ControllerRuntimeReturn
} from './controllerExpression';
