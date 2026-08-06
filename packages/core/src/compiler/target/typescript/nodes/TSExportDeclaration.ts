/**
 * @file TSExportDeclaration.ts
 * @description TypeScript export declaration node
 * 
 * Represents export statements dalam TypeScript AST.
 * Example: export { User }; export * from './types';
 * 
 * SKELETON ONLY - NO IMPLEMENTATION LOGIC YET
 */

import type { TSNode, SourceSpan, TSNodeKind } from './TSNode';
import type { TSVisitor } from '../visitor/TSVisitor';

/**
 * Export specifier for named exports
 * 
 * @example
 * ```typescript
 * // export { User }
 * new TSExportSpecifier('User')
 * 
 * // export { User as UserType }
 * new TSExportSpecifier('User', 'UserType')
 * ```
 */
export class TSExportSpecifier implements TSNode {
    public readonly kind: TSNodeKind = 'export-declaration' as const;

    /**
     * Creates an export specifier
     * 
     * @param local - Local name (yang ada di file ini)
     * @param exported - Exported name (optional, default sama dengan local)
     * @param span - Optional source location
     */
    constructor(
        public readonly local: string,
        public readonly exported?: string,
        public readonly span?: SourceSpan
    ) {
        Object.freeze(this);
    }

    /**
     * Get effective exported name
     */
    public get exportedName(): string {
        return this.exported ?? this.local;
    }
}

/**
 * Export declaration node
 * 
 * Represents various export statements:
 * - Named exports: export { User, Product }
 * - Re-exports: export * from './types'
 * - Named re-exports: export { User } from './types'
 * - Type-only exports: export type { User }
 * 
 * @example
 * ```typescript
 * // export { User, Product }
 * new TSExportDeclaration([
 *   new TSExportSpecifier('User'),
 *   new TSExportSpecifier('Product')
 * ])
 * 
 * // export * from './types'
 * new TSExportDeclaration([], './types', true)
 * 
 * // export { User } from './types'
 * new TSExportDeclaration(
 *   [new TSExportSpecifier('User')],
 *   './types'
 * )
 * 
 * // export type { User }
 * new TSExportDeclaration(
 *   [new TSExportSpecifier('User')],
 *   undefined,
 *   false,
 *   true
 * )
 * ```
 */
export class TSExportDeclaration implements TSNode {
    public readonly kind: TSNodeKind = 'export-declaration' as const;

    /**
     * Creates an export declaration
     * 
     * @param specifiers - Named export specifiers
     * @param moduleSpecifier - Optional module path (for re-exports)
     * @param exportAll - Whether this is export * (export all)
     * @param isTypeOnly - Whether this is type-only export
     * @param span - Optional source location
     */
    constructor(
        public readonly specifiers: readonly TSExportSpecifier[],
        public readonly moduleSpecifier?: string,
        public readonly exportAll: boolean = false,
        public readonly isTypeOnly: boolean = false,
        public readonly span?: SourceSpan
    ) {
        Object.freeze(this);
    }

    /**
     * Check if this is a re-export (has moduleSpecifier)
     */
    public get isReExport(): boolean {
        return this.moduleSpecifier !== undefined;
    }

    /**
     * Check if this is export all (export *)
     */
    public get isExportAll(): boolean {
        return this.exportAll && this.isReExport;
    }

    /**
     * Add export specifier
     * Returns new instance (immutable)
     */
    public addSpecifier(specifier: TSExportSpecifier): TSExportDeclaration {
        return new TSExportDeclaration(
            [...this.specifiers, specifier],
            this.moduleSpecifier,
            this.exportAll,
            this.isTypeOnly,
            this.span
        );
    }

    /**
     * Make type-only export
     * Returns new instance (immutable)
     */
    public asTypeOnly(): TSExportDeclaration {
        return new TSExportDeclaration(
            this.specifiers,
            this.moduleSpecifier,
            this.exportAll,
            true,
            this.span
        );
    }

    /**
     * Factory: Create simple named export
     * 
     * @example
     * ```typescript
     * // export { User }
     * TSExportDeclaration.named(['User'])
     * ```
     */
    public static named(names: readonly string[]): TSExportDeclaration {
        return new TSExportDeclaration(
            names.map(name => new TSExportSpecifier(name))
        );
    }

    /**
     * Factory: Create export all
     * 
     * @example
     * ```typescript
     * // export * from './types'
     * TSExportDeclaration.all('./types')
     * ```
     */
    public static all(moduleSpecifier: string): TSExportDeclaration {
        return new TSExportDeclaration([], moduleSpecifier, true);
    }

    /**
     * Factory: Create re-export
     * 
     * @example
     * ```typescript
     * // export { User, Product } from './types'
     * TSExportDeclaration.from(['User', 'Product'], './types')
     * ```
     */
    public static from(
        names: readonly string[],
        moduleSpecifier: string
    ): TSExportDeclaration {
        return new TSExportDeclaration(
            names.map(name => new TSExportSpecifier(name)),
            moduleSpecifier
        );
    }

    /**
     * Factory: Create type-only export
     * 
     * @example
     * ```typescript
     * // export type { User }
     * TSExportDeclaration.typeOnly(['User'])
     * ```
     */
    public static typeOnly(names: readonly string[]): TSExportDeclaration {
        return new TSExportDeclaration(
            names.map(name => new TSExportSpecifier(name)),
            undefined,
            false,
            true
        );
    }

    /**
     * Accept visitor (Neural Pathway)
     * Menghubungkan node ini dengan visitor pattern untuk traversal
     */
    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitExportDeclaration(this);
    }
}
