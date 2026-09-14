/**
 * scannedManifestDescriptor.ts
 *
 * First-Class Level 7 Domain Descriptor for Scanned Manifests.
 * Implements ScannedManifestContract with complete contracts.
 *
 * @module cli/utils/incremental/descriptors
 */

import { SourceRefFactory } from '@routesync/core';
import type {
  ScannedManifestContract,
  ScannedManifestOptions
} from '../types/scannedManifestTypes';
import type { ScannedModelContract } from '../types/scannedModelTypes';
import { ScannedRouteDescriptor } from './scannedRouteDescriptor';
import { ScannedResourceDescriptor } from './scannedResourceDescriptor';

export class ScannedManifestDescriptor implements ScannedManifestContract {
  public readonly routes: readonly ScannedRouteDescriptor[];
  public readonly models: readonly ScannedModelContract[];
  public readonly resources: readonly ScannedResourceDescriptor[];

  public constructor(contract: ScannedManifestContract) {
    this.routes = contract.routes as readonly ScannedRouteDescriptor[];
    this.models = contract.models;
    this.resources = contract.resources as readonly ScannedResourceDescriptor[];
  }

  public static create(options: ScannedManifestOptions): ScannedManifestDescriptor {
    const routes = (options.routes || []).map((r) =>
      r instanceof ScannedRouteDescriptor ? r : ScannedRouteDescriptor.create(r)
    );

    const models: ScannedModelContract[] = (options.models || []).map((m) => ({
      name: m.name,
      accessorEntries: 'accessorEntries' in m ? m.accessorEntries : Object.entries(m.accessors || {}).map(([k, v]) => [k, {
        type: v.type || 'unknown',
        expression: v.expression || '',
        expressionCode: v.expression_code || '',
        source: SourceRefFactory.create(v.sourceFile || '', 'model', v.sourceLine ?? 1, 0),
        ast: v.ast,
        semantic: v.semantic
      }])
    }));

    const resources = (options.resources || []).map((res) =>
      res instanceof ScannedResourceDescriptor ? res : ScannedResourceDescriptor.create(res)
    );

    return new ScannedManifestDescriptor({
      routes,
      models,
      resources
    });
  }

  public static empty(): ScannedManifestDescriptor {
    return new ScannedManifestDescriptor({ routes: [], models: [], resources: [] });
  }

  public static fromRaw(raw: Record<string, unknown>): ScannedManifestDescriptor {
    return ScannedManifestDescriptor.create(raw as unknown as ScannedManifestOptions);
  }
}
