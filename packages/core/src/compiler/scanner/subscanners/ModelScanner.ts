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
import type { SchemaInterface } from "../../../types/upstream/schema";
import type { ModelDefinition } from "../../../types/upstream/model";
import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";
import { createModelName } from "../../../types/upstream/names";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { parseModelDeclaration } from "../lexer";
import { parseModelPropertyAsts } from "./model/modelPropertyAstParser";
import { parseModelCasts } from "./model/memberCastsParser";
import { parseModelAccessors } from "./model/memberAccessorsParser";
import { parseModelRelations } from "./model/memberRelationsParser";
import { modelProducer, type ModelProducerResult } from "./modelProducer";
import { collectPhpFiles } from "./scannerUtils";
import { relationAsyncFold } from "../../../semantic/foundation/relationalSequence";
import { resolveModelColumns } from "./model";

// Explicit named re-exports (Rule 14: 0 wildcard re-exports)
export { resolveModelColumns };

/**
 * Pure functional scanning of all Eloquent model files in app/Models.
 */
/**
 * Active Consumer Orchestrator class for model and migration scanning.
 */
export interface ModelScanBundle {
    readonly asts: readonly ModelAst[];
    readonly definitions: readonly ModelDefinition[];
}

export async function scanModelBundle(
    sourceProject: SourceProjectIdentity,
    schema: SchemaInterface
): Promise<ModelScanBundle> {
    const sourceRoot = sourceProject.root.value.value;
    const modelDir = path.join(sourceRoot, "app", "Models");
    const files = await collectPhpFiles(modelDir);
    const results = await relationAsyncFold(files, [] as ModelProducerResult[], async (results, fullPath) => {
        const source = await readSourceText(fullPath);
        const modelName = path.basename(fullPath, ".php");
        const tokens = LaravelSourceLexer.tokenize(source);
        const propertyAsts = parseModelPropertyAsts(tokens);
        const declaration = parseModelDeclaration(tokens);
        const casts: ModelCast[] = [];
        const accessors: ModelAccessorFact[] = [];
        const sourceSpan = { kind: 'source_span' as const, file: { kind: 'source_file' as const, value: { kind: 'string_value' as const, value: fullPath } }, start: { kind: 'number_value' as const, value: 0 }, end: { kind: 'number_value' as const, value: source.length } };
        const eloquentRelations = parseModelRelations(declaration, createModelName(modelName), sourceSpan);
        parseModelCasts(propertyAsts, declaration, casts, sourceSpan);
        parseModelAccessors(declaration, accessors, sourceSpan);
        return [...results, modelProducer.produceResult({ sourceSpan, schema, propertyAsts, declaration, casts, accessors, eloquentRelations })];
    });
    return {
        asts: Object.freeze(relationProject(results, result => result.ast)),
        definitions: Object.freeze(relationProject(results, result => result.definition)),
    };
}

export async function scanModelAsts(
    sourceProject: SourceProjectIdentity,
    schema: SchemaInterface
): Promise<readonly ModelAst[]> {
    return (await scanModelBundle(sourceProject, schema)).asts;
}


export class ModelScanner {
    public static async scanCanonicalBundle(
        sourceProject: SourceProjectIdentity,
        schema: SchemaInterface
    ): Promise<ModelScanBundle> {
        return scanModelBundle(sourceProject, schema);
    }

    public static async scanAsts(
        sourceProject: SourceProjectIdentity,
        schema: SchemaInterface
    ): Promise<readonly ModelAst[]> {
        return (await ModelScanner.scanCanonicalBundle(sourceProject, schema)).asts;
    }

    /** Canonical source boundary: PHP model source enters the upstream ADT here. */
    public static async scanSource(
        sourceProject: SourceProjectIdentity,
        schema: SchemaInterface
    ): Promise<readonly ModelAst[]> {
        return scanModelAsts(sourceProject, schema);
    }

    public static async scan(
        sourceProject: SourceProjectIdentity,
        schema: SchemaInterface
    ): Promise<readonly ModelAst[]> {
        return scanModelAsts(sourceProject, schema);
    }

}

