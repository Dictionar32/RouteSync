/**
 * createCrudHooks.ts
 *
 * Active Consumer & Orchestrator: React Query CRUD hooks factory.
 * Coordinates query, mutation, extra hook builders, and aggregate intent actions.
 * Conforms to Rule 14: Active Consumer with Pure Flow, zero wildcard re-exports.
 *
 * @module react/hooks
 */

import type {
  InvalidateList,
  ExtraEndpoint,
  CrudHooksConfig
} from './crud/crudTypes';

import {
  useAggregateCollectionIntent,
  type AggregateCollectionConfig,
  type AggregateCollectionIntentActions
} from './crud/useAggregateCollectionIntent';

import {
  buildUseIndex,
  buildUseShow,
  buildUseCreate,
  buildUseUpdate,
  buildUseUpdateSelf,
  buildUseRemove,
  buildUseDeleteSelf,
  buildExtraHooks
} from './crud/builders';

// ─── Active Consumer Orchestrator: Pure Flow ──────────────────────────────────

export const createCrudHooks = <
  ReadIndexList,
  ReadShow,
  CreateForm,
  UpdateForm
>(config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>) => {
  const useIndex = buildUseIndex(config);
  const useShow = buildUseShow(config);
  const useCreate = buildUseCreate(config);
  const useUpdate = buildUseUpdate(config);
  const useUpdateSelf = buildUseUpdateSelf(config);
  const useRemove = buildUseRemove(config);
  const useDeleteSelf = buildUseDeleteSelf(config);
  const extraHooks = buildExtraHooks(config);

  return {
    useIndex,
    useShow,
    useCreate,
    useUpdate,
    useUpdateSelf,
    usePatch: useUpdateSelf,
    usePut: useUpdateSelf,
    useRemove,
    useDelete: useRemove,
    useDeleteSelf,
    index: useIndex,
    show: useShow,
    create: useCreate,
    update: useUpdate,
    updateSelf: useUpdateSelf,
    patch: useUpdateSelf,
    put: useUpdateSelf,
    remove: useRemove,
    delete: useRemove,
    deleteSelf: useDeleteSelf,
    ...extraHooks,
  };
};

// ─── Explicit Named Exports (Rule 14: Zero Wildcard Re-export) ────────────────

export {
  useAggregateCollectionIntent
};

export type {
  AggregateCollectionConfig,
  AggregateCollectionIntentActions,
  InvalidateList,
  ExtraEndpoint,
  CrudHooksConfig
};
