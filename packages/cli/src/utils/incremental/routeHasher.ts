/**
 * routeHasher.ts
 *
 * Deterministic cryptographic hashing for route definitions.
 *
 * @module cli/utils/incremental/routeHasher
 */

import crypto from 'crypto';
import { ScannedRoute } from './incrementalTypes';

export function calculateRouteHash(route: ScannedRoute, availableModelNames: string[] = []): string {
  const replacer = (key: string, value: unknown) => {
    if (key === 'resolved' || key === 'parsed_ast') return undefined;
    return value;
  };
  const content = JSON.stringify({
    method: route.method,
    path: route.path,
    auth: route.auth,
    schema: route.schema || null,
    response: route.response || null,
    assignments: route.assignments || null,
    // Sorted so key order never affects the hash, only the actual set of
    // models available to resolve against.
    availableModels: [...availableModelNames].sort()
  }, replacer);
  return crypto.createHash('sha256').update(content).digest('hex');
}
