/**
 * entityDefinitions.ts
 *
 * Active Consumer & Coordinator re-exporting RouteDef, ResourceDef, and ModelDef.
 * Conforms to Rule 14: Zero wildcard re-exports (<= 100 lines).
 *
 * @module core/types/domain/entityDefinitions
 */

export type {
  RoutePath,
  HttpVerb,
  HttpStatus,
  RouteIdentityContract,
  RouteSecurityContract,
  RoutePayloadContract,
  RouteProvenanceContract,
  RouteDefContract,
  RouteDef
} from './routeEntityDefinition';

export {
  createRoutePath,
  createHttpVerb
} from './routeEntityDefinition';

export {
  RouteDefDescriptor
} from './routeEntityDescriptor';

export type {
  ColumnDefinitionContract,
  ColumnDefinition,
  ModelRelationDefinitionContract,
  ModelRelationDefinition,
  ResourceDefContract,
  ResourceDef,
  ModelDefContract,
  ModelDef
} from './modelEntityDefinition';

export {
  ResourceDefDescriptor,
  ModelDefDescriptor
} from './modelEntityDescriptor';
