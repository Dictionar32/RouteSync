/**
 * scannerUtils.ts
 *
 * Filesystem and parsing utilities for Laravel scanners.
 *
 * @module core/compiler/scanner/subscanners/scannerUtils
 */

import path from "path";
import * as fs from "node:fs";
import {
    relationAll,
    relationAsyncFold,
    relationGate,
    relationLookup,
    relationOptionFold,
    relationNone,
    relationSome,
} from '../../../semantic/foundation/relationalSequence';
import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../../semantic/foundation/relationMembership';

let sourceTextCache: RelationIndex<string, string> = Object.freeze([]);

const cachedSourceText = (file: string) =>
    relationOptionFold(
        relationIndexLookup(sourceTextCache, file),
        () => relationNone<string>(),
        ([, value]) => relationSome(value),
    );

const phpEntry = (dir: string, entry: fs.Dirent): string => path.join(dir, entry.name);

export async function collectPhpFiles(dir: string): Promise<readonly string[]> {
    return relationGate(
        fs.existsSync(dir),
        () => fs.promises.readdir(dir, { withFileTypes: true }).then(entries =>
            relationAsyncFold(
                entries,
                [] as readonly string[],
                async (results, entry) => relationGate(
                    entry.isDirectory(),
                    async () => Object.freeze([
                        ...results,
                        ...(await collectPhpFiles(phpEntry(dir, entry))),
                    ]),
                    async () => relationGate(
                        relationAll([entry.isFile(), entry.name.endsWith('.php')]),
                        async () => Object.freeze([...results, phpEntry(dir, entry)]),
                        async () => results,
                    ),
                ),
            ),
        ),
        () => Promise.resolve([] as readonly string[]),
    );
}

export async function readSourceText(file: string): Promise<string> {
    return relationOptionFold(
        cachedSourceText(file),
        async () => {
            const source = await fs.promises.readFile(file, 'utf-8');
            sourceTextCache = relationIndexAdd(sourceTextCache, file, source);
            return source;
        },
        value => Promise.resolve(value),
    );
}

export function readSourceTextSync(file: string): string {
    return relationOptionFold(
        cachedSourceText(file),
        () => {
            const source = fs.readFileSync(file, 'utf-8');
            sourceTextCache = relationIndexAdd(sourceTextCache, file, source);
            return source;
        },
        value => value,
    );
}
