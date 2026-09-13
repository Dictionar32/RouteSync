/**
 * index.ts
 *
 * Route response derivation sub-domain exports.
 *
 * @module core/compiler/scanner/subscanners/semantic/route-response
 */

export {
    extractRouteResponseShape,
    type RouteResponseShape
} from './shapeExtractor';

export { processResponseProperties } from './propertyProcessor';
