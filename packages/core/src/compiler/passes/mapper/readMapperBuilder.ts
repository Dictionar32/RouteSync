import type { SemanticMappingField, SemanticReadMapperContract } from '../../../types/upstream/semanticMapping';

export function indent(block: string): string {
    return block.split('\n').map(line => `  ${line}`).join('\n');
}

function render(field: SemanticMappingField, path: string): string {
    switch (field.kind) {
        case 'direct':
            return `  ${field.target}: ${path},`;
        case 'object':
        case 'resource':
            return field.fields
                .filter(child => !child.source.startsWith('__'))
                .map(child => render(child, `${path}.${child.source}`))
                .join('\n');
        case 'collection': {
            if (!field.element) return `  ${field.target}: ${path},`;
            if (field.element.kind === 'direct') return `  ${field.target}: ${path},`;
            const body = render(field.element, 'item');
            return `  ${field.target}: ${path}?.map(item => ({\n${indent(body)}\n  })),`;
        }
        case 'resource_collection':
            return `  ${field.target}: ${path}.map(${field.mapperName}),`;
    }
}

export function buildReadMapperFromContract(contract: SemanticReadMapperContract): string {
    const fieldLines = contract.fields
        .filter(field => !field.source.startsWith('__'))
        .map(field => render(field, `api.${field.source}`))
        .join('\n');

    return [
        `export const ${contract.mapperName} = (api: ${contract.apiResponseType}): ${contract.transformedType} => ({`,
        fieldLines,
        `})`,
        '',
        `export const ${contract.listMapperName} = (api: ${contract.apiResponseType}[]): ${contract.transformedType}[] => api.map(${contract.mapperName})`,
    ].join('\n');
}

/** Compatibility name retained; it now accepts only a closed semantic contract. */
export const buildReadMapperFromFields = buildReadMapperFromContract;
