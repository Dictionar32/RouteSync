#!/usr/bin/env node
import { Command } from 'commander';
import { scanCommand } from './commands/scan';
import { generateCommand } from './commands/generate';
import { syncCommand } from './commands/sync';
import { watchCommand } from './commands/watch';
import { annotateCommand } from './commands/annotate';
import { explainCommand } from './commands/explain';
import { auditCommand } from './commands/audit';

const program = new Command();

program
  .name('routesync')
  .description('Laravel routes to typed frontend SDKs')
  .version('1.0.0');

program.addCommand(scanCommand);
program.addCommand(generateCommand);
program.addCommand(syncCommand);
program.addCommand(watchCommand);
program.addCommand(annotateCommand);
program.addCommand(explainCommand);
program.addCommand(auditCommand);

const isCliEntry = Boolean(
  process.argv[1] &&
  (process.argv[1].endsWith('/cli.js') ||
   process.argv[1].endsWith('/routesync') ||
   process.argv[1].endsWith('/cli'))
);

if (isCliEntry) {
  program.parse(process.argv);
}

export { program };

export {
  resolveManifestIncrementally,
  calculateRouteHash,
  canonicalizeCollectionDescriptor,
  NominalAtomFactory,
  matchRouteResponsePayload,
  ScannedRouteDescriptor,
  ScannedResourceDescriptor,
  ScannedManifestDescriptor,
  type ScannedRoute,
  type ScannedResource,
  type ScannedModel,
  type ScannedManifest,
  type ScannedRouteContract,
  type ScannedResourceContract,
  type ScannedModelContract,
  type ScannedManifestContract,
  type RouteResponsePayloadContract,
  type RouteResponsePayloadVisitor,
  type KernelResolver,
  type ResolveManifestResult,
  type ScannedRouteMethod,
  type ScannedRoutePath,
  type ScannedRouteName,
  type ScannedStableHash,
  type SourceFilePath,
  type SourceLineNumber
} from './utils/incremental';
