/**
 * annotate.ts
 *
 * Active Consumer Orchestrator for Annotate Command.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`), explicit named exports only.
 *
 * @module cli/commands/annotate
 */

import { Command } from 'commander';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import {
    type AnnotationResult,
    type AnnotateOptions,
    buildPhpDiscoveryScript,
    ensureResponseAttributeClass,
    applyAnnotationsToFile
} from './annotate/index';

export {
    type AnnotationResult,
    type AnnotateOptions,
    buildPhpDiscoveryScript,
    ensureResponseAttributeClass,
    applyAnnotationsToFile
};

export const annotateCommand = new Command('annotate')
  .description('Auto-inject #[Response] PHP 8 attributes into controller methods based on Resource discovery')
  .option('--input <file>', 'Path to routes/api.php', 'routes/api.php')
  .option('--dry-run', 'Preview changes without writing files')
  .option('--force', 'Re-annotate methods that already have #[Response]')
  .action(async (options: AnnotateOptions) => {
    const filePath = path.resolve(options.input);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Routes file not found: ${filePath}`);
      process.exit(1);
    }

    const projectRoot = path.resolve(path.dirname(filePath), '..');
    const phpScript = buildPhpDiscoveryScript(!!options.force);

    const tmpFile = path.join(projectRoot, `routesync-annotate-${Date.now()}.php`);
    fs.writeFileSync(tmpFile, phpScript);

    let annotations: AnnotationResult[] | undefined;
    try {
      const output = execSync(`php ${tmpFile}`, { cwd: projectRoot, encoding: 'utf-8' });
      annotations = JSON.parse(output) as AnnotationResult[];
    } catch (e: unknown) {
      console.error('❌ PHP execution failed. Make sure PHP is available and database is accessible.');
      if (e && typeof e === 'object' && 'stderr' in e) {
        console.error('PHP error output:');
        console.error((e as { stderr: string }).stderr);
      }
      if (e && typeof e === 'object' && 'stdout' in e) {
        const stdout = (e as { stdout: string }).stdout;
        if (stdout) console.error('PHP stdout:', stdout);
      }
      console.error('Temp script preserved at:', tmpFile);
      process.exit(1);
    }
    fs.removeSync(tmpFile);

    if (!annotations || annotations.length === 0) {
      console.log('✔ No methods to annotate — all routes already annotated or no Resources detected.');
      return;
    }

    // Group by controller file, deduplicate by methodName
    const byFile = new Map<string, AnnotationResult[]>();
    for (const ann of annotations) {
      const existing = byFile.get(ann.controllerFile) ?? [];
      if (!existing.find(e => e.methodName === ann.methodName)) {
        existing.push(ann);
      }
      byFile.set(ann.controllerFile, existing);
    }

    ensureResponseAttributeClass(projectRoot, !!options.dryRun);

    let totalAnnotated = 0;

    for (const [ctrlFile, anns] of byFile) {
      totalAnnotated += applyAnnotationsToFile(ctrlFile, anns, !!options.dryRun);
    }

    if (options.dryRun) {
      console.log(`\n✔ [dry-run] Would annotate ${totalAnnotated} method(s) across ${byFile.size} controller file(s)`);
      console.log('  Run without --dry-run to apply.');
    } else {
      console.log(`✔ Annotated ${totalAnnotated} method(s) across ${byFile.size} controller file(s)`);
      console.log('\n  Next steps:');
      console.log('  1. npx routesync scan --input routes/api.php --models');
      console.log('  2. Copy routesync.manifest.json to your frontend folder');
      console.log('  3. npx routesync generate --manifest routesync.manifest.json --output src/api --next-actions --zod');
    }
  });
