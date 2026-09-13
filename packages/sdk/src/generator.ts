/**
 * generator.ts
 *
 * Active Consumer: Orchestrates SDK generation from RouteManifest.
 *
 * @module sdk/generator
 */

import type { RouteManifest, GeneratedSDKModule } from '@routesync/core';
import {
  ZodEmitter,
  ReactQueryEmitter,
  generateModuleForRoute
} from './generator/index';

export { ZodEmitter, ReactQueryEmitter };

export class SdkGenerator {
  public static generate(manifest: RouteManifest): GeneratedSDKModule[] {
    const modules: GeneratedSDKModule[] = [];

    for (const route of manifest.routes) {
      const module = generateModuleForRoute(route, manifest.resources || []);
      if (module) {
        modules.push(module);
      }
    }

    return modules;
  }
}
