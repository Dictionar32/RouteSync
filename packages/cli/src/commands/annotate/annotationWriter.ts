/**
 * annotationWriter.ts
 *
 * File modifications and #[Response] PHP attribute injector.
 *
 * @module cli/commands/annotate/annotationWriter
 */

import fs from 'fs-extra';
import path from 'path';
import type { AnnotationResult } from './types';

export function ensureResponseAttributeClass(projectRoot: string, dryRun: boolean): void {
    const attrPath = path.join(projectRoot, 'app', 'Attributes', 'Response.php');
    const attrExists = fs.existsSync(attrPath);

    if (!attrExists) {
        if (dryRun) {
            console.log('  [dry-run] Would create app/Attributes/Response.php');
        } else {
            fs.ensureDirSync(path.dirname(attrPath));
            fs.writeFileSync(attrPath, `<?php

namespace App\\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_METHOD)]
class Response
{
    public function __construct(
        public string $type,
        public bool $collection = false,
    ) {}
}
`);
            console.log('  ✔ Created app/Attributes/Response.php');
        }
    }
}

export function applyAnnotationsToFile(
    ctrlFile: string,
    annotations: readonly AnnotationResult[],
    dryRun: boolean
): number {
    const lines = fs.readFileSync(ctrlFile, 'utf-8').split('\n');
    const needsImport = !lines.some(l => l.includes('App\\Attributes\\Response'));

    // Sort descending by line so injections don't shift subsequent line numbers
    const sorted = [...annotations].sort((a, b) => b.methodLine - a.methodLine);
    let annotatedCount = 0;

    for (const ann of sorted) {
        const collectionStr = ann.collection ? ', collection: true' : '';
        const attrLine = `    #[Response(${ann.modelClass}::class${collectionStr})]`;

        // methodLine is 1-indexed; inject directly above the function declaration
        const insertAt = ann.methodLine - 1;
        lines.splice(insertAt, 0, attrLine);
        annotatedCount++;

        if (dryRun) {
            const collDisplay = ann.collection ? '[]' : '';
            console.log(`  [dry-run] ${ann.controllerClass}::${ann.methodName}`);
            console.log(`           → #[Response(${ann.modelClass}::class${collectionStr})]  (${ann.uri}${collDisplay})`);
        }
    }

    if (needsImport) {
        // Insert use statement after the last existing use line
        const lastUseIndex = lines.reduce((last, line, i) =>
            line.trimStart().startsWith('use ') ? i : last, -1);
        const insertUseAt = lastUseIndex !== -1 ? lastUseIndex + 1 : 2;
        lines.splice(insertUseAt, 0, 'use App\\Attributes\\Response;');
    }

    if (!dryRun) {
        fs.writeFileSync(ctrlFile, lines.join('\n'), 'utf-8');
    }

    return annotatedCount;
}
