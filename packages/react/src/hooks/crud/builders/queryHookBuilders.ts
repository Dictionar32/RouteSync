/**
 * queryHookBuilders.ts
 *
 * Query hook builders for React Query CRUD operations (useIndex, useShow).
 *
 * @module react/hooks/crud/builders/queryHookBuilders
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CrudHooksConfig } from '../crudTypes';
import { callIndex, callShow, requireValidId } from '../crudCallers';

export interface BuildUseIndex {
  <ReadIndexList, ReadShow, CreateForm, UpdateForm>(
    config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
  ): (options?: unknown) => UseQueryResult<unknown>
}

export const buildUseIndex: BuildUseIndex = <ReadIndexList, ReadShow, CreateForm, UpdateForm>(
  config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
): ((options?: unknown) => UseQueryResult<unknown>) => {
  const { service, queryKey, groupName } = config;
  return (options?: unknown) => {
    if (!service.index) throw new Error('Index is not supported for this resource');
    const query = useQuery({
      ...(options as Record<string, unknown>),
      queryKey: queryKey.list(),
      queryFn: () => callIndex(service.index),
    });
    return groupName ? Object.assign(query, { [groupName]: query.data }) : query;
  };
}

export interface BuildUseShow {
  <ReadIndexList, ReadShow, CreateForm, UpdateForm>(
    config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
  ): (id: number, options?: unknown) => UseQueryResult<unknown>
}

export const buildUseShow: BuildUseShow = <ReadIndexList, ReadShow, CreateForm, UpdateForm>(
  config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
): ((id: number, options?: unknown) => UseQueryResult<unknown>) => {
  const { service, queryKey, groupName } = config;
  return (id: number, options?: unknown) => {
    if (!service.show) throw new Error('Show is not supported for this resource');
    const validId = Number(id);
    const enabled = Number.isInteger(validId) && validId > 0;
    const resolvedEnabled = options && typeof options === 'object' && 'enabled' in options
      && typeof (options as { enabled?: unknown }).enabled === 'boolean'
      ? (options as { enabled: boolean }).enabled
      : enabled;
    const query = useQuery({
      ...(options as Record<string, unknown>),
      queryKey: queryKey.detail(validId),
      enabled: enabled && resolvedEnabled,
      queryFn: () => callShow(service.show, requireValidId(validId)),
    });
    return groupName ? Object.assign(query, { [groupName]: query.data }) : query;
  };
}
