/**
 * invalidateResolver.ts
 *
 * Query invalidation helper for React Query mutations.
 *
 * @module react/hooks/crud/builders/mutations
 */

import type { QueryClient } from '@tanstack/react-query';
import type { InvalidateList } from '../../crudTypes';

export function resolveInvalidate(qc: QueryClient, list: InvalidateList | undefined, arg?: unknown): void {
  if (!list) return;
  list.forEach(inv => {
    const key = typeof inv === 'function' ? (inv as (...args: unknown[]) => readonly unknown[])(arg) : inv;
    qc.invalidateQueries({ queryKey: key });
  });
}
