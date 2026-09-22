import { ValidationRuleKind } from './validationRules';
import type { ValidationRuleNode } from './validationRules';
import type { RequestField } from './request';

export * from './validationRules';

export type ValidationRuleCategory =
  | 'modifier'
  | 'type'
  | 'format'
  | 'constraint'
  | 'database'
  | 'custom';

export interface ValidationRuleSpecification<K extends ValidationRuleKind = ValidationRuleKind> {
  readonly kind: K;
  readonly category: ValidationRuleCategory;
  readonly isTypeAssertion: boolean;
  readonly isConstraint: boolean;
  readonly isModifier: boolean;
  readonly description: string;
}

export type ValidationRuleRegistry = {
  readonly [K in ValidationRuleKind]: ValidationRuleSpecification<K>;
};

export const VALIDATION_RULE_REGISTRY: ValidationRuleRegistry = Object.freeze({
  [ValidationRuleKind.Required]: {
    kind: ValidationRuleKind.Required,
    category: 'modifier',
    isTypeAssertion: false,
    isConstraint: false,
    isModifier: true,
    description: 'Field must be present and not empty'
  },
  [ValidationRuleKind.RequiredWith]: {
    kind: ValidationRuleKind.RequiredWith,
    category: 'modifier',
    isTypeAssertion: false,
    isConstraint: false,
    isModifier: true,
    description: 'Field is required when one or more other fields are present'
  },
  [ValidationRuleKind.Nullable]: {
    kind: ValidationRuleKind.Nullable,
    category: 'modifier',
    isTypeAssertion: false,
    isConstraint: false,
    isModifier: true,
    description: 'Field may be null'
  },
  [ValidationRuleKind.Optional]: {
    kind: ValidationRuleKind.Optional,
    category: 'modifier',
    isTypeAssertion: false,
    isConstraint: false,
    isModifier: true,
    description: 'Field may be omitted/sometimes'
  },
  [ValidationRuleKind.String]: {
    kind: ValidationRuleKind.String,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be a string'
  },
  [ValidationRuleKind.Number]: {
    kind: ValidationRuleKind.Number,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be numeric'
  },
  [ValidationRuleKind.Boolean]: {
    kind: ValidationRuleKind.Boolean,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be a boolean'
  },
  [ValidationRuleKind.Array]: {
    kind: ValidationRuleKind.Array,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be an array'
  },
  [ValidationRuleKind.Email]: {
    kind: ValidationRuleKind.Email,
    category: 'format',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be formatted as an e-mail address'
  },
  [ValidationRuleKind.Url]: {
    kind: ValidationRuleKind.Url,
    category: 'format',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be formatted as a valid URL'
  },
  [ValidationRuleKind.Uuid]: {
    kind: ValidationRuleKind.Uuid,
    category: 'format',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be a valid UUID'
  },
  [ValidationRuleKind.Date]: {
    kind: ValidationRuleKind.Date,
    category: 'format',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be a valid date'
  },
  [ValidationRuleKind.Min]: {
    kind: ValidationRuleKind.Min,
    category: 'constraint',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must have minimum value or length'
  },
  [ValidationRuleKind.Max]: {
    kind: ValidationRuleKind.Max,
    category: 'constraint',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must have maximum value or length'
  },
  [ValidationRuleKind.Between]: {
    kind: ValidationRuleKind.Between,
    category: 'constraint',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be between min and max values'
  },
  [ValidationRuleKind.In]: {
    kind: ValidationRuleKind.In,
    category: 'constraint',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be included in given list of values'
  },
  [ValidationRuleKind.Exists]: {
    kind: ValidationRuleKind.Exists,
    category: 'database',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must exist in specified database table'
  },
  [ValidationRuleKind.Unique]: {
    kind: ValidationRuleKind.Unique,
    category: 'database',
    isTypeAssertion: false,
    isConstraint: true,
    isModifier: false,
    description: 'Field must be unique in specified database table'
  },
  [ValidationRuleKind.File]: {
    kind: ValidationRuleKind.File,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be an uploaded file'
  },
  [ValidationRuleKind.Image]: {
    kind: ValidationRuleKind.Image,
    category: 'type',
    isTypeAssertion: true,
    isConstraint: false,
    isModifier: false,
    description: 'Field must be an uploaded image file'
  },
  [ValidationRuleKind.Custom]: {
    kind: ValidationRuleKind.Custom,
    category: 'custom',
    isTypeAssertion: false,
    isConstraint: false,
    isModifier: false,
    description: 'Custom or unhandled Laravel validation rule'
  }
});

export interface ZodNode {
  readonly expression: string;
}

/**
 * Ekstrak node spesifik berdasarkan kind dari discriminated union.
 */
export type ExtractRule<K extends ValidationRuleKind> = Extract<
  ValidationRuleNode,
  { readonly kind: K }
