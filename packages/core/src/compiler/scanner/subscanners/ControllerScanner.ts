import { type RelationMembership, type RelationIndex, relationIndexAdd } from '../../../semantic/foundation/relationMembership';
import { relationAsyncFold, relationFold, relationFirst, relationOptionFold, relationSelect, relationGate, relationProject, relationAny, relationEqual, relationAll, relationNotEqual } from '../../../semantic/foundation/relationalSequence';
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
import type { ControllerActionFlowContract } from "../../../types/upstream/highLevelContracts";
import type { ControllerMethodAttribute, ControllerMethodContract } from "../../../types/upstream/controller";
import type { ControllerDeclarationEvidence, ControllerMethodEvidence } from "../../../types/upstream/controllerEvidence";
import { controllerActionFromMethod, controllerMethodContractFromMethod, controllerMethodAttributesFromAttributes } from './controller/controllerAstCanonical';
import type { QueryAst } from "../../../types/upstream/query";
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { collectPhpFiles } from "./scannerUtils";
import { scanControllerAction } from "./controller";
import type { ModelSymbolTable } from "../symbols/ModelSymbolTable";
import { extractResourceDataflow } from "./controller/resourceDataflowAggregator";
import { controllerProducer } from "./controller/controllerProducer";

export class ControllerScanner {
    private static async scanOnce(
        sourceProject: SourceProjectIdentity,
        formRequestIndex: RelationIndex<string, FormRequestSource>,
        customContextualAttributeNames: RelationMembership<string> = Object.freeze([] as string[]),
        queries: readonly QueryAst[] = []
    ): Promise<{ readonly asts: readonly ControllerAst[]; readonly actions: readonly ControllerActionFlowContract[]; readonly controllerIndex: RelationIndex<string, RelationIndex<string, ControllerActionInfo>> }> {
        const sourceRoot = sourceProject.root.value.value;
        const controllerDirectory = path.join(sourceRoot, 'app', 'Http', 'Controllers');
        const files = await collectPhpFiles(controllerDirectory);
        const parsed = await Promise.all(files.map(async (fullPath) => {
            const controllerName = path.basename(fullPath, '.php');
            const source = await readSourceText(fullPath);
            const tokens = LaravelSourceLexer.tokenize(source);
            const declaration = LaravelSourceLexer.parseControllerDeclaration(source, tokens, createAstIdentifier(controllerName), fullPath);
            return Object.freeze({ fullPath, controllerName, source, declaration });
        }));
        const declarations = Object.freeze(parsed);
        const declarationByName = new Map(declarations.map(item => [item.controllerName, item.declaration] as const));
        const declarationBynameSafe = (name: string) => declarationByName.get(name);
        const inheritedAttributes = (controllerName: string): readonly import('../lexer/controllerAstTypes').ControllerParameterAttributeAst[] => {
            const visit = (name: string, seen: ReadonlySet<string>): readonly import('../lexer/controllerAstTypes').ControllerParameterAttributeAst[] => {
                if (seen.has(name)) return Object.freeze([]);
                const declaration = declarationByName.get(name);
                if (!declaration || declaration.inheritance.kind === 'none') return Object.freeze([]);
                const parentName = declaration.inheritance.name;
                const parent = declarationBynameSafe(parentName);
                const own = parent ? relationSelect(parent.attributes, attribute => relationEqual(attribute.name, 'WithoutMiddleware')) : [];
                return Object.freeze([...visit(parentName, new Set([...seen, name])), ...own]);
            };
            return visit(controllerName, new Set<string>());
        };
        const initial = { asts: [] as ControllerAst[], actions: [] as ControllerActionFlowContract[], controllerIndex: [] as RelationIndex<string, RelationIndex<string, ControllerActionInfo>> };
        const result = await relationAsyncFold(declarations, initial, async (state, item) => {
            const { fullPath, controllerName, declaration } = item;
            const constructor = relationFirst(declaration.methods, method => relationEqual(method.name, '__construct'));
            const hasMiddlewareInterface = relationAny(relationProject(declaration.interfaces, item => relationEqual(item, 'HasMiddleware')));
            const actionMethods = relationSelect(declaration.methods, method => relationAll([relationNotEqual(method.name, '__construct'), relationGate(relationAll([relationEqual(method.name, 'middleware'), relationEqual(method.storage, 'static'), hasMiddlewareInterface]), () => false, () => true)]));
            const constructorParameters = relationOptionFold(constructor, () => [], method => method.parameters);
            const controllerScan = relationFold(actionMethods, {
                methods: [] as readonly { readonly method: typeof declaration.methods[number]; readonly response: ControllerResponse; readonly dependencies: readonly import('../../../types/upstream/controller').ControllerDependency[] }[],
                index: [] as RelationIndex<string, ControllerActionInfo>,
            }, (state, method) => {
                const result = scanControllerAction(method, createControllerName(controllerName), createSourceFile(fullPath), formRequestIndex, sourceProject, constructorParameters, customContextualAttributeNames);
                const response = { kind: 'response_present' as const, response: { kind: 'response_reference' as const, name: result.descriptor.response.responseTypeName() } };
                return { methods: [...state.methods, { method, response, dependencies: result.dependencies }], index: relationIndexAdd(state.index, result.actionName.value.value, result.descriptor) };
            });
            const controllerMethods = controllerScan.methods;
            const actionIndex = controllerScan.index;
            const sourceSpan = { kind: 'source_span' as const, file: createSourceFile(fullPath), start: { kind: 'number_value' as const, value: declaration.source.startOffset }, end: { kind: 'number_value' as const, value: declaration.source.endOffset } };
            const inheritedAttributeAst = inheritedAttributes(controllerName);
            const declarationAttributeEvidence = controllerMethodAttributesFromAttributes(declaration.attributes, [], fullPath);
            const inheritedAttributeEvidence = controllerMethodAttributesFromAttributes(inheritedAttributeAst, [], fullPath);
            const inheritedControllerNames = (() => {
                const names: string[] = [];
                const visit = (name: string, seen: ReadonlySet<string>): void => {
                    if (seen.has(name)) return;
                    const current = declarationByName.get(name);
                    if (!current || current.inheritance.kind !== 'class') return;
                    names.push(current.inheritance.name.value);
                    visit(current.inheritance.name.value, new Set([...seen, name]));
                };
                visit(controllerName, new Set());
                return Object.freeze(names.map(name => createControllerName(name)));
            })();
            const methodEvidence: readonly ControllerMethodEvidence[] = relationProject(controllerMethods, ({ method, response, dependencies }) => {
                const contract = controllerMethodContractFromMethod(method, controllerName, fullPath, response, dependencies ?? [], declaration.attributes, queries, declaration.interfaces, declaration.methods, inheritedAttributeAst);
                return {
                kind: 'controller_method_evidence' as const,
                controller: createControllerName(controllerName),
                action: controllerActionFromMethod(method, controllerName, fullPath, response, dependencies ?? [], contract.policy, inheritedControllerNames, queries),
                contract,
                source: { kind: 'source_span' as const, file: createSourceFile(fullPath), start: { kind: 'number_value' as const, value: method.source.startOffset }, end: { kind: 'number_value' as const, value: method.source.endOffset } },
            };
            });
            const declarationEvidence: ControllerDeclarationEvidence = {
                kind: 'controller_declaration_evidence',
                controller: createControllerName(controllerName),
                attributes: declarationAttributeEvidence,
                inheritedAttributes: inheritedAttributeEvidence,
                inheritance: declaration.inheritance.kind === 'class' ? {
                    kind: 'controller_inheritance_relation' as const,
                    child: createControllerName(controllerName),
                    parent: { kind: 'controller_name' as const, value: { kind: 'string_value' as const, value: declaration.inheritance.name.value } },
                    source: { kind: 'source_span' as const, file: createSourceFile(fullPath), start: { kind: 'number_value' as const, value: declaration.inheritance.source.startOffset }, end: { kind: 'number_value' as const, value: declaration.inheritance.source.endOffset }, },
                } : null,
                interfaces: relationProject(declaration.interfaces, name => ({ kind: 'class_name' as const, value: { kind: 'string_value' as const, value: name } })),
                methods: methodEvidence,
                source: sourceSpan,
            };
            const produced = relationOptionFold(relationGate(relationNotEqual(controllerMethods.length, 0), () => ({ kind: 'some' as const, value: controllerProducer.produce({
                declaration: declarationEvidence, file: createSourceFile(fullPath), source: sourceSpan,
            }) }), () => ({ kind: 'none' as const })), () => ({ kind: 'none' as const }), value => ({ kind: 'some' as const, value }));
            const controllerIndex = relationIndexAdd(state.controllerIndex, controllerName, actionIndex);
            return relationOptionFold(produced, () => ({ ...state, controllerIndex }), value => ({ asts: [...state.asts, value.ast], actions: [...state.actions, ...value.actions], controllerIndex }));
        });
        return { asts: Object.freeze(result.asts), actions: Object.freeze(result.actions), controllerIndex: result.controllerIndex };
    }

