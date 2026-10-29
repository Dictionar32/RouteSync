/**
 * deleteMutationBuilder.ts
 *
 * Mutation hook builders for delete operations (parameterized and self).
 *
 * @module react/hooks/crud/builders/mutations
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { getClient } from '@routesync/sdk';
import type { CrudHooksConfig } from '../../crudTypes';
import {
  requireValidId,
  callDelete,
  callDeleteNoParam
} from '../../crudCallers';
import { getSuccessMessage, getErrorMessage } from '../../crudNotifications';
import { resolveInvalidate } from './invalidateResolver';

export interface BuildUseRemove {
  <ReadIndexList, ReadShow, CreateForm, UpdateForm>(
    config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
  ): (mutationOptions?: unknown) => UseMutationResult<unknown, unknown, number>
}

export const buildUseRemove: BuildUseRemove = <ReadIndexList, ReadShow, CreateForm, UpdateForm>(
  config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
): ((mutationOptions?: unknown) => UseMutationResult<unknown, unknown, number>) => {
  const { service, queryKey, groupName } = config;
  return (mutationOptions?: unknown) => {
    const svc = service.delete ?? service.deleteSelf;
    if (!svc) throw new Error('Delete is not supported for this resource');
    const qc = useQueryClient();
    const options = mutationOptions as Record<string, unknown> | undefined;
    return useMutation({
      ...options,
      mutationFn: (id: number) => {
        if (service.delete) {
          return callDelete(service.delete, requireValidId(id));
        }
        return callDeleteNoParam(service.deleteSelf);
      },
      onSuccess: (data: unknown, id: number, context: unknown) => {
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

        const opt = options as { onSuccess?: (data: unknown, variables: number, context: unknown) => void } | undefined;
        opt?.onSuccess?.(data, id, context);
      },
      onError: (error: unknown, id: number, context: unknown) => {
        try {
          const client = getClient();
          const msg = getErrorMessage(error, 'remove', groupName || '');
          if (msg) client.config.toast?.error?.(msg);
        } catch (e) {}

        const opt = options as { onError?: (error: unknown, variables: number, context: unknown) => void } | undefined;
        opt?.onError?.(error, id, context);
      }
    });
  };
}

export interface BuildUseDeleteSelf {
  <ReadIndexList, ReadShow, CreateForm, UpdateForm>(
    config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
  ): (mutationOptions?: unknown) => UseMutationResult<unknown, unknown, void>
}

export const buildUseDeleteSelf: BuildUseDeleteSelf = <ReadIndexList, ReadShow, CreateForm, UpdateForm>(
  config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
): ((mutationOptions?: unknown) => UseMutationResult<unknown, unknown, void>) => {
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
