/**
 * deleteMutationBuilder.ts
 *
 * Mutation hook builders for delete operations (parameterized and self).
 *
 * @module react/hooks/crud/builders/mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getClient } from '@routesync/sdk';
import type { CrudHooksConfig } from '../../crudTypes';
import {
  requireValidId,
  callDelete,
  callDeleteNoParam
} from '../../crudCallers';
import { getSuccessMessage, getErrorMessage } from '../../crudNotifications';
import { resolveInvalidate } from './invalidateResolver';

export function buildUseRemove<ReadIndexList, ReadShow, CreateForm, UpdateForm>(
  config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
) {
  const { service, queryKey, groupName } = config;
  return (mutationOptions?: unknown) => {
    const svc = service.delete ?? service.deleteSelf;
    if (!svc) throw new Error('Delete is not supported for this resource');
    const qc = useQueryClient();
    const options = mutationOptions as Record<string, unknown> | undefined;
    return useMutation({
      ...options,
      mutationFn: (id?: number) => {
        if (service.delete) {
          return callDelete(service.delete, requireValidId(id));
        }
        return callDeleteNoParam(service.deleteSelf);
      },
      onSuccess: (data: unknown, id: number | undefined, context: unknown) => {
        qc.invalidateQueries({ queryKey: queryKey.list() });
        if (id !== undefined && service.delete) {
          qc.invalidateQueries({ queryKey: queryKey.detail(id) });
        }
        resolveInvalidate(qc, config.cache?.delete?.invalidate ?? config.cache?.deleteSelf?.invalidate, id);

        try {
          const client = getClient();
          const msg = getSuccessMessage(data, 'remove', groupName || '');
          if (msg) client.config.toast?.success?.(msg);
        } catch (e) {}

        const opt = options as { onSuccess?: (data: unknown, variables: number | undefined, context: unknown) => void } | undefined;
        opt?.onSuccess?.(data, id, context);
      },
      onError: (error: unknown, id: number | undefined, context: unknown) => {
        try {
          const client = getClient();
          const msg = getErrorMessage(error, 'remove', groupName || '');
          if (msg) client.config.toast?.error?.(msg);
        } catch (e) {}

        const opt = options as { onError?: (error: unknown, variables: number | undefined, context: unknown) => void } | undefined;
        opt?.onError?.(error, id, context);
      }
    });
  };
}

export function buildUseDeleteSelf<ReadIndexList, ReadShow, CreateForm, UpdateForm>(
  config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
) {
  const { service, queryKey, groupName } = config;
  return (mutationOptions?: unknown) => {
    const svc = service.deleteSelf;
    if (!svc) throw new Error('DeleteSelf is not supported for this resource');
    const qc = useQueryClient();
    const options = mutationOptions as Record<string, unknown> | undefined;
    return useMutation({
      ...options,
      mutationFn: () => callDeleteNoParam(svc),
      onSuccess: (data: unknown, variables: void, context: unknown) => {
        qc.invalidateQueries({ queryKey: queryKey.list() });
        resolveInvalidate(qc, config.cache?.deleteSelf?.invalidate);

        try {
          const client = getClient();
          const msg = getSuccessMessage(data, 'remove', groupName || '');
          if (msg) client.config.toast?.success?.(msg);
        } catch (e) {}

        const opt = options as { onSuccess?: (data: unknown, variables: void, context: unknown) => void } | undefined;
        opt?.onSuccess?.(data, variables, context);
      },
      onError: (error: unknown, variables: void, context: unknown) => {
        try {
          const client = getClient();
          const msg = getErrorMessage(error, 'remove', groupName || '');
          if (msg) client.config.toast?.error?.(msg);
        } catch (e) {}

        const opt = options as { onError?: (error: unknown, variables: void, context: unknown) => void } | undefined;
        opt?.onError?.(error, variables, context);
      }
    });
  };
}
