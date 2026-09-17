/**
 * ResponseArtifact.ts
 *
 * Active Consumer & Orchestrator for HTTP Response IR Analysis Artifacts.
 * Consumes sub-domain specifications and exposes pure analysis IR with zero wildcard re-exports.
 *
 * @module compiler/ir
 */

export {
    InferenceMethod,
    TransportKind,
    type ConfidenceScore,
    type ResponseDescriptor
} from './response/responseDescriptors';

export type {
    ObjectSchema,
    ObjectSchemaProperty,
    PropertyType,
    PropertyDescriptor,
    ModelAttribute
} from './response/objectSchemas';

export {
    isResourceBody,
    isModelBody,
    isObjectBody,
    isPrimitiveBody,
    isCollectionResponse,
    type ResponseBody,
    type ResourceBody,
    type ModelBody,
    type ObjectBody,
    type PrimitiveBody
} from './response/responseBodies';

export { ResponseArtifact } from './response/ResponseArtifactClass';

export {
    ResponseArtifactBuilder,
    exampleResourceSingle,
    exampleCollectionLowConfidence,
    exampleBinaryDownload
} from './response/ResponseArtifactBuilder';

export {
    ValidationArtifact,
    ModelArtifact,
    ResourceArtifact,
    RouteArtifact,
    type RelationshipDescriptor,
    type ConditionalAttribute,
    type RouteParameter
} from './response/artifactFamily';

export {
    isDataResponse,
    isBinaryResponse,
    isRedirectResponse,
    hasBody,
    isHighConfidence
} from './response/responseGuards';

export {
    type CreateResponseArtifactOptions,
    createResponseArtifact
} from './response/responseArtifactFactory';
