/**
 * audit.ts
 *
 * Audit command for checking manifest drift and semantic resolution coverage.
 * Active Consumer orchestrating drift and semantic auditors.
 *
 * @module cli/commands/audit
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { auditManifestDrift, auditSemanticCoverage } from './audit/index';

export const auditCommand = new Command('audit')
  .description('Audit the manifest for unresolved fields and missing resolvers')
  .option('-g, --graph <path>', 'Path to graph file', 'routesync.graph.json')
  .option('-m, --manifest <path>', 'Path to manifest file', 'routesync.manifest.json')
  .option('-i, --input <path>', 'Path to routes/api.php', 'routes/api.php')
  .option('--check-drift', 'Verify that the manifest matches current routes')
  .option('-v, --verbose', 'Show detailed breakdown of unresolved fields')
  .action(async (options) => {
    try {
      if (options.checkDrift) {
        await auditManifestDrift(options.manifest);
        return;
      }

      auditSemanticCoverage({
        graph: options.graph,
        verbose: options.verbose
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`Error: ${msg}`));
      process.exit(1);
    }
  });

export default auditCommand;
