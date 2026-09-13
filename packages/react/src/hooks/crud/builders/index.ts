/**
 * crud/builders/index.ts
 *
 * Explicit Sub-Domain Exports for CRUD Hook Builders.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module react/hooks/crud/builders
 */

export {
  buildUseIndex,
  buildUseShow
} from "./queryHookBuilders";

export {
  resolveInvalidate,
  buildUseCreate,
  buildUseUpdate,
  buildUseUpdateSelf,
  buildUseRemove,
  buildUseDeleteSelf
} from "./mutationHookBuilders";

export {
  buildExtraHooks
} from "./extraHooksBuilder";
