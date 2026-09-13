/**
 * Routes generator sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 */

export {
  ScannedPageEndpointDescriptor,
  type ScannedPageEndpointParams
} from './pageEndpointDescriptor';

export {
  buildRouteTree,
  serializeRouteTree
} from './routeTreeSerializer';

export {
  findNodeModulesRouteSync
} from './pathLookup';
