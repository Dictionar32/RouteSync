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
import type { ModelAst } from "../../../types/upstream/ast";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { modelAstFromParsed } from "./model/modelCanonical";
import { collectPhpFiles } from "./scannerUtils";
import {
    scanMigrations,
    parseMigrationTokens,
    parseModelMembers,
    type ParsedModelMembers,
    resolveModelColumns,
    parseModelFile
} from "./model";

// Explicit named re-exports (Rule 14: 0 wildcard re-exports)
export type { ParsedModelMembers };
export {
    scanMigrations,
    parseMigrationTokens,
    parseModelMembers,
    resolveModelColumns,
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
        models.push(parseModelFile(source, modelName, migrationMap, fullPath));
    }

    return models;
}

/**
 * Active Consumer Orchestrator class for model and migration scanning.
 */
export async function scanModelAsts(projectRoot: string): Promise<readonly ModelAst[]> {
    const modelDir = path.join(projectRoot, "app", "Models");
    const files = await collectPhpFiles(modelDir);
    const migrationMap = await scanMigrations(projectRoot);
    const asts: ModelAst[] = [];
    for (const fullPath of files) {
        const source = await fs.readFile(fullPath, "utf-8");
        const modelName = path.basename(fullPath, ".php");
        const tokens = LaravelSourceLexer.tokenize(source);
        asts.push(modelAstFromParsed(parseModelFile(source, modelName, migrationMap, fullPath), fullPath, source.length, tokens));
    }
    return asts;
}

export class ModelScanner {
    public static async scanAsts(projectRoot: string): Promise<readonly ModelAst[]> {
        return scanModelAsts(projectRoot);
    }

    /** Canonical source boundary: PHP model source enters the upstream ADT here. */
    public static async scanSource(projectRoot: string): Promise<readonly ModelAst[]> {
        return scanModelAsts(projectRoot);
    }

    public static async scan(projectRoot: string): Promise<readonly ParsedModel[]> {
        return scanModels(projectRoot);
    }

    public static async scanMigrations(projectRoot: string): Promise<Map<string, ParsedColumn[]>> {
        return scanMigrations(projectRoot);
    }

    public static parseModelFile(
        source: string,
        modelName: string,
        migrationMap: ReadonlyMap<string, readonly ParsedColumn[]>,
        file: string = modelName
    ): ParsedModel {
        return parseModelFile(source, modelName, migrationMap, file);
    }
}

