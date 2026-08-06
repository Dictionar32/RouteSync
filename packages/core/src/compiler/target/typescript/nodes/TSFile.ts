/**
 * @file TSFile.ts
 * @description TypeScript file (root node)
 * 
 * Represents complete TypeScript file dalam Target AST.
 * Root node yang contains imports, declarations, dan exports.
 */

import type { TSNode, SourceSpan, TSNodeKind } from './TSNode';
import type { TSImportDeclaration } from './TSImportDeclaration';
import type { TSExportDeclaration } from './TSExportDeclaration';
import type { TSInterfaceDeclaration } from './TSInterfaceDeclaration';
import type { TSTypeAliasDeclaration } from './TSTypeAliasDeclaration';
import type { TSFunctionDeclaration } from './TSFunctionDeclaration';
import type { TSVisitor } from '../visitor/TSVisitor';

/**
 * Union type for all declaration types
 */
export type TSDeclaration =
    | TSInterfaceDeclaration
    | TSTypeAliasDeclaration
    | TSFunctionDeclaration;

/**
 * Root node representing complete TypeScript file
 * 
 * @example
 * ```typescript
 * // Create file with imports and declarations
 * new TSFile(
 *   [
 *     TSImportDeclaration.valueImport(['User'], './types')
 *   ],
 *   [
 *     new TSInterfaceDeclaration('Response', [...])
 *   ],
 *   [
 *     TSExportDeclaration.named(['Response'])
 *   ]
 * )
 * ```
 */
export class TSFile implements TSNode {
    public readonly kind: TSNodeKind = 'file' as const;

    /**
     * Creates a TypeScript file node
     * 
     * @param imports - Import declarations
     * @param declarations - Type/interface/function declarations
     * @param exports - Export declarations
     * @param span - Optional source location
     */
    constructor(
        public readonly imports: readonly TSImportDeclaration[] = [],
        public readonly declarations: readonly TSDeclaration[] = [],
        public readonly exports: readonly TSExportDeclaration[] = [],
        public readonly span?: SourceSpan
    ) {
        Object.freeze(this);
    }

    /**
     * Add import to file
     * Returns new instance (immutable)
     */
    public addImport(importDecl: TSImportDeclaration): TSFile {
        return new TSFile(
            [...this.imports, importDecl],
            this.declarations,
            this.exports,
            this.span
        );
    }

    /**
     * Add declaration to file
     * Returns new instance (immutable)
     */
    public addDeclaration(decl: TSDeclaration): TSFile {
        return new TSFile(
            this.imports,
            [...this.declarations, decl],
            this.exports,
            this.span
        );
    }

    /**
     * Add export to file
     * Returns new instance (immutable)
     */
    public addExport(exportDecl: TSExportDeclaration): TSFile {
        return new TSFile(
            this.imports,
            this.declarations,
            [...this.exports, exportDecl],
            this.span
        );
    }

    /**
     * Factory: Create empty file
     * 
     * @example
     * ```typescript
     * const file = TSFile.empty()
     *   .addImport(importDecl)
     *   .addDeclaration(interfaceDecl);
     * ```
     */
    public static empty(): TSFile {
        return new TSFile();
    }

    /**
     * Factory: Create file with imports only
     */
    public static withImports(imports: readonly TSImportDeclaration[]): TSFile {
        return new TSFile(imports);
    }

    /**
     * Factory: Create file with declarations only
     */
    public static withDeclarations(declarations: readonly TSDeclaration[]): TSFile {
        return new TSFile([], declarations);
    }

    /**
     * Accept visitor (Neural Pathway)
     * Ini adalah "saraf" yang menghubungkan node ke visitor
     */
    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitFile(this);
    }
}
