/**
 * routeManifestDescriptor.ts
 *
 * Descriptor class and factories for RouteManifest.
 *
 * @module core/compiler/scanner/descriptors/manifest
 */

import {
  type RouteManifest,
  type ParsedRoute,
  type ParsedResource,
  type ParsedModel,
  type ResourceRouteGroup,
  type BroadcastChannelDescriptor,
  type FrontendConfig,
  type PageConfig,
  type EndpointContract,
  ScannedEndpointContract
} from '../../../../types/route';
import type { RequestType } from '../../../artifacts/RequestTypesArtifact';
import type { ObjectType } from '../../../types/SemanticType';
import { TypeInterner } from '../../../types/TypeInterner';
import { TypeDeriver } from '../../subscanners/TypeDeriver';

export interface ScannedRouteManifestParams {
  readonly version: string;
  readonly baseURL: string;
  readonly routes: readonly ParsedRoute[];
  readonly contracts: readonly EndpointContract[];
  readonly resources: readonly ParsedResource[];
  readonly models: readonly ParsedModel[];
  readonly routeGroups: readonly ResourceRouteGroup[];
  readonly requestTypes: readonly RequestType[];
  readonly semanticTypes: readonly ObjectType[];
  readonly generatedAt: string;
  readonly channels: readonly BroadcastChannelDescriptor[];
  readonly frontend: FrontendConfig | null;
  readonly pages: readonly PageConfig[];
}

export class ScannedRouteManifestDescriptor implements RouteManifest {
  public readonly version: string;
  public readonly baseURL: string;
  public readonly routes: readonly ParsedRoute[];
  public readonly contracts: readonly EndpointContract[];
  public readonly resources: readonly ParsedResource[];
  public readonly models: readonly ParsedModel[];
  public readonly routeGroups: readonly ResourceRouteGroup[];
  public readonly requestTypes: readonly RequestType[];
  public readonly semanticTypes: readonly ObjectType[];
  public readonly generatedAt: string;
  public readonly channels: readonly BroadcastChannelDescriptor[];
  public readonly frontend: FrontendConfig | null;
  public readonly pages: readonly PageConfig[];

  constructor(params: ScannedRouteManifestParams) {
    this.version = params.version;
    this.baseURL = params.baseURL;
    this.routes = Object.freeze(params.routes);
    this.contracts = Object.freeze(params.contracts);
    this.resources = Object.freeze(params.resources);
    this.models = Object.freeze(params.models);
    this.routeGroups = Object.freeze(params.routeGroups);
    this.requestTypes = Object.freeze(params.requestTypes);
    this.semanticTypes = Object.freeze(params.semanticTypes);
    this.generatedAt = params.generatedAt;
    this.channels = Object.freeze(params.channels);
    this.frontend = params.frontend;
    this.pages = Object.freeze([...params.pages]);
    Object.freeze(this);
  }

  public static create({
    version = '6.0.0',
    baseURL = 'http://localhost/api',
    routes = [],
    contracts = [],
    resources = [],
    models = [],
    routeGroups = [],
    requestTypes = [],
    semanticTypes = [],
    generatedAt = new Date().toISOString(),
    channels = [],
    frontend = null,
    pages = []
  }: {
    readonly version?: string;
    readonly baseURL?: string;
    readonly routes?: readonly ParsedRoute[];
    readonly contracts?: readonly EndpointContract[];
    readonly resources?: readonly ParsedResource[];
    readonly models?: readonly ParsedModel[];
    readonly routeGroups?: readonly ResourceRouteGroup[];
    readonly requestTypes?: readonly RequestType[];
    readonly semanticTypes?: readonly ObjectType[];
    readonly generatedAt?: string;
    readonly channels?: readonly BroadcastChannelDescriptor[];
    readonly frontend?: FrontendConfig | null;
    readonly pages?: readonly PageConfig[];
  } = {}): ScannedRouteManifestDescriptor {
    const interner = new TypeInterner();
    const resolvedRequests = (requestTypes.length > 0)
      ? requestTypes
      : TypeDeriver.deriveRequestTypes(routes, resources, interner, models);
    const resolvedSemantics = (semanticTypes.length > 0)
      ? semanticTypes
      : TypeDeriver.deriveSemanticTypes(resources, models, interner, routes);
    const assembledContracts = contracts && contracts.length > 0
      ? contracts
      : routes.map(r => r.contract ?? ScannedEndpointContract.fromRoute(r));

    return new ScannedRouteManifestDescriptor({
      version,
      baseURL,
      routes,
      contracts: assembledContracts,
      resources,
      models,
      routeGroups,
      requestTypes: resolvedRequests,
      semanticTypes: resolvedSemantics,
      generatedAt,
      channels,
      frontend,
      pages
    });
  }

  public static empty(baseURL = 'http://localhost/api', version = '6.0.0'): ScannedRouteManifestDescriptor {
    return new ScannedRouteManifestDescriptor({
      version,
      baseURL,
      routes: [],
      contracts: [],
      resources: [],
      models: [],
      routeGroups: [],
      requestTypes: [],
      semanticTypes: [],
      generatedAt: new Date().toISOString(),
      channels: [],
      frontend: null,
      pages: []
    });
  }
}