>;

/**
 * Handler strictly-typed: parameter constraint DIJAMIN cocok dengan K (0 any).
 */
export type ConstraintHandler<K extends ValidationRuleKind> = (
  base: ZodNode,
  constraint: ExtractRule<K>
) => ZodNode;

/**
 * Registry Mapped Type: Semua key K terpetakan ke handler yang eksak.
 */
export type ConstraintRegistry = {
  readonly [K in ValidationRuleKind]: ConstraintHandler<K>;
};

export const ZOD_CONSTRAINT_REGISTRY: ConstraintRegistry = Object.freeze({
  [ValidationRuleKind.Min]: (base, c) => ({
    expression: `${base.expression}.min(${c.value})`
  }),
  [ValidationRuleKind.Max]: (base, c) => ({
    expression: `${base.expression}.max(${c.value})`
  }),
  [ValidationRuleKind.In]: (base, c) => ({
    expression: `z.enum([${c.values.map(v => JSON.stringify(v)).join(', ')}])`
  }),
  [ValidationRuleKind.Between]: (base, c) => ({
    expression: `${base.expression}.min(${c.min}).max(${c.max})`
  }),
  [ValidationRuleKind.Email]: (base) => ({
    expression: `${base.expression}.email()`
  }),
  [ValidationRuleKind.Url]: (base) => ({
    expression: `${base.expression}.url()`
  }),
  [ValidationRuleKind.Uuid]: (base) => ({
    expression: `${base.expression}.uuid()`
  }),
  [ValidationRuleKind.Nullable]: (base) => ({
    expression: `${base.expression}.nullable()`
  }),
  [ValidationRuleKind.Optional]: (base) => ({
    expression: `${base.expression}.optional()`
  }),
  [ValidationRuleKind.Number]: () => ({
    expression: 'z.number()'
  }),
  [ValidationRuleKind.Boolean]: () => ({
    expression: 'z.boolean()'
  }),
  [ValidationRuleKind.Array]: () => ({
    expression: 'z.array(z.unknown())'
  }),
  [ValidationRuleKind.String]: () => ({
    expression: 'z.string()'
  }),
  [ValidationRuleKind.Date]: (base) => ({
    expression: `${base.expression}.datetime()`
  }),
  [ValidationRuleKind.File]: () => ({
    expression: 'z.instanceof(File)'
  }),
  [ValidationRuleKind.Image]: () => ({
    expression: 'z.instanceof(File)'
  }),
  [ValidationRuleKind.Required]: (base) => base,
  [ValidationRuleKind.Exists]: (base) => base,
  [ValidationRuleKind.Unique]: (base) => base,
  [ValidationRuleKind.Custom]: (base) => base
});

export class ZodSchemaReducer {
  public static reduceConstraints(
    initialNode: ZodNode,
    constraints: readonly ValidationRuleNode[]
  ): ZodNode {
    return constraints.reduce<ZodNode>((base, constraint) => {
      const handler = ZOD_CONSTRAINT_REGISTRY[constraint.kind] as (
        b: ZodNode,
        c: ValidationRuleNode
      ) => ZodNode;
      return handler(base, constraint);
    }, initialNode);
  }
}

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
  ScannedRouteSecurityDescriptor,
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
  ScannedRouteCacheInvalidationDescriptor,
  ScannedRouteInvalidationPayload,
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
  ScannedRouteHookDescriptor,
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
  type ParsedCast,
  type ParsedAccessor,
  EloquentRelationType,
  type EloquentRelationCardinality,
  type EloquentRelationDescriptor,
  type EloquentRelationRegistry,
  ELOQUENT_RELATION_REGISTRY,
  EloquentRelationClassifier,
  type ParsedRelation,
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
  type BaseRouteExecutionSignature,
  type NoPayloadExecutionSignature,
  type RequiredPayloadExecutionSignature,
  type OptionalPayloadExecutionSignature,
  type AnyRouteExecutionSignature,
  type RouteExecutionSignature,
  type RoutePayloadModeSpecification,
  type RoutePayloadModeRegistry,
  ROUTE_PAYLOAD_MODE_REGISTRY,
  type RouteExecutionSignatureVisitor,
  matchRouteExecutionSignature,
  matchRoutePayloadMode,
  ScannedRouteExecutionSignature,
} from './executionSignatures';

export {
  ResourceFieldDescriptor,
  type ResourceFieldExpression,
  type AnyResourceFieldExpression,
  type ResourceFieldExpressionVisitor,
  matchResourceFieldExpression,
  matchResourceExpression,
  ResourceFieldExpressionFactory,
  type ResourceAssignment,
  type ParsedResource,
  type ResourceFieldKind,
} from './expressions';

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
} from './phpAst/nodes';

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
  type ParsedRoute,
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
  ScannedRouteRegistry,
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
