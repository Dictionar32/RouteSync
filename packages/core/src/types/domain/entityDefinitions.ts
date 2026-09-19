/**
 * entityDefinitions.ts
 *
 * Active Consumer & Coordinator re-exporting RouteDef, ResourceDef, and ModelDef.
 * Conforms to Rule 14: Zero wildcard re-exports (<= 100 lines).
 *
 * @module core/types/domain/entityDefinitions
 */

export type {
  RouteName,
  RoutePath,
  PropertyName,
  SourceFilePath,
  SourceLineNumber,
  RouteMiddlewareName,
  RouteSchemaEntry,
  RouteAssignmentEntry,
  StableRouteHash,
  HttpVerb,
  HttpStatus,
  RouteEntityIdentityContract,
  RouteSecurityContract,
  RoutePayloadContract,
  RouteEntityProvenanceContract,
  RouteDefContract,
  RouteDef,
  RawRouteDefInput
} from './routeEntityDefinition';

export {
  createRoutePath,
  createRouteName,
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
  ModelSemanticDefinitionContract,
  ModelSemanticDefinition,
  ResourceDefContract,
  ResourceDef,
} from './modelEntityDefinition';

export {
  ResourceDefDescriptor,
  ModelSemanticDefinitionDescriptor,
  ModelDefDescriptor
} from './modelEntityDescriptor';
