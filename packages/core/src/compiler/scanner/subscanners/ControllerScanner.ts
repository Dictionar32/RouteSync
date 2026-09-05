/**
 * ControllerScanner.ts
 *
 * Scans app/Http/Controllers/*.php for controller action returns, form requests, and inline validation.
 *
 * @module core/compiler/scanner/subscanners/ControllerScanner
 */

import path from "path";
import fs from "fs-extra";
import {
    ResponseDescriptor,
    ResourceResponseDescriptor,
    ModelResponseDescriptor,
    InlineResponseDescriptor,
    ResourceFieldDescriptor,
    RouteValidationRuleEntry
} from "../../../types/route";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { toPascalCase } from "../../../utils/resource-naming";
import {
    ControllerActionInfo,
    ScannedControllerActionDescriptor
} from "../descriptors/requestDescriptors";
import { ScannedRouteValidationRuleEntry } from "../descriptors/validationDescriptors";
import { ScannedResourceFieldDescriptor } from "../descriptors/resourceDescriptors";
import { ResourceScanner } from "./ResourceScanner";
import { collectPhpFiles } from "./scannerUtils";

export class ControllerScanner {
    public static async scan(projectRoot: string): Promise<Map<string, Map<string, ControllerActionInfo>>> {
        const controllerMap = new Map<string, Map<string, ControllerActionInfo>>();
        const controllerDir = path.join(projectRoot, 'app', 'Http', 'Controllers');
        const files = await collectPhpFiles(controllerDir);

        for (const fullPath of files) {
            const controllerName = path.basename(fullPath, '.php');
            const source = await fs.readFile(fullPath, 'utf-8');
            const tokens = LaravelSourceLexer.tokenize(source);
            const actionMap = new Map<string, ControllerActionInfo>();

            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i].value === 'function' && tokens[i + 1]?.type === 'IDENTIFIER') {
                    const actionName = tokens[i + 1].value;
                    const sourceLine = source.slice(0, tokens[i].startOffset).split('\n').length;
                    let formRequestName: string | undefined;

                    // Scan parameters for FormRequest type hint
                    let pIdx = i + 2;
                    while (pIdx < tokens.length && tokens[pIdx].value !== '{' && tokens[pIdx].value !== ';') {
                        if (tokens[pIdx].type === 'IDENTIFIER' && tokens[pIdx].value.endsWith('Request') && tokens[pIdx].value !== 'Request' && tokens[pIdx + 1]?.type === 'VARIABLE') {
                            formRequestName = tokens[pIdx].value;
                        }
                        pIdx++;
                    }

                    let k = pIdx;
                    let responseDesc: ResponseDescriptor | undefined;
                    let schemaRules: RouteValidationRuleEntry[] | undefined;

                    if (tokens[k]?.value === '{') {
                        let depth = 1;
                        k++;
                        while (k < tokens.length && depth > 0) {
                            if (tokens[k].value === '{') depth++;
                            else if (tokens[k].value === '}') depth--;

                            // Inline validation: $request->validate([ ... ])
                            if (tokens[k].value === 'validate' && tokens[k + 1]?.value === '(') {
                                const parsedVal = LaravelSourceLexer.parseArray(source, tokens, k + 1);
                                if (parsedVal.entries.length > 0) {
                                    schemaRules = parsedVal.entries.map(e => {
                                        const rawRule = e.value.kind === 'literal' && e.value.literalType === 'string' ? String(e.value.value) : e.rawExpression;
                                        const rulesList = rawRule.includes('|') ? rawRule.split('|').map(r => r.trim()).filter(Boolean) : [rawRule];
                                        return ScannedRouteValidationRuleEntry.create(e.key, rulesList);
                                    });
                                }
                                k = Math.max(k, parsedVal.endIndex - 1);
                            }

                            if (!responseDesc) {
                                if (tokens[k].value === 'return' && tokens[k + 1]?.type === 'IDENTIFIER' && tokens[k + 2]?.value === '::' && tokens[k + 3]?.value === 'collection') {
                                    const resName = tokens[k + 1].value;
                                    // Check if collection call contains paginate()
                                    let hasPaginate = false;
                                    let scanAhead = k + 4;
                                    while (scanAhead < tokens.length && tokens[scanAhead].value !== ';') {
                                        if (tokens[scanAhead].value === 'paginate' || tokens[scanAhead].value === 'simplePaginate') {
                                            hasPaginate = true;
                                            break;
                                        }
                                        scanAhead++;
                                    }
                                    responseDesc = new ResourceResponseDescriptor({
                                        resourceName: resName,
                                        shape: hasPaginate ? 'collection' : 'collection'
                                    });
                                } else if (tokens[k].value === 'return' && tokens[k + 1]?.value === 'new' && tokens[k + 2]?.type === 'IDENTIFIER') {
                                    const resName = tokens[k + 2].value;
                                    if (resName.endsWith('Resource') || resName.endsWith('Collection')) {
                                        responseDesc = new ResourceResponseDescriptor({
                                            resourceName: resName,
                                            shape: resName.endsWith('Collection') ? 'collection' : 'single'
                                        });
                                    }
                                } else if (tokens[k].value === 'return' && tokens[k + 1]?.type === 'IDENTIFIER' && tokens[k + 2]?.value === '::' && tokens[k + 3]?.value === 'make') {
                                    responseDesc = new ResourceResponseDescriptor({
                                        resourceName: tokens[k + 1].value,
                                        shape: 'single'
                                    });
                                } else if (tokens[k].value === 'return' && tokens[k + 1]?.type === 'IDENTIFIER' && tokens[k + 2]?.value === '::') {
                                    const modelOrClass = tokens[k + 1].value;
                                    const queryMethod = tokens[k + 3]?.value;
                                    if (queryMethod === 'all' || queryMethod === 'paginate' || queryMethod === 'get' || queryMethod === 'cursor') {
                                        responseDesc = new ModelResponseDescriptor({
                                            modelName: modelOrClass,
                                            shape: 'collection'
                                        });
                                    } else if (queryMethod === 'find' || queryMethod === 'findOrFail' || queryMethod === 'first' || queryMethod === 'firstOrFail' || queryMethod === 'create') {
                                        responseDesc = new ModelResponseDescriptor({
                                            modelName: modelOrClass,
                                            shape: 'single'
                                        });
                                    }
                                } else if (tokens[k].value === 'return' && tokens[k + 1]?.value === 'response' && tokens[k + 2]?.value === '(') {
                                    let jIdx = k + 3;
                                    while (jIdx < tokens.length && tokens[jIdx].value !== ';') {
                                        if (tokens[jIdx].value === 'json' && tokens[jIdx + 1]?.value === '(') {
                                            const parsedArray = LaravelSourceLexer.parseArray(source, tokens, jIdx + 1);
                                            if (parsedArray.entries.length > 0) {
                                                let cleanDomain = actionName || 'Inline';
                                                if (['index', 'show', 'store', 'update', 'destroy'].includes(actionName || '')) {
                                                    const baseCtrl = controllerName.replace(/Controller$/, '');
                                                    cleanDomain = baseCtrl === 'Category' ? 'Categories' : baseCtrl === 'ProductReview' ? 'ProdukReviews' : baseCtrl === 'Order' ? 'Orders' : baseCtrl;
                                                } else if (actionName) {
                                                    cleanDomain = actionName.charAt(0).toUpperCase() + actionName.slice(1);
                                                }
                                                const rawDomain = cleanDomain;
                                                const fields: ResourceFieldDescriptor[] = parsedArray.entries.map(e => {
                                                    const mapped = ResourceScanner.mapAstValueToExpression(e.value, e.rawExpression);
                                                    return ScannedResourceFieldDescriptor.fromExpression(
                                                        e.key,
                                                        mapped.expression,
                                                        mapped.nullable
                                                    );
                                                });
                                                responseDesc = new InlineResponseDescriptor({
                                                    domain: rawDomain,
                                                    baseName: toPascalCase(rawDomain),
                                                    typeName: `${toPascalCase(rawDomain)}Transformed`,
                                                    fields,
                                                    shape: 'single'
                                                });
                                            }
                                            break;
                                        }
                                        jIdx++;
                                    }
                                }
                            }

                            k++;
                        }
                    }

                    actionMap.set(actionName, ScannedControllerActionDescriptor.create({
                        response: responseDesc,
                        sourceFile: fullPath,
                        sourceLine,
                        formRequestName,
                        schemaRules
                    }));
                }
            }
            controllerMap.set(controllerName, actionMap);
        }

        return controllerMap;
    }
}
