/**
 * summaryPrinter.ts
 *
 * Generation summary printer for TypeScriptWriter.
 *
 * @module cli/generators/writer
 */

import type { CompilerOutput } from '../CompilerBridge';

export function printGenerationSummary(output: CompilerOutput): void {
    console.log('');
    console.log('  📊 Generation Summary:');
    console.log(`     Types: ${output.metadata.typeCount}`);
    console.log(`     Interfaces: ${output.metadata.interfaceCount}`);
    console.log(`     Lines of code: ${output.metadata.linesOfCode}`);

    if (output.metadata.warnings.length > 0) {
        console.log('');
        console.log(`  ⚠️  Warnings (${output.metadata.warnings.length}):`);
        output.metadata.warnings.forEach(w => console.log(`     - ${w}`));
    }

    console.log('');
    console.log('  ✅ TypeScript generation complete!');
}
