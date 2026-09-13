/**
 * createMutationBuilder.ts
 *
 * Mutation hook builder for create operation.
 *
 * @module react/hooks/crud/builders/mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getClient } from '@routesync/sdk';
import type { CrudHooksConfig } from '../../crudTypes';
import { callCreate } from '../../crudCallers';
import { getSuccessMessage, getErrorMessage } from '../../crudNotifications';
import { resolveInvalidate } from './invalidateResolver';

export function buildUseCreate<ReadIndexList, ReadShow, CreateForm, UpdateForm>(
  config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
) {
  const { service, queryKey, groupName } = config;
  return (mutationOptions?: unknown) => {
    const svc = service.create;
    if (!svc) throw new Error('Create is not supported for this resource');
    const qc = useQueryClient();
    const options = mutationOptions as Record<string, unknown> | undefined;
    return useMutation({
      ...options,
      mutationFn: (data: CreateForm) => callCreate(svc, data),
      onSuccess: (data: unknown, variables: CreateForm, context: unknown) => {
        qc.invalidateQueries({ queryKey: queryKey.list() });
        resolveInvalidate(qc, config.cache?.create?.invalidate);

        try {
          const client = getClient();
          const msg = getSuccessMessage(data, 'create', groupName || '');
          if (msg) client.config.toast?.success?.(msg);
        } catch (e) {}

        const opt = options as { onSuccess?: (data: unknown, variables: CreateForm, context: unknown) => void } | undefined;
        opt?.onSuccess?.(data, variables, context);
      },
      onError: (error: unknown, variables: CreateForm, context: unknown) => {
        try {
          const client = getClient();
          const msg = getErrorMessage(error, 'create', groupName || '');
          if (msg) client.config.toast?.error?.(msg);
        } catch (e) {}

        const opt = options as { onError?: (error: unknown, variables: CreateForm, context: unknown) => void } | undefined;
        opt?.onError?.(error, variables, context);
      }
    });
  };
}
