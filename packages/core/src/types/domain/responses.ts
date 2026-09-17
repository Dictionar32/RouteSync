/**
 * Response Shapes, Descriptors & SDK Resolution Architecture.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 */
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
    ScannedPolymorphicRelationDescriptor
} from "./responseShapes";

export {
    type RouteResponseAnalysis,
    ResponseDescriptorBase,
    type ResourceResponseParams,
    ResourceResponseDescriptor,
    type ModelResponseParams,
    ModelResponseDescriptor,
    VoidResponseDescriptor,
    type InlineResponseDescriptorParams,
    type ResponseDescriptorOrigin,
    type ResponseSemanticProperty,
    type ResponseSemanticContract,
    InlineResponseDescriptor,
    ResponseKind,
    type ResponseDescriptor,
    type ResponseKindSpecification,
    type ResponseDescriptorRegistry,
    RESPONSE_DESCRIPTOR_REGISTRY,
    type ResponseVisitor,
    matchResponse
} from "./responseDescriptors";

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
    type ResponseMetadata
} from "./sdkResponses";

