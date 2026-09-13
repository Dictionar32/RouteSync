/**
 * sdk/api-runtime/index.ts
 *
 * Explicit Sub-Domain Exports for SDK API Runtime.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module sdk/api-runtime
 */

export {
  type CallOptions,
  type EndpointCallableOptions,
  type LooseEndpointOptions,
  type OptionalIfEmpty,
  type ApiError,
  type EndpointCallable,
  type ApiGroupProxy,
  type ApiProxy,
  type RouteSchemaPart
} from "./types";

export {
  getClient,
  createClient
} from "./clientSingleton";

export {
  splitFlatOptions
} from "./optionSplitter";

export {
  pickRouteSchema,
  parseRouteSchema,
  applyMapper
} from "./schemaMapper";
