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
  type ResourceRouteGroup,
  type BroadcastChannelDescriptor,
  type FrontendConfiguration,
  type PageConfig,
} from '../../../../types/route';
import type { RequestType } from '../../../artifacts/RequestTypesArtifact';
import type { ObjectType } from '../../../types/SemanticType';
import type { ModelAst } from '../../../types/upstream/ast';

export interface ScannedRouteManifestParams {
  readonly version: string;
  readonly baseURL: string;
  readonly routes: readonly ParsedRoute[];
  readonly resources: readonly ParsedResource[];
  readonly models: readonly ModelAst[];
  readonly routeGroups: readonly ResourceRouteGroup[];
  readonly requestTypes: readonly RequestType[];
  readonly semanticTypes: readonly ObjectType[];
  readonly generatedAt: string;
  readonly channels: readonly BroadcastChannelDescriptor[];
  readonly frontend: FrontendConfiguration;
  readonly pages: readonly PageConfig[];
}

export class ScannedRouteManifestDescriptor implements RouteManifest {
  public readonly version: string;
  public readonly baseURL: string;
  public readonly routes: readonly ParsedRoute[];
  public readonly resources: readonly ParsedResource[];
  public readonly models: readonly ModelAst[];
  public readonly routeGroups: readonly ResourceRouteGroup[];
  public readonly requestTypes: readonly RequestType[];
  public readonly semanticTypes: readonly ObjectType[];
  public readonly generatedAt: string;
  public readonly channels: readonly BroadcastChannelDescriptor[];
  public readonly frontend: FrontendConfiguration;
  public readonly pages: readonly PageConfig[];

  constructor(params: ScannedRouteManifestParams) {
    this.version = params.version;
    this.baseURL = params.baseURL;
    this.routes = Object.freeze(params.routes);
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
    frontend = { kind: 'disabled' },
    pages = []
  }: {
    readonly version?: string;
    readonly baseURL?: string;
    readonly routes?: readonly ParsedRoute[];
    readonly contracts?: readonly EndpointContract[];
    readonly resources?: readonly ParsedResource[];
    readonly models?: readonly ModelAst[];
    readonly routeGroups?: readonly ResourceRouteGroup[];
    readonly requestTypes?: readonly RequestType[];
    readonly semanticTypes?: readonly ObjectType[];
    readonly generatedAt?: string;
    readonly channels?: readonly BroadcastChannelDescriptor[];
    readonly frontend?: FrontendConfiguration;
    readonly pages?: readonly PageConfig[];
  } = {}): ScannedRouteManifestDescriptor {
    const resolvedRequests = Object.freeze([...requestTypes]);
    const resolvedSemantics = Object.freeze([...semanticTypes]);
    return new ScannedRouteManifestDescriptor({
      version,
      baseURL,
      routes,
      contracts,
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
      resources: [],
      models: [],
      routeGroups: [],
      requestTypes: [],
      semanticTypes: [],
      generatedAt: new Date().toISOString(),
      channels: [],
      frontend: { kind: 'disabled' },
      pages: []
    });
  }
}
