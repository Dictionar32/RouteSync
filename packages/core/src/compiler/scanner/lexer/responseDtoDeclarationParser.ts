import type { AstIdentifier, TokenDescriptor } from './phpAstTypes';
import { createAstIdentifier } from './phpAstTypes';
import type { PhpPropertyTypeAst, ResponseDtoDeclarationAst, ResponseDtoPropertyAst } from './responseDtoAstTypes';

export function parseResponseDtoDeclaration(
    tokens: readonly TokenDescriptor[],
    className: AstIdentifier
): ResponseDtoDeclarationAst {
    const properties: ResponseDtoPropertyAst[] = [];
    for (let i = 0; i + 2 < tokens.length; i++) {
        if (tokens[i].value !== 'public') continue;
        if (tokens[i + 1].type !== 'IDENTIFIER' || tokens[i + 2].type !== 'VARIABLE') continue;
        properties.push({
            visibility: 'public',
            type: parsePropertyType(tokens[i + 1].value),
            name: createAstIdentifier(tokens[i + 2].value.slice(1)),
            source: tokens[i]
        });
    }
    return Object.freeze({ className, properties: Object.freeze(properties), source: tokens[0] });
}

function parsePropertyType(value: string): PhpPropertyTypeAst {
    const nullable = value.startsWith('?');
    const name = value.replace('?', '');
    switch (name) {
        case 'string': return { kind: 'primitive', name: 'string', nullable };
        case 'int': return { kind: 'primitive', name: 'int', nullable };
        case 'float': return { kind: 'primitive', name: 'float', nullable };
        case 'bool': return { kind: 'primitive', name: 'bool', nullable };
        case 'mixed': return { kind: 'mixed', nullable: true };
        default: return { kind: 'named', name: createAstIdentifier(name), nullable };
    }
}
