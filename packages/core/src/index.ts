// Utils
export { camelCase, camelCaseKeys, snakeCase, snakeCaseKeys } from './utils'

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
  HttpMethod,
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
export type { RouteManifest, ParsedRoute, ParsedChannel, ParsedModel, ParsedColumn, ResponseMetadata, ParsedResource } from './types/route'
export { SemanticResolutionKernel as SemanticKernelV2Impl } from './semantic/SemanticResolutionKernel'
export { SemanticResolutionKernel } from './semantic/SemanticResolutionKernel'
export type { ModelNode as SemanticModelNode, ResolverMeta, ResolutionContext, ResolverPlugin } from './semantic/types'
export * from './types/semantic'
export * from './types/emit'
export { ServiceGraphBuilder } from './graph/ServiceGraphBuilder'
export { ContractGraph, isResolvedField } from './graph/ContractGraph'
export type { ControllerNode } from './graph/ContractGraph'

// IR v3 (CompilerRoadmap.md Stage 2)
export { buildSemanticIRNode, computeStableHash, IRNodeRegistry } from './ir/buildIRNode'
export type { BuildIRNodeInput } from './ir/buildIRNode'

// Unified FieldNode model (compiler/CompilerBacklog.md H1/H3 follow-up) — phase 1 of 3
export * from './types/field'
export { fieldFromResourceFieldKind, fieldFromResponseMetadata, fieldFromParsedASTNode } from './types/legacyFieldAdapter'

// SymbolTable — O(1) model/member lookup (roadmap: next after ResolverMeta unification)
export { SymbolTable, ModelSymbol } from './semantic/SymbolTable'

// RouteSync Compiler Core v6.0
export * as v6 from './compiler'

// ResponseArtifact and related types (SSOT for response analysis)
export { ResponseArtifact, ResponseArtifactBuilder } from './compiler/ir/ResponseArtifact'
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

