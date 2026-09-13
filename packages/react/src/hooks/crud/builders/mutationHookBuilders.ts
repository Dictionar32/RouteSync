/**
 * mutationHookBuilders.ts
 *
 * Mutation hook builders for React Query CRUD operations (create, update, delete).
 * Active Consumer delegating to focused sub-domain builders.
 *
 * @module react/hooks/crud/builders/mutationHookBuilders
 */

import {
  resolveInvalidate,
  buildUseCreate,
  buildUseUpdate,
  buildUseUpdateSelf,
  buildUseRemove,
  buildUseDeleteSelf
} from './mutations';

export {
  resolveInvalidate,
  buildUseCreate,
  buildUseUpdate,
  buildUseUpdateSelf,
  buildUseRemove,
  buildUseDeleteSelf
};
