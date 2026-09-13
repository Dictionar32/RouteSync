/**
 * TypeScript Declaration & Member Printers.
 *
 * @module compiler/emitters/typescript/printers
 */

import type { TSVisitor } from '../../../target/typescript/visitor/TSVisitor';
import type {
    TSImportDeclaration,
    TSExportDeclaration,
    TSInterfaceDeclaration,
    TSPropertySignature,
    TSFunctionDeclaration,
    TSMethodSignature,
    TSComment
} from '../../../target/typescript/nodes';

export function printImportDeclaration(node: TSImportDeclaration): string {
    const typeModifier = node.isType ? 'type ' : '';
    const names = node.names.join(', ');
    return `import ${typeModifier}{ ${names} } from '${node.from}';`;
}

export function printExportDeclaration(node: TSExportDeclaration): string {
    if (node.isTypeOnly) {
        return `export type { ${node.names.join(', ')} } from '${node.from}';`;
    }
    return `export { ${node.names.join(', ')} } from '${node.from}';`;
}

export function printInterfaceDeclaration(
    node: TSInterfaceDeclaration,
    visitor: TSVisitor<string>,
    indentFn: (s: string) => string
): string {
    const parts: string[] = [];

    if (node.comment) {
        parts.push(node.comment.accept(visitor));
    }

    const exportModifier = node.exported ? 'export ' : '';
    const extendsClause = node.extendsTypes.length > 0
        ? ` extends ${node.extendsTypes.join(', ')}`
        : '';

    parts.push(`${exportModifier}interface ${node.name}${extendsClause} {`);

    for (const prop of node.properties) {
        const propStr = prop.accept(visitor);
        parts.push(indentFn(propStr));
    }

    parts.push('}');

    return parts.join('\n');
}

export function printPropertySignature(node: TSPropertySignature, visitor: TSVisitor<string>): string {
    const parts: string[] = [];

    if (node.comment && !node.comment.isMultiLine) {
        parts.push(node.comment.accept(visitor));
    }

    const readonly = node.readonly ? 'readonly ' : '';
    const optional = node.optional ? '?' : '';
    const type = node.type.accept(visitor);

    const propDecl = `${readonly}${node.name}${optional}: ${type};`;

    if (node.comment && node.comment.isMultiLine) {
        parts.unshift(node.comment.accept(visitor));
    }

    parts.push(propDecl);

    return parts.join('\n');
}

export function printFunctionDeclaration(node: TSFunctionDeclaration, visitor: TSVisitor<string>): string {
    const exportModifier = node.exported ? 'export ' : '';
    const asyncModifier = node.isAsync ? 'async ' : '';

    const params = node.parameters
        .map(p => `${p.name}: ${p.type.accept(visitor)}`)
        .join(', ');

    const returnType = node.returnType.accept(visitor);

    return `${exportModifier}${asyncModifier}function ${node.name}(${params}): ${returnType} {\n  // TODO: Implementation\n}`;
}

export function printMethodSignature(node: TSMethodSignature, visitor: TSVisitor<string>): string {
    const optional = node.optional ? '?' : '';
    const params = node.parameters
        .map(p => `${p.name}: ${p.type.accept(visitor)}`)
        .join(', ');
    const returnType = node.returnType.accept(visitor);

    return `${node.name}${optional}(${params}): ${returnType};`;
}

export function printComment(node: TSComment): string {
    if (node.isMultiline) {
        return `/**\n * ${node.text}\n */`;
    }
    return `/** ${node.text} */`;
}
