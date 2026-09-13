/**
 * Mutation hook builders sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 */

export { resolveInvalidate } from './invalidateResolver';
export { buildUseCreate } from './createMutationBuilder';
export { buildUseUpdate, buildUseUpdateSelf } from './updateMutationBuilder';
export { buildUseRemove, buildUseDeleteSelf } from './deleteMutationBuilder';
