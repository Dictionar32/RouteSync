import { readSourceText } from './scannerUtils';
/**
 * ModelScanner.ts
 *
 * Active Consumer Orchestrator for scanning Eloquent models and database migrations.
 * Coordinates model file discovery, tokenization, migration schema scanning, and member parsing.
 *
 * @module core/compiler/scanner/subscanners/ModelScanner
 */

import path from "path";
import type { ModelCast } from "../../../types/upstream/model";
import type { ModelAccessorFact } from "../../../types/upstream/modelSourceFacts";
import type { EloquentRelationAst } from "../../../types/upstream/eloquent";
import type { ModelAst } from "../../../types/upstream/ast";
import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";
import { createModelName } from "../../../types/upstream/names";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { parseModelDeclaration } from "../lexer";
import { parseModelPropertyAsts } from "./model/modelPropertyAstParser";
import { parseModelCasts } from "./model/memberCastsParser";
import { parseModelAccessors } from "./model/memberAccessorsParser";
import { parseModelRelations } from "./model/memberRelationsParser";
import { modelProducer } from "./modelProducer";
import { collectPhpFiles } from "./scannerUtils";
import {
    scanMigrations,
    resolveModelColumns
} from "./model";

// Explicit named re-exports (Rule 14: 0 wildcard re-exports)
export {
    scanMigrations,
    resolveModelColumns
};

/**
 * Pure functional scanning of all Eloquent model files in app/Models.
 */
/**
 * Active Consumer Orchestrator class for model and migration scanning.
 */
export async function scanModelAsts(
    sourceProject: SourceProjectIdentity,
    migrations: readonly import("../../../types/upstream/ast").MigrationAst[]
): Promise<readonly ModelAst[]> {
    const sourceRoot = sourceProject.root.value.value;
    const modelDir = path.join(sourceRoot, "app", "Models");
    const files = await collectPhpFiles(modelDir);
    const asts: ModelAst[] = [];
    for (const fullPath of files) {
        const source = await readSourceText(fullPath);
        const modelName = path.basename(fullPath, ".php");
        const tokens = LaravelSourceLexer.tokenize(source);
        const propertyAsts = parseModelPropertyAsts(tokens);
        const declaration = parseModelDeclaration(tokens);
        const casts: ModelCast[] = [];
        const accessors: ModelAccessorFact[] = [];
        const eloquentRelations: EloquentRelationAst[] = [];
        const sourceSpan = { kind: 'source_span' as const, file: { kind: 'source_file' as const, value: { kind: 'string_value' as const, value: fullPath } }, start: { kind: 'number_value' as const, value: 0 }, end: { kind: 'number_value' as const, value: source.length } };
        parseModelCasts(propertyAsts, declaration, casts, sourceSpan);
        parseModelAccessors(declaration, accessors, sourceSpan);
        eloquentRelations.push(...parseModelRelations(declaration, createModelName(modelName), sourceSpan));
        asts.push(modelProducer.produce({
            sourceSpan,
            migrations,
            propertyAsts,
            declaration,
            casts,
            accessors,
            eloquentRelations,
        }));
    }
    return asts;
}


export class ModelScanner {
    public static async scanAsts(
        sourceProject: SourceProjectIdentity,
        migrations: readonly import("../../../types/upstream/ast").MigrationAst[]
    ): Promise<readonly ModelAst[]> {
        return scanModelAsts(sourceProject, migrations);
    }

    /** Canonical source boundary: PHP model source enters the upstream ADT here. */
    public static async scanSource(
        sourceProject: SourceProjectIdentity,
        migrations: readonly import("../../../types/upstream/ast").MigrationAst[]
    ): Promise<readonly ModelAst[]> {
        return scanModelAsts(sourceProject, migrations);
    }

    public static async scan(
        sourceProject: SourceProjectIdentity,
        migrations: readonly import("../../../types/upstream/ast").MigrationAst[]
    ): Promise<readonly ModelAst[]> {
        return scanModelAsts(sourceProject, migrations);
    }

    public static async scanMigrations(
        sourceProject: SourceProjectIdentity
    ): Promise<readonly import("../../../types/upstream/ast").MigrationAst[]> {
        return scanMigrations(sourceProject);
    }


}

