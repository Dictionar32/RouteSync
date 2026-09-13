/**
 * TypeScriptWriter.ts
 *
 * Active Consumer: Writes compiler output to file system with proper directory structure.
 *
 * @module cli/generators/TypeScriptWriter
 */

import fs from 'fs-extra';
import path from 'path';
import type { CompilerOutput } from './CompilerBridge';
import {
    formatGeneratedFile,
    formatIndexFile,
    formatMappersIndex,
    formatRootIndex,
    printGenerationSummary
} from './writer';

export class TypeScriptWriter {
    static async write(output: CompilerOutput, outputDir: string): Promise<void> {
        console.log('[TypeScriptWriter] Writing files...');

        // Create types directory
        const typesDir = path.join(outputDir, 'types');
        await fs.ensureDir(typesDir);

        // Write generated.ts
        const generatedPath = path.join(typesDir, 'generated.ts');
        const generatedContent = formatGeneratedFile(output);
        await fs.writeFile(generatedPath, generatedContent, 'utf-8');
        console.log(`  ✓ types/generated.ts (${generatedContent.length} chars)`);

        // Write index.ts
        const indexPath = path.join(typesDir, 'index.ts');
        const indexContent = formatIndexFile(output);
        await fs.writeFile(indexPath, indexContent, 'utf-8');
        console.log('  ✓ types/index.ts (re-exports)');

        // Write mappers directory (placeholder for now)
        const mappersDir = path.join(outputDir, 'mappers');
        await fs.ensureDir(mappersDir);
        const mappersIndexPath = path.join(mappersDir, 'index.ts');
        await fs.writeFile(mappersIndexPath, formatMappersIndex(), 'utf-8');
        console.log('  ✓ mappers/index.ts (placeholder)');

        // Write root index.ts
        const rootIndexPath = path.join(outputDir, 'index.ts');
        const rootIndexContent = formatRootIndex();
        await fs.writeFile(rootIndexPath, rootIndexContent, 'utf-8');
        console.log('  ✓ index.ts (root exports)');

        printGenerationSummary(output);
    }
}
