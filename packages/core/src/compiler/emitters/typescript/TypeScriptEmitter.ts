/**
 * @file TypeScriptEmitter.ts
 * @description Emit TypeScript code from Target AST using pure visitor pattern
 * 
 * Emitter Phase (Keluaran/Output):
 * - Input: TSFile (Target AST)
 * - Output: string (TypeScript code)
 * - Pure visitor - NO LOGIC, ONLY PRINTING
 * - Uses accept() methods for traversal
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

/**
 * TypeScript Code Emitter
 * 
 * Pure visitor pattern - hanya print AST nodes ke string.
 * NO business logic, NO type resolution, NO formatting decisions.
 */
export class TypeScriptEmitter implements TSVisitor<string> {
    private indentLevel = 0;
    private readonly indentSize = 2;

    /**
     * Emit file
     */
    public visitFile(file: TSFile): string {
        const parts: string[] = [];

        // Emit imports
        if (file.imports.length > 0) {
            for (const imp of file.imports) {
                parts.push(imp.accept(this));
            }
            parts.push(''); // Empty line after imports
        }

        // Emit declarations
        for (const decl of file.declarations) {
            parts.push(decl.accept(this));
            parts.push(''); // Empty line between declarations
        }

        return parts.join('\n');
    }

    /**
     * Emit import declaration
     */
    public visitImportDeclaration(node: TSImportDeclaration): string {
        const typeModifier = node.isType ? 'type ' : '';
        const names = node.names.join(', ');
        return `import ${typeModifier}{ ${names} } from '${node.from}';`;
    }

    /**
     * Emit interface declaration
     */
    public visitInterfaceDeclaration(node: TSInterfaceDeclaration): string {
        const parts: string[] = [];

        // Comment
        if (node.comment) {
            parts.push(node.comment.accept(this));
        }

        // Interface header
        const exportModifier = node.exported ? 'export ' : '';
        const extendsClause = node.extendsTypes.length > 0
            ? ` extends ${node.extendsTypes.join(', ')}`
            : '';

        parts.push(`${exportModifier}interface ${node.name}${extendsClause} {`);

        // Properties
        this.indentLevel++;
        for (const prop of node.properties) {
            const propStr = prop.accept(this);
            parts.push(this.indent(propStr));
        }
        this.indentLevel--;

        parts.push('}');

        return parts.join('\n');
    }

    /**
     * Emit property signature
     */
    public visitPropertySignature(node: TSPropertySignature): string {
        const parts: string[] = [];

        // Property comment (same line or above)
        if (node.comment && !node.comment.isMultiLine) {
            parts.push(node.comment.accept(this));
        }

        // Property declaration
        const readonly = node.readonly ? 'readonly ' : '';
        const optional = node.optional ? '?' : '';
        const type = node.type.accept(this);

        const propDecl = `${readonly}${node.name}${optional}: ${type};`;

        if (node.comment && node.comment.isMultiLine) {
            parts.unshift(node.comment.accept(this));
        }

        parts.push(propDecl);

        return parts.join('\n');
    }

    /**
     * Emit type reference
     */
    public visitTypeReference(node: TSTypeReference): string {
        let result = node.name;

        // Type arguments
        if (node.typeArguments.length > 0) {
            const args = node.typeArguments.map(arg => arg.accept(this)).join(', ');
            result += `<${args}>`;
        }

        // Array suffix
        if (node.isArray) {
            result += '[]';
        }

        return result;
    }

    /**
     * Emit comment
     */
    public visitComment(node: TSComment): string {
        if (node.isMultiline) {
            return `/**\n * ${node.text}\n */`;
        }
        return `/** ${node.text} */`;
    }

    /**
     * Emit type alias declaration
     */
    public visitTypeAliasDeclaration(node: TSTypeAliasDeclaration): string {
        const exportModifier = node.exported ? 'export ' : '';
        const typeStr = node.type.accept(this);
        return `${exportModifier}type ${node.name} = ${typeStr};`;
    }

    /**
     * Emit function declaration
     */
    public visitFunctionDeclaration(node: TSFunctionDeclaration): string {
        const exportModifier = node.exported ? 'export ' : '';
        const asyncModifier = node.isAsync ? 'async ' : '';

        // Parameters
        const params = node.parameters
            .map(p => `${p.name}: ${p.type.accept(this)}`)
            .join(', ');

        // Return type
        const returnType = node.returnType.accept(this);

        return `${exportModifier}${asyncModifier}function ${node.name}(${params}): ${returnType} {
  // TODO: Implementation
}`;
    }

    /**
     * Emit method signature
     */
    public visitMethodSignature(node: TSMethodSignature): string {
        const optional = node.optional ? '?' : '';
        const params = node.parameters
            .map(p => `${p.name}: ${p.type.accept(this)}`)
            .join(', ');
        const returnType = node.returnType.accept(this);

        return `${node.name}${optional}(${params}): ${returnType};`;
    }

    /**
     * Emit array type
     */
    public visitArrayType(node: TSArrayType): string {
        return `${node.elementType.accept(this)}[]`;
    }

    /**
     * Emit union type
     */
    public visitUnionType(node: TSUnionType): string {
        return node.types.map(t => t.accept(this)).join(' | ');
    }

    /**
     * Emit intersection type
     */
    public visitIntersectionType(node: TSIntersectionType): string {
        return node.types.map(t => t.accept(this)).join(' & ');
    }

    /**
     * Emit export declaration
     */
    public visitExportDeclaration(node: TSExportDeclaration): string {
        if (node.isTypeOnly) {
            return `export type { ${node.names.join(', ')} } from '${node.from}';`;
        }
        return `export { ${node.names.join(', ')} } from '${node.from}';`;
    }

    /**
     * Helper: add indentation
     */
    private indent(str: string): string {
        const spaces = ' '.repeat(this.indentLevel * this.indentSize);
        return spaces + str;
    }
}
