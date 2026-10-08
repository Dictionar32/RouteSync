/**
 * Deprecated compatibility facade. Semantic CRUD authority lives upstream.
 * This adapter performs no independent classification.
 */
import type { RoutePath } from '../../../types/upstream/names';
import { createRoutePath } from '../../../types/upstream/names';
import type { CrudRole, HttpMethod } from '../../../types/upstream/routeExecutionVocabulary';
import { routeCapabilityAuthority } from '../../../types/upstream/routeCapabilityAuthority';

export class RouteCrudClassifier {
  /** @deprecated Prefer routeCapabilityAuthority.crudRoleFromRoute(). */
  public static classify(method: HttpMethod, path: string): CrudRole;
  public static classify(method: HttpMethod, path: RoutePath): CrudRole;
  public static classify(method: HttpMethod, path: string | RoutePath): CrudRole {
    const routePath: RoutePath = typeof path === 'string' ? createRoutePath(path) : path;
    return routeCapabilityAuthority.crudRoleFromRoute(method, routePath);
  }
}
