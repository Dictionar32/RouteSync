import {
  ParsedRoute,
  RouteManifest,
  ParsedChannel,
  ParsedResource,
  ParsedModel,
  ResourceRouteGroup,
  FrontendConfig,
  PageConfig
} from '@routesync/core'
import type { RequestType } from '@routesync/core'
import type { ObjectType } from '@routesync/core'
import fs from 'fs-extra'

export interface ManifestGeneratorOptions {
  readonly routes: readonly ParsedRoute[];
  readonly baseURL: string;
  readonly channels: readonly ParsedChannel[];
  readonly resources: readonly ParsedResource[];
  readonly models: readonly ParsedModel[];
  readonly routeGroups: readonly ResourceRouteGroup[];
  readonly requestTypes: readonly RequestType[];
  readonly semanticTypes: readonly ObjectType[];
  readonly frontend: FrontendConfig ;
  readonly pages: readonly PageConfig[];
  readonly version: string;
}

export class ManifestGenerator {
  static generate(
    routes: readonly ParsedRoute[],
    baseURL: string,
    channels: readonly ParsedChannel[] = [],
    resources: readonly ParsedResource[] = [],
    models: readonly ParsedModel[] = [],
    routeGroups: readonly ResourceRouteGroup[] = [],
    requestTypes: readonly RequestType[] = [],
    semanticTypes: readonly ObjectType[] = [],
    frontend: FrontendConfig | null = null,
    pages: readonly PageConfig[] = [],
    version: string = '1.0.0'
  ): RouteManifest {
    return {
      version,
      baseURL,
      routes: Object.freeze([...routes]),
      resources: Object.freeze([...resources]),
      models: Object.freeze([...models]),
      routeGroups: Object.freeze([...routeGroups]),
      requestTypes: Object.freeze([...requestTypes]),
      semanticTypes: Object.freeze([...semanticTypes]),
      channels: Object.freeze([...channels]),
      frontend,
      pages: Object.freeze([...pages]),
      generatedAt: new Date().toISOString()
    };
  }

  static fromOptions({
    routes,
    baseURL,
    channels = [],
    resources = [],
    models = [],
    routeGroups = [],
    requestTypes = [],
    semanticTypes = [],
    frontend = null,
    pages = [],
    version = '1.0.0'
  }: ManifestGeneratorOptions): RouteManifest {
    return ManifestGenerator.generate(
      routes,
      baseURL,
      channels,
      resources,
      models,
      routeGroups,
      requestTypes,
      semanticTypes,
      frontend,
      pages,
      version
    );
  }

  static async save(manifest: RouteManifest, outputPath: string): Promise<void> {
    const mergedManifest = { ...manifest }
    try {
      if (await fs.pathExists(outputPath)) {
        const existing = await fs.readJson(outputPath)
        if (existing && typeof existing === 'object') {
          if ('frontend' in existing) mergedManifest.frontend = existing.frontend
          if ('pages' in existing) mergedManifest.pages = existing.pages
        }
      }
    } catch (e) {
      // ignore
    }
    await fs.writeJson(outputPath, mergedManifest, { spaces: 2 })
  }
}
