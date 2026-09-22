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
import { StaticLaravelScanner, createLaravelSourceProjectIdentity } from '@routesync/core';

import type { ScannedRoute, ScannedManifest } from '../../utils/incremental/incrementalTypes';

export async function auditManifestDrift(manifestOption: string, cwd: string = process.cwd()): Promise<void> {
  const manifestPath = path.resolve(cwd, manifestOption);
  if (!fs.existsSync(manifestPath)) {
    console.error(chalk.red(`Manifest file not found: ${manifestPath}`));
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as ScannedManifest;
  const freshManifest = await StaticLaravelScanner.scan(createLaravelSourceProjectIdentity(cwd));
  const routes = (freshManifest.routes || []) as any[];

  const freshRoutes = new Map<string, ScannedRoute>();
  routes.forEach((r: ScannedRoute) => {
    const replacer = (key: string, value: unknown) => {
      if (key === 'resolved' || key === 'parsed_ast') return undefined;
      return value;
    };
    const content = JSON.stringify({
      method: r.method,
      path: r.path,
      auth: r.auth,
      schema: r.schema || null,
      response: r.response || null,
      assignments: r.assignments || null
    }, replacer);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    freshRoutes.set(`${r.method}:${r.path}`, { ...r, stableHash: hash });
  });

  const manifestRoutes = new Map<string, ScannedRoute>();
  if (manifest.routes) {
    manifest.routes.forEach((r: ScannedRoute) => {
      manifestRoutes.set(`${r.method}:${r.path}`, r);
    });
  }

  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const [key, freshRoute] of freshRoutes.entries()) {
    const mRoute = manifestRoutes.get(key);
    if (!mRoute) {
      added.push(`  + ${freshRoute.method} ${freshRoute.path}`);
    } else if (mRoute.stableHash !== freshRoute.stableHash) {
      changed.push(`  ~ ${freshRoute.method} ${freshRoute.path} (stableHash changed)`);
    }
  }

  for (const [key, mRoute] of manifestRoutes.entries()) {
    if (!freshRoutes.has(key)) {
      removed.push(`  - ${mRoute.method} ${mRoute.path}`);
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
}
