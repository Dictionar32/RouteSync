import type { RouteManifest } from '@routesync/core';
import path from 'path';
import { type ClassifiedRoute, classifyDomainGraph, type ClassifiedDomainGraph } from './route-classifier';
import { CodeWriter } from './code-writer';
import {
  lowerRuntimeManifestSource,
  lowerHookSource
} from './hooks';

export {
  pushUnique,
  addRouteInvalidations,
  toNormalizedActionKey,
  lowerGroupCacheLines,
  lowerGroupHookConfig,
  lowerRuntimeManifestSource,
  lowerHookSource
} from './hooks';

export class HookGenerator {
  static async generate(
    manifest: RouteManifest,
    outputDir?: string,
    domainGraph?: ClassifiedDomainGraph<ClassifiedRoute>
  ): Promise<string> {
    const graph = domainGraph ?? classifyDomainGraph(manifest);

    if (outputDir) {
      const runtimeWriter = new CodeWriter();
      runtimeWriter.write(lowerRuntimeManifestSource(manifest));
      await runtimeWriter.writeToFile(path.join(outputDir, 'routesync.runtime.ts'));
    }

    const hookWriter = new CodeWriter();
    hookWriter.write(lowerHookSource(graph, manifest));
    const result = hookWriter.toString();

    if (outputDir) {
      await hookWriter.writeToFile(path.join(outputDir, 'hooks.ts'));
    }

    return result;
  }
}
