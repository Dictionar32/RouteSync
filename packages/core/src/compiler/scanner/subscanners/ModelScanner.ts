/**
 * ModelScanner.ts
 *
 * Active Consumer Orchestrator for scanning Eloquent models and database migrations.
 * Coordinates model file discovery, tokenization, migration schema scanning, and member parsing.
 *
 * @module core/compiler/scanner/subscanners/ModelScanner
 */

import path from "path";
import fs from "fs-extra";
import type { ParsedModel, ParsedColumn } from "../../../types/route";
import { collectPhpFiles } from "./scannerUtils";
import {
    scanMigrations,
    parseMigrationTokens,
    parseModelMembers,
    type ParsedModelMembers,
    inferModelColumns,
    parseModelFile
} from "./model";

// Explicit named re-exports (Rule 14: 0 wildcard re-exports)
export type { ParsedModelMembers };
export {
    scanMigrations,
    parseMigrationTokens,
    parseModelMembers,
    inferModelColumns,
    parseModelFile
};

/**
 * Pure functional scanning of all Eloquent model files in app/Models.
 */
export async function scanModels(projectRoot: string): Promise<readonly ParsedModel[]> {
    const modelDir = path.join(projectRoot, 'app', 'Models');
    const files = await collectPhpFiles(modelDir);
    const migrationMap = await scanMigrations(projectRoot);
    const models: ParsedModel[] = [];

    for (const fullPath of files) {
        const modelName = path.basename(fullPath, '.php');
        const source = await fs.readFile(fullPath, 'utf-8');
        models.push(parseModelFile(source, modelName, migrationMap));
    }

    return models;
}

/**
 * Active Consumer Orchestrator class for model and migration scanning.
 */
export class ModelScanner {
    public static async scan(projectRoot: string): Promise<readonly ParsedModel[]> {
        return scanModels(projectRoot);
    }

    public static async scanMigrations(projectRoot: string): Promise<Map<string, ParsedColumn[]>> {
        return scanMigrations(projectRoot);
    }

    public static parseModelFile(
        source: string,
        modelName: string,
        migrationMap?: Map<string, ParsedColumn[]>
    ): ParsedModel {
        return parseModelFile(source, modelName, migrationMap);
    }
}
