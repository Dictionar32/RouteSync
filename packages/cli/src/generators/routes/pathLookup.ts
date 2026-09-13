/**
 * pathLookup.ts
 *
 * Locates routesync node_modules package path for route emitter output.
 *
 * @module cli/generators/routes
 */

import path from 'path';
import fs from 'fs-extra';

export function findNodeModulesRouteSync(outputDir: string): string | null {
  let current = path.resolve(outputDir);
  while (true) {
    const target = path.join(current, 'node_modules', 'routesync');
    if (fs.existsSync(target)) {
      return target;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return null;
}
