"use strict";
/**
 * layers/MapperEmitter.ts
 *
 * Emits: mappers/api-mapper.ts
 *
 * RESPONSIBILITY: Generate transform functions between API (snake_case) and Frontend (camelCase)
 *
 * Outputs:
 * - to${Model}Read: snake_case API response → camelCase frontend model
 * - to${Model}ReadList: transform array
 * - toApi${Action}: form data → API payload (for mutations)
 *
 * RECEIVES: routeResponseMap from ContractEmitter (DO NOT RE-COMPUTE!)
 *
 * CONSOLIDATES:
 * - ZodTierGenerator.generateMapper() logic (lines 1180-1529)
 * - Nested field transformation logic
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapperEmitter = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const helpers_1 = require("./helpers");
const canonical_names_1 = require("../canonical-names");
class MapperEmitter {
    /**
     * Main entry point
     *
     * PENTING: Accept routeResponseMap dari ContractEmitter
     * DO NOT re-compute atau re-infer!
     */
    static async generate(mappersDir, context, routeResponseMap) {
        const lines = [];
        const generatedMappers = new Set();
        // Phase 1: Generate read mappers (response transform)
        if (context.manifest.models) {
            for (const model of context.manifest.models) {
                try {
                    const mapperName = `to${model.name}Read`;
                    const listMapperName = `to${model.name}ReadList`;
                    if (!generatedMappers.has(mapperName)) {
                        generatedMappers.add(mapperName);
                        lines.push(this.generateReadMapper(model));
                        lines.push('');
                    }
                    if (!generatedMappers.has(listMapperName)) {
                        generatedMappers.add(listMapperName);
                        lines.push(this.generateReadListMapper(model));
                        lines.push('');
                    }
                }
                catch (error) {
                    console.warn(`[MapperEmitter] Error generating mapper for model ${model.name}:`, error);
                }
            }
        }
        // Phase 2: Generate API mappers (form transform)
        const routes = context.manifest.routes || [];
        for (const route of routes) {
            if (!route.response || !route.schema)
                continue;
            try {
                const groupName = (0, helpers_1.getResourceName)(route);
                const titleCase = (0, helpers_1.toTitleCase)(groupName);
                const actionName = (0, helpers_1.getActionName)(route, canonical_names_1.CANONICAL_ACTION_MAP);
                // Only emit untuk POST/PUT/PATCH (mutations)
                if (['Create', 'Update'].includes(actionName)) {
                    const mapperName = `toApi${titleCase}${actionName}`;
                    if (!generatedMappers.has(mapperName)) {
                        generatedMappers.add(mapperName);
                        lines.push(this.generateApiMapper(route, titleCase, actionName));
                        lines.push('');
                    }
                }
            }
            catch (error) {
                console.warn(`[MapperEmitter] Error processing route ${route.name}:`, error);
            }
        }
        // Write file
        const filePath = path_1.default.join(mappersDir, 'api-mapper.ts');
        await fs_extra_1.default.ensureDir(mappersDir);
        await fs_extra_1.default.writeFile(filePath, lines.join('\n'));
        return { lines };
    }
    /**
     * Generate read mapper: API response → Frontend model
     *
     * Input: raw API response dengan snake_case
     * Output: Frontend model dengan camelCase
     *
     * Example:
     *   export const toProductRead = (raw: Product): ProductTransformed => ({
     *     id: raw.id,
     *     firstName: raw.first_name,
     *     createdAt: raw.created_at,
     *   })
     */
    static generateReadMapper(model) {
        const mappings = [];
        if (!model.fields) {
            return `export const to${model.name}Read = (raw: ${model.name}): ${model.name}Transformed => raw as ${model.name}Transformed`;
        }
        for (const [dbName, fieldDef] of Object.entries(model.fields)) {
            const field = fieldDef;
            const camelName = (0, helpers_1.toCamelCase)(dbName);
            mappings.push(`    ${camelName}: raw.${dbName} as unknown as typeof raw.${dbName},`);
        }
        return `export const to${model.name}Read = (raw: ${model.name}): ${model.name}Transformed => ({
${mappings.join('\n')}
  })`;
    }
    /**
     * Generate list mapper: transform array of responses
     *
     * Example:
     *   export const toProductReadList = (raw: Product[]): ProductTransformed[] =>
     *     raw.map(toProductRead)
     */
    static generateReadListMapper(model) {
        return `export const to${model.name}ReadList = (raw: ${model.name}[]): ${model.name}Transformed[] =>
  raw.map(to${model.name}Read)`;
    }
    /**
     * Generate API mapper: Form input → API payload
     *
     * Used untuk mutations (POST/PUT/PATCH)
     *
     * Input: Form data (camelCase, from frontend)
     * Output: API payload (snake_case, untuk backend)
     *
     * Example:
     *   export const toApiProductCreate = (form: ProductForm['create']): ProductCreatePayload => ({
     *     first_name: form.firstName,
     *     email: form.email,
     *   })
     */
    static generateApiMapper(route, titleCase, actionName) {
        // Get form schema dari route.schema.rules
        const formMappings = [];
        if (route.schema?.rules) {
            for (const [fieldName] of Object.entries(route.schema.rules)) {
                const snakeName = fieldName;
                const camelName = (0, helpers_1.toCamelCase)(fieldName);
                formMappings.push(`    ${snakeName}: form.${camelName} as unknown,`);
            }
        }
        const actionLower = actionName[0].toLowerCase() + actionName.slice(1);
        const formTypeName = `${titleCase}Form['${actionLower}']`;
        const payloadTypeName = `${titleCase}${actionName}Payload`;
        return `export const toApi${titleCase}${actionName} = (form: ${formTypeName}): ${payloadTypeName} => ({
${formMappings.join('\n')}
  })`;
    }
}
exports.MapperEmitter = MapperEmitter;
