/**
 * @file TSVisitor.ts
 * @description Visitor interface untuk TypeScript AST traversal
 * 
 * Implements visitor pattern untuk traverse dan process TypeScript AST nodes.
 * Setiap node type punya dedicated visit method.
 * 
 * SKELETON ONLY - NO IMPLEMENTATION LOGIC YET
 */

import type { TSFile } from '../nodes/TSFile';
import type { TSImportDeclaration } from '../nodes/TSImportDeclaration';
import type { TSInterfaceDeclaration } from '../nodes/TSInterfaceDeclaration';
import type { TSTypeAliasDeclaration } from '../nodes/TSTypeAliasDeclaration';
import type { TSFunctionDeclaration } from '../nodes/TSFunctionDeclaration';
import type { TSPropertySignature } from '../nodes/TSPropertySignature';
import type { TSMethodSignature } from '../nodes/TSMethodSignature';
import type { TSTypeReference } from '../nodes/TSTypeReference';
import type { TSArrayType } from '../nodes/TSArrayType';
import type { TSUnionType } from '../nodes/TSUnionType';
import type { TSIntersectionType } from '../nodes/TSIntersectionType';
import type { TSExportDeclaration } from '../nodes/TSExportDeclaration';
import type { TSComment } from '../nodes/TSComment';

/**
 * Visitor interface untuk TypeScript AST
 * 
 * Generic parameter R adalah return type dari semua visit methods.
 * Implementors bisa return:
 * - void (untuk side-effect only visitors)
 * - string (untuk emitters)
 * - TSNode (untuk transformers)
 * - custom types (untuk analyzers)
 * 
 * @example
 * ```typescript
 * // Emitter visitor (returns string)
 * class TypeScriptEmitter implements TSVisitor<string> {
 *   visitFile(node: TSFile): string {
 *     const imports = node.imports.map(i => i.accept(this)).join('\n');
 *     const declarations = node.declarations.map(d => d.accept(this)).join('\n');
 *     return `${imports}\n\n${declarations}`;
 *   }
 *   
 *   // ... other visit methods
 * }
 * 
 * // Analyzer visitor (returns metadata)
 * class TypeAnalyzer implements TSVisitor<TypeMetadata> {
 *   visitInterfaceDeclaration(node: TSInterfaceDeclaration): TypeMetadata {
 *     return {
 *       name: node.name,
 *       properties: node.members.length,
 *       isExported: node.isExported
 *     };
 *   }
 *   
 *   // ... other visit methods
 * }
 * ```
 */
export interface TSVisitor<R> {
    /**
     * Visit file node (root)
     */
    visitFile(node: TSFile): R;

    /**
     * Visit import declaration
     * Example: import { User } from './types'
     */
    visitImportDeclaration(node: TSImportDeclaration): R;

    /**
     * Visit interface declaration
     * Example: interface User { id: number }
     */
    visitInterfaceDeclaration(node: TSInterfaceDeclaration): R;

    /**
     * Visit type alias declaration
     * Example: type UserId = number
     */
    visitTypeAliasDeclaration(node: TSTypeAliasDeclaration): R;

    /**
     * Visit function declaration
     * Example: function greet(name: string): void
     */
    visitFunctionDeclaration(node: TSFunctionDeclaration): R;

    /**
     * Visit property signature
     * Example: name: string
     */
    visitPropertySignature(node: TSPropertySignature): R;

    /**
     * Visit method signature
     * Example: getName(): string
     */
    visitMethodSignature(node: TSMethodSignature): R;

    /**
     * Visit type reference
     * Example: User, string, Array<T>
     */
    visitTypeReference(node: TSTypeReference): R;

    /**
     * Visit array type
     * Example: string[], User[]
     */
    visitArrayType(node: TSArrayType): R;

    /**
     * Visit union type
     * Example: string | number
     */
    visitUnionType(node: TSUnionType): R;

    /**
     * Visit intersection type
     * Example: User & Timestamps
     */
    visitIntersectionType(node: TSIntersectionType): R;

    /**
     * Visit export declaration
     * Example: export { User }
     */
    visitExportDeclaration(node: TSExportDeclaration): R;

    /**
     * Visit comment node
     * Example: single-line, multi-line, JSDoc comments
     */
    visitComment(node: TSComment): R;
}

/**
 * Type guard helper untuk check visitor implementation
 */
export function isVisitor<R>(obj: unknown): obj is TSVisitor<R> {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'visitFile' in obj &&
        'visitImportDeclaration' in obj &&
        'visitInterfaceDeclaration' in obj
    );
}
