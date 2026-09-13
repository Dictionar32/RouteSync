/**
 * extraHooksBuilder.ts
 *
 * Custom / Extra endpoint hooks generator for React Query CRUD operations.
 *
 * @module react/hooks/crud/builders/extraHooksBuilder
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClient } from '@routesync/sdk';
import type { CrudHooksConfig, ExtraEndpoint } from '../crudTypes';
import { isEndpoint } from '../crudCallers';
import { getSuccessMessage, getErrorMessage } from '../crudNotifications';

export function buildExtraHooks<ReadIndexList, ReadShow, CreateForm, UpdateForm>(
  config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
): Record<string, (...args: unknown[]) => unknown> {
  const { queryKey, groupName, extras } = config;
  const extraHooks: Record<string, (...args: unknown[]) => unknown> = {};

  if (!extras) return extraHooks;

  for (const [name, extra] of Object.entries(extras)) {
    const hookName = `use${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    const method = extra.method ?? (isEndpoint(extra.service) ? (extra.service as { $def?: { method?: string } }).$def?.method : 'POST');

    if (method === 'GET') {
      extraHooks[hookName] = (options?: unknown, queryOptions?: unknown) => {
        const resolvedKey = extra.queryKey
          ? (extra.queryKey as (opt?: unknown) => readonly unknown[])(options)
          : [...queryKey.list(), name, options].filter(Boolean);
        const svc = extra.service as (opts?: unknown) => Promise<unknown>;
        return useQuery({
          ...(queryOptions as Record<string, unknown>),
          queryKey: resolvedKey,
          queryFn: () => svc(options),
        });
      };
    } else {
      extraHooks[hookName] = (mutationOptions?: unknown) => {
        const qc = useQueryClient();
        const options = mutationOptions as Record<string, unknown> | undefined;
        return useMutation({
          ...options,
          mutationFn: (variables: unknown) => {
            const svc = extra.service as (opts?: unknown) => Promise<unknown>;
            return svc(variables);
          },
          onSuccess: (data: unknown, variables: unknown, context: unknown) => {
            if (extra.queryKey) {
              qc.invalidateQueries({ queryKey: (extra.queryKey as (opt?: unknown) => readonly unknown[])(variables) });
            }
            if (extra.invalidate) {
              extra.invalidate.forEach(inv => {
                const key = typeof inv === 'function' ? (inv as (...args: unknown[]) => readonly unknown[])(variables) : inv;
                qc.invalidateQueries({ queryKey: key });
              });
            }

            try {
              const client = getClient();
              const action: 'create' | 'update' | 'remove' | '' =
                name.startsWith('create') || name.startsWith('add') || name.startsWith('apply') ? 'create' :
                name.startsWith('update') || name.startsWith('set') || name.startsWith('change') ? 'update' :
                name.startsWith('remove') || name.startsWith('delete') || name.startsWith('clear') ? 'remove' : '';
              if (action) {
                const msg = getSuccessMessage(data, action, groupName || '');
                if (msg) client.config.toast?.success?.(msg);
              }
            } catch (e) {}

            const opt = options as { onSuccess?: (data: unknown, variables: unknown, context: unknown) => void } | undefined;
            opt?.onSuccess?.(data, variables, context);
          },
          onError: (error: unknown, variables: unknown, context: unknown) => {
            try {
              const client = getClient();
              const action: 'create' | 'update' | 'remove' | '' =
                name.startsWith('create') || name.startsWith('add') || name.startsWith('apply') ? 'create' :
                name.startsWith('update') || name.startsWith('set') || name.startsWith('change') ? 'update' :
                name.startsWith('remove') || name.startsWith('delete') || name.startsWith('clear') ? 'remove' : '';
              if (action) {
                const msg = getErrorMessage(error, action, groupName || '');
                if (msg) client.config.toast?.error?.(msg);
              }
            } catch (e) {}

            const opt = options as { onError?: (error: unknown, variables: unknown, context: unknown) => void } | undefined;
            opt?.onError?.(error, variables, context);
          }
        });
      };
    }
  }

  return extraHooks;
}
