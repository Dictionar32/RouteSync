/**
 * ResourceScanner.ts
 *
 * Scans app/Http/Resources/*.php for JsonResource definitions and AST expressions.
 *
 * @module core/compiler/scanner/subscanners/ResourceScanner
 */

import path from "path";
import fs from "fs-extra";
import {
    ParsedResource,
    ResourceFieldDescriptor,
    ResourceFieldExpression,
    ResourceFieldExpressionFactory
} from "../../../types/route";
import { LaravelSourceLexer, PhpAstValue } from "../LaravelSourceLexer";
import {
    ScannedResourceDescriptor,
    ScannedResourceFieldDescriptor
} from "../descriptors/resourceDescriptors";
import { collectPhpFiles } from "./scannerUtils";

import { ModelSymbolTable } from "../symbols/ModelSymbolTable";
import { SemanticResourceBinder } from "../binders/SemanticResourceBinder";

export class ResourceScanner {
    public static async scan(
        projectRoot: string,
        modelSymbolTable: ModelSymbolTable = new ModelSymbolTable([])
    ): Promise<readonly ParsedResource[]> {
        const resDir = path.join(projectRoot, 'app', 'Http', 'Resources');
        const files = await collectPhpFiles(resDir);
        const resources: ParsedResource[] = [];

        for (const fullPath of files) {
            const source = await fs.readFile(fullPath, 'utf-8');
            const tokens = LaravelSourceLexer.tokenize(source);

            const resourceName = path.basename(fullPath, '.php');
            let returnIndex = 0;
            const toArrayIdx = tokens.findIndex((t, idx) => t.value === 'toArray' && tokens[idx - 1]?.value === 'function');
            if (toArrayIdx !== -1) {
                const retIdx = tokens.findIndex((t, idx) => idx > toArrayIdx && t.value === 'return');
                if (retIdx !== -1) {
                    returnIndex = retIdx;
                }
            } else {
                const retIdx = tokens.findIndex(t => t.value === 'return');
                if (retIdx !== -1) {
                    returnIndex = retIdx;
                }
            }
            const parsedArray = LaravelSourceLexer.parseArray(source, tokens, returnIndex);

            const boundResource = SemanticResourceBinder.bindResource({
                resourceName,
                entries: parsedArray.entries,
                sourceFile: fullPath,
                modelSymbolTable
            });

            resources.push(boundResource);
        }

        return resources;
    }

    public static mapAstValueToExpression(value: PhpAstValue, raw: string): { expression: ResourceFieldExpression; nullable: boolean } {
        switch (value.kind) {
            case 'resource_collection':
                return { expression: ResourceFieldExpressionFactory.resource(value.resourceName, true), nullable: false };
            case 'resource_single':
                return { expression: ResourceFieldExpressionFactory.resource(value.resourceName, false), nullable: false };
            case 'nested_array': {
                const childFields: ResourceFieldDescriptor[] = value.entries.map(e => {
                    const mappedChild = this.mapAstValueToExpression(e.value, e.rawExpression);
                    return ScannedResourceFieldDescriptor.fromExpression(
                        e.key,
                        mappedChild.expression,
                        mappedChild.nullable
                    );
                });
                return { expression: ResourceFieldExpressionFactory.object(childFields), nullable: false };
            }
            case 'method_chain':
            case 'property_access': {
                const prop = value.property.toLowerCase();
                const isNumeric = prop.endsWith('_id') || prop === 'id' || prop.endsWith('_count') || prop.endsWith('_amount') || prop.endsWith('_minor') || prop === 'qty' || prop === 'harga' || prop === 'subtotal';
                const isBool = prop.startsWith('is_') || prop.startsWith('has_');
                let primitiveType = 'string';
                if (isNumeric) {
                    primitiveType = 'int';
                } else if (isBool) {
                    primitiveType = 'boolean';
                }
                return { expression: ResourceFieldExpressionFactory.primitive(primitiveType), nullable: value.nullsafe };
            }
            case 'literal': {
                let primitiveType = 'string';
                if (value.literalType === 'number') {
                    primitiveType = 'int';
                } else if (value.literalType === 'boolean') {
                    primitiveType = 'boolean';
                }
                return { expression: ResourceFieldExpressionFactory.primitive(primitiveType), nullable: value.literalType === 'null' };
            }
            case 'variable_reference': {
                const varName = value.name.toLowerCase();
                const isNumeric = varName.endsWith('_id') || varName === 'id' || varName.endsWith('_minor') || varName === 'qty' || varName === 'harga' || varName === 'subtotal';
                return { expression: ResourceFieldExpressionFactory.primitive(isNumeric ? 'int' : 'string'), nullable: false };
            }
            case 'ternary_expression':
                return { expression: ResourceFieldExpressionFactory.primitive('string'), nullable: true };
            default: {
                const cleanRaw = (raw || '').trim();
                if (cleanRaw.includes("['") || cleanRaw.includes('["') || cleanRaw.includes('$detail[') || cleanRaw.includes('$gateway[')) {
                    return { expression: ResourceFieldExpressionFactory.unknown(), nullable: true };
                }
                if (cleanRaw.startsWith('(int)') || cleanRaw.startsWith('(float)') || /\b(int|float)\b/.test(cleanRaw) || /[+\-*\/]/.test(cleanRaw)) {
                    return { expression: ResourceFieldExpressionFactory.primitive('int'), nullable: cleanRaw.includes('null') };
                }
                if (cleanRaw.startsWith('(bool)')) {
                    return { expression: ResourceFieldExpressionFactory.primitive('boolean'), nullable: false };
                }
                return { expression: ResourceFieldExpressionFactory.primitive('string'), nullable: false };
            }
        }
    }
}
