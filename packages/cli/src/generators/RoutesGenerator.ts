/**
 * RoutesGenerator.ts
 *
 * Emits routes.js and routes.d.ts from manifest pages.
 * Active Consumer orchestrating route tree building, serialization, and file emission.
 *
 * @module cli/generators/RoutesGenerator
 */

import type { RouteManifest } from '@routesync/core';
import path from 'path';
import fs from 'fs-extra';
import {
  ScannedPageEndpointDescriptor,
  type ScannedPageEndpointParams,
  buildRouteTree,
  serializeRouteTree,
  findNodeModulesRouteSync
} from './routes';

export {
  ScannedPageEndpointDescriptor,
  type ScannedPageEndpointParams,
  buildRouteTree,
  serializeRouteTree,
  findNodeModulesRouteSync
};

export class RoutesGenerator {
  static async generate(manifest: RouteManifest, outputDir: string): Promise<boolean> {
    try {
      if (!manifest.pages || typeof manifest.pages !== 'object') {
        return false;
      }

      const sdkDir = findNodeModulesRouteSync(outputDir) || outputDir;
      const distDir = sdkDir === outputDir ? outputDir : path.join(sdkDir, 'dist');

      const routeTree = buildRouteTree(manifest.pages as Record<string, unknown>);
      const tree = serializeRouteTree(routeTree);

      // Write JS file
      const jsContent = [
        `const { PathResolver } = require('./core.js');`,
        `const routes = {`,
        ...tree.js,
        `};`,
        `exports.routes = routes;`
      ].join('\n');

      // Write DTS file
      const dtsContent = [
        `import { PathResolver } from './core';`,
        `export declare const routes: {`,
        ...tree.dts,
        `};`
      ].join('\n');

      await fs.ensureDir(distDir);
      await fs.writeFile(path.join(distDir, 'routes.js'), jsContent);
      await fs.writeFile(path.join(distDir, 'routes.d.ts'), dtsContent);

      // Clean up legacy routes.ts in the output directory if it exists
      const legacyPath = path.join(outputDir, 'routes.ts');
      if (await fs.pathExists(legacyPath)) {
        await fs.remove(legacyPath);
      }

      return true;
    } catch (e) {
      console.error('Failed to generate routes:', e);
      return false;
    }
  }
}
