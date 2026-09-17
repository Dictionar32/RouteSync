/**
 * ManifestSerializer.ts
 *
 * Origin-boundary serialization for the RouteSync manifest.
 * Removes cyclic runtime links while preserving the complete semantic route.
 */

import type {
  EndpointContract,
  ParsedRoute,
  RouteManifest
} from '@routesync/core'

export interface SerializableManifestRoute extends Omit<ParsedRoute, 'contract'> {
  readonly contract: SerializableManifestContract;
  readonly identity: ParsedRoute['identity'];
  readonly binding: ParsedRoute['binding'];
  readonly capability: ParsedRoute['capability'];
  readonly provenance: ParsedRoute['provenance'];
}

export type SerializableManifestContract = EndpointContract;

export interface SerializableManifest extends Omit<RouteManifest, 'routes' | 'contracts'> {
  readonly routes: readonly SerializableManifestRoute[];
  readonly contracts: readonly SerializableManifestContract[];
}

function serializeRoute(route: ParsedRoute): SerializableManifestRoute {
  const { contract: _contract, ...routeFields } = route;

  return Object.freeze({
    ...routeFields,
    contract: serializeContract(route.contract),
    identity: route.identity,
    binding: route.binding,
    capability: route.capability,
    provenance: route.provenance
  });
}

function serializeContract(contract: EndpointContract): SerializableManifestContract {
  const serialized = contract;

  return Object.freeze({
    ...serialized,
    request: Object.freeze({
      ...serialized.request,
      body: Object.freeze({
        ...serialized.request.body,
        schema: serialized.request.body.schema
      }),
      pathParameters: Object.freeze([...serialized.request.pathParameters]),
      queryParameters: Object.freeze([...serialized.request.queryParameters])
    }),
    response: Object.freeze({
      ...serialized.response,
      errors: Object.freeze([...serialized.response.errors])
    }),
    policies: Object.freeze([...serialized.policies])
  });
}

export function serializeManifest(manifest: RouteManifest): SerializableManifest {
  return {
    version: manifest.version,
    baseURL: manifest.baseURL,
    routes: Object.freeze(manifest.routes.map(serializeRoute)),
    contracts: Object.freeze(manifest.contracts.map(serializeContract)),
    resources: Object.freeze([...manifest.resources]),
    models: Object.freeze([...manifest.models]),
    routeGroups: Object.freeze([...manifest.routeGroups]),
    requestTypes: Object.freeze([...manifest.requestTypes]),
    semanticTypes: Object.freeze([...manifest.semanticTypes]),
    generatedAt: manifest.generatedAt,
    channels: Object.freeze([...manifest.channels]),
    frontend: manifest.frontend,
    pages: Object.freeze([...manifest.pages])
  };
}