    public static async scan(
        sourceProject: SourceProjectIdentity,
        formRequestIndex: RelationIndex<string, FormRequestSource> = [],
        customContextualAttributeNames: RelationMembership<string> = Object.freeze([] as string[]),
        queries: readonly QueryAst[] = []
    ): Promise<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>> {
        return (await ControllerScanner.scanOnce(sourceProject, formRequestIndex, customContextualAttributeNames, queries)).controllerIndex;
    }

    public static async scanCanonicalAsts(
        sourceProject: SourceProjectIdentity,
        formRequestIndex: RelationIndex<string, FormRequestSource> = [],
        customContextualAttributeNames: RelationMembership<string> = Object.freeze([] as string[]),
        queries: readonly QueryAst[] = []
    ): Promise<readonly ControllerAst[]> {
        const result = await ControllerScanner.scanOnce(sourceProject, formRequestIndex, customContextualAttributeNames, queries);
        return result.asts;
    }

    public static async scanCanonicalBundle(
        sourceProject: SourceProjectIdentity,
        formRequestIndex: RelationIndex<string, FormRequestSource> = [],
        customContextualAttributeNames: RelationMembership<string> = Object.freeze([] as string[]),
        queries: readonly QueryAst[] = []
    ): Promise<{ readonly asts: readonly ControllerAst[]; readonly actions: readonly ControllerActionFlowContract[]; readonly controllerIndex: RelationIndex<string, RelationIndex<string, ControllerActionInfo>> }> {
        return ControllerScanner.scanOnce(sourceProject, formRequestIndex, customContextualAttributeNames, queries);
    }

    public static extractResourceDataflow(
        controllerIndex: RelationIndex<string, RelationIndex<string, ControllerActionInfo>>,
    ): import("./controller/resourceDataflowAggregator").ControllerResourceDataflow {
        return extractResourceDataflow(controllerIndex);
    }
}
