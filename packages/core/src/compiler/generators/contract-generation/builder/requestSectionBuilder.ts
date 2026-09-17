/**
 * requestSectionBuilder.ts
 *
 * Builders for request payload schemas, inferred types, and validators.
 *
 * @module compiler/generators/contract-generation/builder/requestSectionBuilder
 */

import { toPascalCase } from '../../../../utils/resource-naming';
import { GeneratedContract, capitalize } from './contractBuilderTypes';

/**
 * Build Section 1: Zod Request Schemas
 */
export function buildSchemaSection(
    lines: string[],
    contract: GeneratedContract
): void {
    const { resourceName, actions } = contract;

    lines.push(`/**`);
    lines.push(` * Runtime contract validation schemas for ${resourceName}`);
    lines.push(` * @provenance ContractSchema: ${resourceName}`);
    lines.push(` */`);
    lines.push(`export const ${resourceName}ContractSchema = {`);

    actions.forEach((action, index) => {
        lines.push(action.schemaCode);

        // Add comma after each action except last
        if (index < actions.length - 1) {
            const lastLine = lines[lines.length - 1];
            lines[lines.length - 1] = lastLine + ',';
        }
    });

    lines.push('};');
    const pascalSchema = `${toPascalCase(resourceName)}ContractSchema`;
    if (pascalSchema !== `${resourceName}ContractSchema`) {
        lines.push(`export const ${pascalSchema} = ${resourceName}ContractSchema;`);
    }
}

/**
 * Build Section 2: Inferred Request Types
 */
export function buildTypeSection(
    lines: string[],
    contract: GeneratedContract
): void {
    const { resourceName, actions } = contract;

    lines.push(`export type ${capitalize(resourceName)}Contract = {`);

    actions.forEach((action, index) => {
        const actionName = capitalize(action.name);
        const schemaRef = `typeof ${resourceName}ContractSchema.${actionName}`;
        lines.push(`  ${actionName}: z.infer<${schemaRef}>${index < actions.length - 1 ? ',' : ''}`);
    });

    lines.push('};');
}

/**
 * Build Section 3: Request Validators
 */
export function buildValidatorSection(
    lines: string[],
    contract: GeneratedContract
): void {
    const { resourceName, actions } = contract;

    actions.forEach(action => {
        const functionName = `validate${toPascalCase(resourceName)}${capitalize(action.name)}`;
        lines.push(`export const ${functionName} = (data: unknown) => {`);
        lines.push(`  return ${resourceName}ContractSchema.${capitalize(action.name)}.parse(data);`);
        lines.push('};');
        lines.push('');
    });
}
