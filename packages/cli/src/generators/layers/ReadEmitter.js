"use strict";
/**
 * layers/ReadEmitter.ts
 *
 * Emits: types/api-read.ts
 *
 * RESPONSIBILITY: Generate TypeScript interfaces untuk read responses (camelCase, frontend-friendly)
 *
 * Outputs:
 * - ${Model}Transformed interfaces (camelCase, readonly)
 * - ${Resource}Index, ${Resource}Show response types (composite)
 *
 * RECEIVES: routeResponseMap from ContractEmitter (DO NOT RE-COMPUTE!)
 *
 * CONSOLIDATES:
 * - ZodTierGenerator.generateRead() logic (lines 867-1078)
 * - Type transformation (previously duplicated mapSqlTypeToTs)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadEmitter = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const helpers_1 = require("./helpers");
class ReadEmitter {
    /**
     * Main entry point
     *
     * PENTING: Accept routeResponseMap dari ContractEmitter
     * DO NOT re-compute atau re-infer!
     */
    static async generate(typesDir, context, routeResponseMap) {
        const lines = [];
        const generatedTypes = new Set();
        // Phase 1: Generate transformed interfaces untuk models
        if (context.manifest.models) {
            for (const model of context.manifest.models) {
                try {
                    lines.push(this.generateTransformedType(model));
                    lines.push('');
                    generatedTypes.add(`${model.name}Transformed`);
                }
                catch (error) {
                    console.warn(`[ReadEmitter] Error generating model ${model.name}:`, error);
                }
            }
        }
        // Phase 2: Generate response types untuk routes
        const routes = context.manifest.routes || [];
        for (const route of routes) {
            if (!route.response)
                continue;
            try {
                const key = (0, helpers_1.routeResponseKey)(route);
                const composition = routeResponseMap.get(key);
                if (!composition) {
                    console.warn(`[ReadEmitter] No composition found for route ${route.name}`);
                    continue;
                }
                const groupName = (0, helpers_1.getResourceName)(route);
                const titleCase = (0, helpers_1.toTitleCase)(groupName);
                // Determine type name based on composition
                let typeName;
                if (composition.isCollection && composition.isPaginated) {
                    typeName = `${titleCase}Index`;
                }
                else if (composition.isCollection) {
                    typeName = `${titleCase}List`;
                }
                else {
                    typeName = `${titleCase}Show`;
                }
                if (!generatedTypes.has(typeName)) {
                    generatedTypes.add(typeName);
                    lines.push(this.generateResponseType(typeName, composition, groupName));
                    lines.push('');
                }
            }
            catch (error) {
                console.warn(`[ReadEmitter] Error processing route ${route.name}:`, error);
            }
        }
        // Write file
        const filePath = path_1.default.join(typesDir, 'api-read.ts');
        await fs_extra_1.default.ensureDir(typesDir);
        await fs_extra_1.default.writeFile(filePath, lines.join('\n'));
        return { lines };
    }
    /**
     * Generate Transformed interface untuk model
     *
     * Converts snake_case (DB) → camelCase (Frontend)
     *
     * Input:
     *   model Product { id, first_name, created_at }
     *
     * Output:
     *   export interface ProductTransformed {
     *     readonly id: number
     *     readonly firstName: string
     *     readonly createdAt: string
     *   }
     */
    static generateTransformedType(model) {
        const fields = [];
        if (!model.fields) {
            return `export interface ${model.name}Transformed {}`;
        }
        for (const [dbName, fieldDef] of Object.entries(model.fields)) {
            const field = fieldDef;
            const camelName = (0, helpers_1.toCamelCase)(dbName);
            const tsType = (0, helpers_1.mapSqlTypeToTs)(field.type, field.cast);
            const nullable = field.nullable ? ' | null' : '';
            fields.push(`  readonly ${camelName}: ${tsType}${nullable}`);
        }
        return `export interface ${model.name}Transformed {
${fields.join('\n')}
}`;
    }
    /**
     * Generate response type based on composition
     *
     * PENTING: Use composition metadata untuk determine structure
     * DO NOT re-infer!
     */
    static generateResponseType(typeName, composition, _groupName) {
        let typeExpr;
        // Build type expression based on composition flags
        if (composition.isCollection && composition.isPaginated) {
            // Paginated response: { data: T[], currentPage?, total? }
            typeExpr = `{
  readonly data: ${composition.tsType}[]
  readonly currentPage?: number
  readonly total?: number
  readonly perPage?: number
  readonly lastPage?: number
}`;
        }
        else if (composition.isCollection) {
            // Array response
            typeExpr = `${composition.tsType}[]`;
        }
        else if (composition.isWrapped) {
            // Wrapped response: { data: T }
            typeExpr = `{
  readonly data: ${composition.tsType}
}`;
        }
        else {
            // Plain object response
            typeExpr = composition.tsType;
        }
        return `export interface ${typeName} {
  ${typeExpr}
}`;
    }
}
exports.ReadEmitter = ReadEmitter;
