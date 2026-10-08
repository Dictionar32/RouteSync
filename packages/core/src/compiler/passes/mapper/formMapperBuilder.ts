import type { SemanticWriteMapperContract } from '../../../types/upstream/semanticMapping';

export function buildFormMapperFromContract(contract: SemanticWriteMapperContract): string {
    const fieldLines = contract.fields.map(field => `  [ApiApiField.${field.target}]: form.${field.source},`).join('\n');
    const actionName = contract.actionName.charAt(0).toUpperCase() + contract.actionName.slice(1);
    return [
        `export const ${contract.functionName} = (form: ${contract.formTypeName}['${actionName}']): ${contract.contractTypeName}['${actionName}'] => ({`,
        fieldLines,
        `})`,
    ].join('\n');
}

/** Compatibility export retained for callers migrating to the semantic contract. */
export const buildFormMapper = buildFormMapperFromContract;

export function toApiFieldKey(value: { readonly value: { readonly value: string } }): string {
    return value.value.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
