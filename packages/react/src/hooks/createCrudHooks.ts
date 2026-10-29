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

export type CrudHooksResult<ReadIndexList, ReadShow, CreateForm, UpdateForm> = {
  readonly useIndex: ReturnType<typeof buildUseIndex<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly useShow: ReturnType<typeof buildUseShow<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly useCreate: ReturnType<typeof buildUseCreate<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly useUpdate: ReturnType<typeof buildUseUpdate<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly useUpdateSelf: ReturnType<typeof buildUseUpdateSelf<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly usePatch: ReturnType<typeof buildUseUpdateSelf<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly usePut: ReturnType<typeof buildUseUpdateSelf<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly useRemove: ReturnType<typeof buildUseRemove<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly useDelete: ReturnType<typeof buildUseRemove<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly useDeleteSelf: ReturnType<typeof buildUseDeleteSelf<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly index: ReturnType<typeof buildUseIndex<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly show: ReturnType<typeof buildUseShow<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly create: ReturnType<typeof buildUseCreate<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly update: ReturnType<typeof buildUseUpdate<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly updateSelf: ReturnType<typeof buildUseUpdateSelf<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly patch: ReturnType<typeof buildUseUpdateSelf<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly put: ReturnType<typeof buildUseUpdateSelf<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly remove: ReturnType<typeof buildUseRemove<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly delete: ReturnType<typeof buildUseRemove<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
  readonly deleteSelf: ReturnType<typeof buildUseDeleteSelf<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;
} & ReturnType<typeof buildExtraHooks<ReadIndexList, ReadShow, CreateForm, UpdateForm>>;

// ─── Active Consumer Orchestrator: Pure Flow ──────────────────────────────────

export const createCrudHooks = <
  ReadIndexList,
  ReadShow,
  CreateForm,
  UpdateForm
>(config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>): CrudHooksResult<ReadIndexList, ReadShow, CreateForm, UpdateForm> => {
  const useIndex = buildUseIndex(config);
  const useShow = buildUseShow(config);
  const useCreate = buildUseCreate(config);
  const useUpdate = buildUseUpdate(config);
  const useUpdateSelf = buildUseUpdateSelf(config);
  const useRemove = buildUseRemove(config);
  const useDeleteSelf = buildUseDeleteSelf(config);
  const extraHooks = buildExtraHooks(config);

  return {
    useIndex: useIndex,
    useShow: useShow,
    useCreate: useCreate,
    useUpdate: useUpdate,
    useUpdateSelf: useUpdateSelf,
    usePatch: useUpdateSelf,
    usePut: useUpdateSelf,
    useRemove: useRemove,
    useDelete: useRemove,
    useDeleteSelf: useDeleteSelf,
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
