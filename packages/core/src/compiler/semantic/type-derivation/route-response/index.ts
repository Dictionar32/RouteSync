/**
 * index.ts
 *
 * Route response derivation sub-domain exports.
 *
 * @module core/compiler/semantic/type-derivation/route-response
 */

export {
    extractRouteResponseShape,
    type RouteResponseShape
} from './shapeExtractor';

export { processResponseProperties } from './propertyProcessor';
