/**
 * scannerUtils.ts
 *
 * Filesystem and parsing utilities for Laravel scanners.
 *
 * @module core/compiler/scanner/subscanners/scannerUtils
 */

import path from "path";
import fs from "fs-extra";

export async function collectPhpFiles(dir: string): Promise<string[]> {
    if (!fs.existsSync(dir)) return [];
    let results: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
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
