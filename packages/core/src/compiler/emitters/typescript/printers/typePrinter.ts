/**
 * TypeScript Type Node Printers.
 *
 * @module compiler/emitters/typescript/printers
 */

import type { TSVisitor } from '../../../target/typescript/visitor/TSVisitor';
import type {
    TSTypeReference,
    TSArrayType,
    TSUnionType,
    TSIntersectionType,
    TSTypeAliasDeclaration
} from '../../../target/typescript/nodes';

export function printTypeReference(node: TSTypeReference, visitor: TSVisitor<string>): string {
    let result = node.name;
    if (node.typeArguments.length > 0) {
        const args = node.typeArguments.map(arg => arg.accept(visitor)).join(', ');
        result += `<${args}>`;
    }
    if (node.isArray) {
        result += '[]';
    }
    return result;
}

export function printArrayType(node: TSArrayType, visitor: TSVisitor<string>): string {
    return `${node.elementType.accept(visitor)}[]`;
}

export function printUnionType(node: TSUnionType, visitor: TSVisitor<string>): string {
    return node.types.map(t => t.accept(visitor)).join(' | ');
}

export function printIntersectionType(node: TSIntersectionType, visitor: TSVisitor<string>): string {
    return node.types.map(t => t.accept(visitor)).join(' & ');
}

export function printTypeAliasDeclaration(node: TSTypeAliasDeclaration, visitor: TSVisitor<string>): string {
    const exportModifier = node.exported ? 'export ' : '';
    const typeStr = node.type.accept(visitor);
    return `${exportModifier}type ${node.name} = ${typeStr};`;
}
