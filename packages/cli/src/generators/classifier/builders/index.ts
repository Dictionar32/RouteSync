/**
 * Group descriptor builders sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 */

export { partitionGroupSubRoutes, type ErrorResolutionResult } from './subRoutePartitioner';
export { buildCrudGroupDescriptor } from './crudGroupBuilder';
export { buildCustomOrSingletonGroupDescriptor } from './singletonGroupBuilder';
