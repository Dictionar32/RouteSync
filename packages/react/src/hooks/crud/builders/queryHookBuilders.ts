/**
 * queryHookBuilders.ts
 *
 * Query hook builders for React Query CRUD operations (useIndex, useShow).
 *
 * @module react/hooks/crud/builders/queryHookBuilders
 */

import { useQuery } from '@tanstack/react-query';
import type { CrudHooksConfig } from '../crudTypes';
import { callIndex, callShow, requireValidId } from '../crudCallers';

export function buildUseIndex<ReadIndexList, ReadShow, CreateForm, UpdateForm>(
  config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
) {
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

export function buildUseShow<ReadIndexList, ReadShow, CreateForm, UpdateForm>(
  config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
) {
  const { service, queryKey, groupName } = config;
  return (id: number, options?: unknown) => {
    if (!service.show) throw new Error('Show is not supported for this resource');
    const validId = Number(id);
    const enabled = Number.isInteger(validId) && validId > 0;
    const resolvedEnabled = options && typeof options === 'object' && 'enabled' in options
      ? (options as { enabled?: boolean }).enabled
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
