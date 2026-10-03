import { type RelationMembership, type RelationIndex, relationIndexAdd } from '../../../semantic/kernel/relationMembership';
import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";

import { createControllerName, createSourceFile } from '../../../types/upstream/names';
import { readSourceText } from './scannerUtils';
/**
 * ControllerScanner.ts
 *
 * Scans app/Http/Controllers/*.php for controller action returns, form requests, and inline validation.
 *
 * @module core/compiler/scanner/subscanners/ControllerScanner
 */

import path from "path";
import * as fs from "node:fs";
import type { FormRequestSource } from "../../../types/domain/request";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import type { ControllerActionInfo } from "../descriptors/requestDescriptors";
import type { ControllerAst } from "../../../types/upstream/ast";
import type { ControllerResponse } from "../../../types/upstream/controller";
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { collectPhpFiles } from "./scannerUtils";
import { scanControllerAction } from "./controller";
import type { ModelSymbolTable } from "../symbols/ModelSymbolTable";
import { extractResourceDataflow } from "./controller/resourceDataflowAggregator";
import { controllerProducer } from "./controller/controllerProducer";
import { relationAsyncFold, relationFold, relationFirst, relationOptionFold, relationSelect, relationGate } from "../../../semantic/kernel/relationalSequence";
import { relationEqual, relationNotEqual } from "../../../semantic/kernel/semanticRelations";

export class ControllerScanner {
    private static async scanOnce(
        sourceProject: SourceProjectIdentity,
        formRequestIndex: RelationIndex<string, FormRequestSource>,
        modelNames: RelationMembership<string> = Object.freeze([] as string[]),
        customContextualAttributeNames: RelationMembership<string> = Object.freeze([] as string[])
    ): Promise<{ readonly asts: readonly ControllerAst[]; readonly controllerIndex: RelationIndex<string, RelationIndex<string, ControllerActionInfo>> }> {
        const initial = { asts: [] as ControllerAst[], controllerIndex: [] as RelationIndex<string, RelationIndex<string, ControllerActionInfo>> };
        const result = await relationAsyncFold(files, initial, async (state, fullPath) => {
            const controllerName = path.basename(fullPath, '.php');
            const source = await readSourceText(fullPath);
            const tokens = LaravelSourceLexer.tokenize(source);
            const declaration = LaravelSourceLexer.parseControllerDeclaration(
                source,
                tokens,
                createAstIdentifier(controllerName),
                fullPath
            );
            let actionIndex: RelationIndex<string, ControllerActionInfo> = [];
            const constructor = relationFirst(declaration.methods, method => relationEqual(method.name, '__construct'));
            const actionMethods = relationSelect(declaration.methods, method => relationNotEqual(method.name, '__construct'));
            const constructorParameters = relationOptionFold(constructor, () => [], method => method.parameters);
            const controllerMethods = relationFold(actionMethods, [] as { readonly method: typeof declaration.methods[number]; readonly response: ControllerResponse; readonly dependencies: readonly import('../../../types/upstream/controller').ControllerDependency[] }[], method => {
                const result = scanControllerAction(
                    method,
                    createControllerName(controllerName),
                    createSourceFile(fullPath),
                    formRequestIndex,
                    sourceProject,
                    modelNames,
                    constructorParameters,
                    customContextualAttributeNames
                );
                const response = {
                    kind: 'response_present' as const,
                    response: {
                        kind: 'response_reference' as const,
                        name: result.descriptor.response.responseTypeName()
                    }
                };
                actionIndex = relationIndexAdd(actionIndex, result.actionName.value.value, result.descriptor);
                return [...controllerMethods, { method, response, dependencies: result.dependencies }];
            });
            const nextAsts = relationOptionFold(
                relationGate(relationNotEqual(controllerMethods.length, 0), () => ({ kind: 'some' as const, value: controllerMethods }), () => ({ kind: 'none' as const })),
                () => state.asts,
                methods => [...state.asts, controllerProducer.produce({
                    methods,
                    controller: createControllerName(controllerName),
                    file: createSourceFile(fullPath),
                    source: {
                        kind: 'source_span',
                        file: createSourceFile(fullPath),
                        start: { kind: 'number_value', value: declaration.source.startOffset },
                        end: { kind: 'number_value', value: declaration.source.endOffset },
                    },
                })],
            );
            const controllerIndex = relationIndexAdd(state.controllerIndex, controllerName, actionIndex);
            return { asts: nextAsts, controllerIndex };
        });
        return { asts: Object.freeze(result.asts), controllerIndex: result.controllerIndex };
    }

    public static async scan(
        sourceProject: SourceProjectIdentity,
        formRequestIndex: RelationIndex<string, FormRequestSource> = [],
        modelNames: RelationMembership<string> = Object.freeze([] as string[]),
        customContextualAttributeNames: RelationMembership<string> = Object.freeze([] as string[])
    ): Promise<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>> {
        return (await ControllerScanner.scanOnce(sourceProject, formRequestIndex, modelNames, customContextualAttributeNames)).controllerIndex;
    }

    public static async scanCanonicalAsts(
        sourceProject: SourceProjectIdentity,
        formRequestIndex: RelationIndex<string, FormRequestSource> = [],
        modelNames: RelationMembership<string> = Object.freeze([] as string[]),
        customContextualAttributeNames: RelationMembership<string> = Object.freeze([] as string[])
    ): Promise<readonly ControllerAst[]> {
        const result = await ControllerScanner.scanOnce(sourceProject, formRequestIndex, modelNames, customContextualAttributeNames);
        return result.asts;
    }

    public static async scanCanonicalBundle(
        sourceProject: SourceProjectIdentity,
        formRequestIndex: RelationIndex<string, FormRequestSource> = [],
        modelNames: RelationMembership<string> = Object.freeze([] as string[]),
        customContextualAttributeNames: RelationMembership<string> = Object.freeze([] as string[])
    ): Promise<{ readonly asts: readonly ControllerAst[]; readonly controllerIndex: RelationIndex<string, RelationIndex<string, ControllerActionInfo>> }> {
        return ControllerScanner.scanOnce(sourceProject, formRequestIndex, modelNames, customContextualAttributeNames);
    }

    public static extractResourceDataflow(
        controllerIndex: RelationIndex<string, RelationIndex<string, ControllerActionInfo>>,
    ): import("./controller/resourceDataflowAggregator").ControllerResourceDataflow {
        return extractResourceDataflow(controllerIndex);
    }
}
