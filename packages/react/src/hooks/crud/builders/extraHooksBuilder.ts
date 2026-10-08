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
import { getSuccessMessage, getErrorMessage } from '../crudNotifications';

export function buildExtraHooks<ReadIndexList, ReadShow, CreateForm, UpdateForm>(
  config: CrudHooksConfig<ReadIndexList, ReadShow, CreateForm, UpdateForm>
): Record<string, (...args: unknown[]) => unknown> {
  const { groupName, extras } = config;
  const extraHooks: Record<string, (...args: unknown[]) => unknown> = {};

  if (!extras) return extraHooks;

  for (const [name, extra] of Object.entries(extras)) {
    const hookName = `use${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    const hookKind = extra.hookKind;
    if (!hookKind) throw new Error(`RouteSync extra endpoint ${name} is missing the upstream hook-kind capability`);

    if (hookKind === 'query' || hookKind === 'infinite_query') {
      extraHooks[hookName] = (options?: unknown, queryOptions?: unknown) => {
        const svc = extra.service as { (opts?: unknown): Promise<unknown>; $queryKey?: (opt?: unknown) => readonly unknown[] };
        const resolvedKey = extra.queryKey
          ? extra.queryKey(options)
          : svc.$queryKey?.(options);
        if (!resolvedKey) throw new Error(`RouteSync extra endpoint ${name} is missing an upstream query-key projection`);
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
              qc.invalidateQueries({ queryKey: extra.queryKey(variables) });
            }
            if (extra.invalidate) {
              extra.invalidate.forEach(inv => {
                const key = typeof inv === 'function' ? (inv as (...args: unknown[]) => readonly unknown[])(variables) : inv;
                qc.invalidateQueries({ queryKey: key });
              });
            }

            try {
              const client = getClient();
              const action = extra.crudRole === 'create'
                ? 'create'
                : extra.crudRole === 'update'
                  ? 'update'
                  : extra.crudRole === 'delete'
                    ? 'remove'
                    : '';
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
              const action = extra.crudRole === 'create'
                ? 'create'
                : extra.crudRole === 'update'
                  ? 'update'
                  : extra.crudRole === 'delete'
                    ? 'remove'
                    : '';
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
