/**
 * updateMutationBuilder.ts
 *
 * Mutation hook builders for update operations (parameterized and self).
 *
 * @module react/hooks/crud/builders/mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getClient } from '@routesync/sdk';
import type { CrudHooksConfig } from '../../crudTypes';
import {
  requireValidId,
  callUpdate,
  callUpdateNoParam
} from '../../crudCallers';
import { getSuccessMessage, getErrorMessage } from '../../crudNotifications';
import { resolveInvalidate } from './invalidateResolver';

export function buildUseUpdate<ReadIndexList, ReadShow, CreateForm, UpdateForm>(
  config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
) {
  const { service, queryKey, groupName } = config;
  return (mutationOptions?: unknown) => {
    const svc = service.update;
    if (!svc) throw new Error('Update is not supported for this resource');
    const qc = useQueryClient();
    const options = mutationOptions as Record<string, unknown> | undefined;
    return useMutation({
      ...options,
      mutationFn: ({ id, data }: { id: number; data: UpdateForm }) =>
        callUpdate(svc, requireValidId(id), data),
      onSuccess: (data: unknown, vars: { id: number; data: UpdateForm }, context: unknown) => {
        qc.invalidateQueries({ queryKey: queryKey.list() });
        qc.invalidateQueries({ queryKey: queryKey.detail(vars.id) });
        resolveInvalidate(qc, config.cache?.update?.invalidate, vars.id);

        try {
          const client = getClient();
          const msg = getSuccessMessage(data, 'update', groupName || '');
          if (msg) client.config.toast?.success?.(msg);
        } catch (e) {}

        const opt = options as { onSuccess?: (data: unknown, variables: { id: number; data: UpdateForm }, context: unknown) => void } | undefined;
        opt?.onSuccess?.(data, vars, context);
      },
      onError: (error: unknown, vars: { id: number; data: UpdateForm }, context: unknown) => {
        try {
          const client = getClient();
          const msg = getErrorMessage(error, 'update', groupName || '');
          if (msg) client.config.toast?.error?.(msg);
        } catch (e) {}

        const opt = options as { onError?: (error: unknown, variables: { id: number; data: UpdateForm }, context: unknown) => void } | undefined;
        opt?.onError?.(error, vars, context);
      }
    });
  };
}

export function buildUseUpdateSelf<ReadIndexList, ReadShow, CreateForm, UpdateForm>(
  config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
) {
  const { service, queryKey, groupName } = config;
  return (mutationOptions?: unknown) => {
    const svc = service.updateSelf;
    if (!svc) throw new Error('UpdateSelf is not supported for this resource');
    const qc = useQueryClient();
    const options = mutationOptions as Record<string, unknown> | undefined;
    return useMutation({
      ...options,
      mutationFn: (data: UpdateForm) => callUpdateNoParam(svc, data),
      onSuccess: (data: unknown, variables: UpdateForm, context: unknown) => {
        qc.invalidateQueries({ queryKey: queryKey.list() });
        resolveInvalidate(qc, config.cache?.updateSelf?.invalidate);

        try {
          const client = getClient();
          const msg = getSuccessMessage(data, 'update', groupName || '');
          if (msg) client.config.toast?.success?.(msg);
        } catch (e) {}

        const opt = options as { onSuccess?: (data: unknown, variables: UpdateForm, context: unknown) => void } | undefined;
        opt?.onSuccess?.(data, variables, context);
      },
      onError: (error: unknown, variables: UpdateForm, context: unknown) => {
        try {
          const client = getClient();
          const msg = getErrorMessage(error, 'update', groupName || '');
          if (msg) client.config.toast?.error?.(msg);
        } catch (e) {}

        const opt = options as { onError?: (error: unknown, variables: UpdateForm, context: unknown) => void } | undefined;
        opt?.onError?.(error, variables, context);
      }
    });
  };
}
