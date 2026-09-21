/**
 * scannerUtils.ts
 *
 * Filesystem and parsing utilities for Laravel scanners.
 *
 * @module core/compiler/scanner/subscanners/scannerUtils
 */

import path from "path";
import * as fs from "node:fs";

const sourceTextCache = new Map<string, string>();

export async function collectPhpFiles(dir: string): Promise<string[]> {
    if (!fs.existsSync(dir)) return [];
    let results: string[] = [];
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(await collectPhpFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith(".php")) {
            results.push(fullPath);
        }
    }
    return results;
}


export async function readSourceText(file: string): Promise<string> {
    const cached = sourceTextCache.get(file);
    if (cached !== undefined) return cached;
    const source = await fs.promises.readFile(file, 'utf-8');
    sourceTextCache.set(file, source);
    return source;
}

export function readSourceTextSync(file: string): string {
    const cached = sourceTextCache.get(file);
    if (cached !== undefined) return cached;
    const source = fs.readFileSync(file, 'utf-8');
    sourceTextCache.set(file, source);
    return source;
}
