import { sourceFileAcquisition } from './sourceFiles';
/**
 * Canonical Laravel Eloquent model scanner operation.
 * The upstream interface is the public boundary; this module owns its implementation.
 * @module core/compiler/scanner/laravelModelScanner
 */

import path from "path";
import type { ModelCast } from "../../types/upstream/model";
import type { ModelAccessorFact } from "../../types/upstream/modelSourceFacts";
import type { SchemaInterface } from "../../types/upstream/schema";
import type { TokenDescriptor } from "../frontend/php/phpAstTypes";
import type { ModelDeclarationAst } from "../frontend/php/modelAstTypes";
import type { PhpClassPropertyAst } from "../frontend/php/phpAstDeclarationTypes";
import type { SourceProjectIdentity } from "../../types/upstream/highLevelSourceModel";
import { createClassName, createModelName } from "../../types/upstream/names";
import { phpQualifiedClassNameFactory } from "../../types/upstream/phpClassNameResolutionInterface";
import type { ControllerStaticCallModelClassIdentity } from "../../types/upstream/controllerStaticCallOriginInterface";
import type { LaravelModelScanArtifact, LaravelModelScannerInterface } from "../../types/upstream/laravelModelScannerInterface";
import { LaravelSourceLexer } from "./LaravelSourceLexer";
import { parseModelDeclaration } from "../frontend/php";
import { sourceAstSyntaxParser } from "../frontend/php/sourceAstSyntaxParser";
import { modelCastFactsAuthority } from "../../types/upstream/modelCastFactsAuthority";
import { modelCastEvidenceProducer } from "./modelCastEvidenceProducer";
import { modelAccessorEvidenceProducer } from "./modelAccessorEvidenceProducer";
import { modelAccessorFactsAuthority } from "../../types/upstream/modelAccessorFactsAuthority";
import { modelRelationFactsProducer } from "./modelRelationFactsProducer";
import type { ModelProducerInput, ModelProducerInterface, ModelProducerResult } from "../../types/upstream/modelProducerInterface";
import { modelSemanticDefinitionFromAst } from "./operations/model/modelParser";
import { modelAstFromSemantic } from "./operations/model/modelCanonical";

/** Scans Eloquent model source and returns paired AST, definition, and class identity artifacts. */
interface ModelScanBundle {
    readonly artifacts: readonly LaravelModelScanArtifact[];
}

interface ModelScanEntry {
    readonly result: ModelProducerResult;
    readonly classIdentity: ControllerStaticCallModelClassIdentity;
}

/** Composite model-production operation consumed by the scanner pipeline. */
export const modelProducer: ModelProducerInterface<ModelDeclarationAst, PhpClassPropertyAst> = Object.freeze({
    kind: "laravel_model_producer",
    contractVersion: 1,
    produceResult: (input: ModelProducerInput<ModelDeclarationAst, PhpClassPropertyAst>): ModelProducerResult => {
        const semantic = modelSemanticDefinitionFromAst.form(
            input.sourceSpan,
            input.schema,
            input.propertyAsts,
            input.declaration,
            input.casts,
            input.accessors,
            input.eloquentRelations,
        );
        const ast = modelAstFromSemantic.project(semantic, input.casts, input.accessors, input.sourceSpan);
        return Object.freeze({ definition: ast.definition, ast });
    },
});

const declaredNamespaceName = (tokens: readonly TokenDescriptor[]): string => {
    const classIndex = tokens.findIndex(token => token.type === "IDENTIFIER" && token.value === "class");
    const declarationPrefix = tokens.slice(0, classIndex < 0 ? tokens.length : classIndex);
    const namespaceIndex = declarationPrefix.findIndex(token => token.type === "IDENTIFIER" && token.value.toLowerCase() === "namespace");
    if (namespaceIndex < 0) return "";
    const terminator = declarationPrefix.findIndex((token, index) => index > namespaceIndex && (token.value === ";" || token.value === "{"));
    return terminator < 0 ? "" : declarationPrefix.slice(namespaceIndex + 1, terminator).map(token => token.value).join("").replace(/^\\+|\\+$/g, "");
};

async function scanModelBundle(
    sourceProject: SourceProjectIdentity,
    schema: SchemaInterface
): Promise<ModelScanBundle> {
    const sourceRoot = sourceProject.root.value.value;
    const modelDir = path.join(sourceRoot, "app", "Models");
    const files = await sourceFileAcquisition.collectPhpFiles(modelDir);
    const results: readonly ModelScanEntry[] = await Promise.all(files.map(async fullPath => {
        const source = await sourceFileAcquisition.readSourceText(fullPath);
        const modelName = path.basename(fullPath, ".php");
        const tokens = LaravelSourceLexer.tokenize(source);
        const propertyAsts = sourceAstSyntaxParser.parseProperties(source);
        const declaration = parseModelDeclaration(tokens);
        const sourceSpan = { kind: 'source_span' as const, file: { kind: 'source_file' as const, value: { kind: 'string_value' as const, value: fullPath } }, start: { kind: 'number_value' as const, value: 0 }, end: { kind: 'number_value' as const, value: source.length } };
        const castEvidence = modelCastEvidenceProducer.produce({ propertyAsts, declaration, source: sourceSpan });
        const casts: readonly ModelCast[] = modelCastFactsAuthority.judge({ evidence: castEvidence });
        const accessorEvidence = modelAccessorEvidenceProducer.produce({ declaration, source: sourceSpan });
        const accessors: readonly ModelAccessorFact[] = modelAccessorFactsAuthority.judge({ evidence: accessorEvidence });
        const eloquentRelations = modelRelationFactsProducer.scan({ declaration, sourceModel: createModelName(modelName), source: sourceSpan });
        const result = modelProducer.produceResult({ sourceSpan, schema, propertyAsts, declaration, casts, accessors, eloquentRelations });
        const namespaceName = declaredNamespaceName(tokens);
        const classIdentity: ControllerStaticCallModelClassIdentity = Object.freeze({
            kind: "controller_static_call_model_class_identity",
            className: createClassName(declaration.name),
            modelName: result.definition.identity.name,
            qualifiedName: phpQualifiedClassNameFactory.create([namespaceName, declaration.name].filter(Boolean).join("\\")),
        });
        return Object.freeze({ result, classIdentity });
    }));
    const artifacts: readonly LaravelModelScanArtifact[] = Object.freeze(results.map(entry => Object.freeze({
        kind: 'laravel_model_scan_artifact',
        ast: entry.result.ast,
        definition: entry.result.definition,
        classIdentity: entry.classIdentity,
    } satisfies LaravelModelScanArtifact)));
    return Object.freeze({ artifacts });
}


/** Interface-first scanner operation consumed directly by the canonical pipeline composition. */
export const laravelModelScanner: LaravelModelScannerInterface = Object.freeze({
    kind: 'laravel_model_scanner',
    closed: true,
    contractVersion: 3,
    scan: async input => {
        const bundle = await scanModelBundle(input.sourceProject, input.schema);
        return Object.freeze({
            kind: 'laravel_model_scan_judgment',
            contractVersion: 3,
            models: bundle.artifacts,
        });
    },
});
