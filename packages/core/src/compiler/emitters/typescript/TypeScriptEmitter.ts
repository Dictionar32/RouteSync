/**
 * @file TypeScriptEmitter.ts
 * @description Emit TypeScript code from Target AST using pure visitor pattern.
 * Conforms to Rule 14: Active Consumer Orchestrator, 0 wildcard re-exports.
 *
 * @module compiler/emitters/typescript
 */

import type { TSVisitor } from '../../target/typescript/visitor/TSVisitor';
import type {
    TSFile,
    TSImportDeclaration,
    TSInterfaceDeclaration,
    TSTypeAliasDeclaration,
    TSFunctionDeclaration,
    TSPropertySignature,
    TSMethodSignature,
    TSTypeReference,
    TSArrayType,
    TSUnionType,
    TSIntersectionType,
    TSExportDeclaration,
    TSComment
} from '../../target/typescript/nodes';
import {
    printTypeReference,
    printArrayType,
    printUnionType,
    printIntersectionType,
    printTypeAliasDeclaration,
    printImportDeclaration,
    printExportDeclaration,
    printInterfaceDeclaration,
    printPropertySignature,
    printFunctionDeclaration,
    printMethodSignature,
    printComment
} from './printers';

/**
 * TypeScript Code Emitter
 * Pure visitor pattern orchestrator.
 */
export class TypeScriptEmitter implements TSVisitor<string> {
    private indentLevel = 0;
    private readonly indentSize = 2;

    public visitFile(file: TSFile): string {
        const parts: string[] = [];

        if (file.imports.length > 0) {
            for (const imp of file.imports) {
                parts.push(imp.accept(this));
            }
            parts.push('');
        }

        for (const decl of file.declarations) {
            parts.push(decl.accept(this));
            parts.push('');
        }

        return parts.join('\n');
    }

    public visitImportDeclaration(node: TSImportDeclaration): string {
        return printImportDeclaration(node);
    }

    public visitInterfaceDeclaration(node: TSInterfaceDeclaration): string {
        this.indentLevel++;
        const res = printInterfaceDeclaration(node, this, s => this.indent(s));
        this.indentLevel--;
        return res;
    }

    public visitPropertySignature(node: TSPropertySignature): string {
        return printPropertySignature(node, this);
    }

    public visitTypeReference(node: TSTypeReference): string {
        return printTypeReference(node, this);
    }

    public visitComment(node: TSComment): string {
        return printComment(node);
    }

    public visitTypeAliasDeclaration(node: TSTypeAliasDeclaration): string {
        return printTypeAliasDeclaration(node, this);
    }

    public visitFunctionDeclaration(node: TSFunctionDeclaration): string {
        return printFunctionDeclaration(node, this);
    }

    public visitMethodSignature(node: TSMethodSignature): string {
        return printMethodSignature(node, this);
    }

    public visitArrayType(node: TSArrayType): string {
        return printArrayType(node, this);
    }

    public visitUnionType(node: TSUnionType): string {
        return printUnionType(node, this);
    }

    public visitIntersectionType(node: TSIntersectionType): string {
        return printIntersectionType(node, this);
    }

    public visitExportDeclaration(node: TSExportDeclaration): string {
        return printExportDeclaration(node);
    }

    private indent(str: string): string {
        const spaces = ' '.repeat(this.indentLevel * this.indentSize);
        return spaces + str;
    }
}
