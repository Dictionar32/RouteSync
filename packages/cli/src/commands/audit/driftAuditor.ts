/**
 * driftAuditor.ts
 *
 * Verifies that the existing manifest matches current scanned Laravel routes.
 *
 * @module cli/commands/audit
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';
import { createLaravelSourceProjectIdentity, stringValue, laravelRouteSourceSelectionAuthority, sourceFileIdentityFactory } from '@routesync/core';
import { controllerInvocationManifestBuilder } from '../../parsers/php/controllerInvocationManifestComposition';

import type { RouteManifest, RouteSemanticFlow } from '@routesync/core';
import type { ControllerInvocationManifest } from '../../parsers/php/controllerInvocationManifestCompositionInterface';
import { controllerInvocationManifestCompositionInputFactory } from '../../parsers/php/controllerInvocationManifestCompositionInterface'

const auditManifestDrift = async (manifestOption: string, cwd: string = process.cwd()): Promise<void> => {
  const manifestPath = path.resolve(cwd, manifestOption);
  if (!fs.existsSync(manifestPath)) {
    console.error(chalk.red(`Manifest file not found: ${manifestPath}`));
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as RouteManifest;
  const freshManifest = await controllerInvocationManifestBuilder.build(controllerInvocationManifestCompositionInputFactory.create(
    createLaravelSourceProjectIdentity.create(sourceFileIdentityFactory.create(stringValue.create(cwd))),
    laravelRouteSourceSelectionAuthority.defaultIntent(),
  ));
  const completeFreshManifest = freshManifest.requireCompleteManifest();
  const routes = completeFreshManifest.ast.ast.routeFlows;

  const hashRoute = (r: RouteSemanticFlow): string => {
    const replacer = (key: string, value: unknown) => {
      if (key === 'resolved' || key === 'parsed_ast') return undefined;
      return value;
    };
    const content = JSON.stringify(r, replacer);
    return crypto.createHash('sha256').update(content).digest('hex');
  };
  const routeKey = (r: RouteSemanticFlow): string => `${r.identity.coordinates.method}:${r.identity.coordinates.path}`;
  const freshRoutes = new Map<string, { route: RouteSemanticFlow; hash: string }>();
  routes.forEach((r: RouteSemanticFlow) => {
    freshRoutes.set(routeKey(r), { route: r, hash: hashRoute(r) });
  });

  const manifestRoutes = new Map<string, { route: RouteSemanticFlow; hash: string }>();
  manifest.routes.forEach((r: RouteSemanticFlow) => {
    manifestRoutes.set(routeKey(r), { route: r, hash: hashRoute(r) });
  });

  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const [key, freshRoute] of freshRoutes.entries()) {
    const mRoute = manifestRoutes.get(key);
    if (!mRoute) {
      added.push(`  + ${freshRoute.route.identity.coordinates.method} ${freshRoute.route.identity.coordinates.path}`);
    } else if (mRoute.hash !== freshRoute.hash) {
      changed.push(`  ~ ${freshRoute.route.identity.coordinates.method} ${freshRoute.route.identity.coordinates.path} (semantic hash changed)`);
    }
  }

  for (const [key, mRoute] of manifestRoutes.entries()) {
    if (!freshRoutes.has(key)) {
      removed.push(`  - ${mRoute.route.identity.coordinates.method} ${mRoute.route.identity.coordinates.path}`);
    }
  }

  if (added.length > 0 || removed.length > 0 || changed.length > 0) {
    console.error(chalk.red.bold('\n[RouteSync Error] Manifest drift detected!'));
    if (added.length > 0) {
      console.error(chalk.green(`\nAdded routes:\n${added.join('\n')}`));
    }
    if (removed.length > 0) {
      console.error(chalk.red(`\nRemoved routes:\n${removed.join('\n')}`));
    }
    if (changed.length > 0) {
      console.error(chalk.yellow(`\nModified routes:\n${changed.join('\n')}`));
    }
    console.error(chalk.yellow('\nRun `routesync scan` or `routesync sync` to update the manifest file.\n'));
    process.exit(1);
  }

  console.log(chalk.green('\n✔ Manifest matches current Laravel routes. No drift detected.\n'));
  process.exit(0);
};

export interface ManifestDriftAuditOperationsInterface {
  readonly audit: (manifestOption: string, cwd?: string) => Promise<void>;
}

export const manifestDriftAuditOperations: ManifestDriftAuditOperationsInterface = Object.freeze({
  audit: auditManifestDrift,
});
