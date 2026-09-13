/**
 * @file TSExportDeclaration.ts
 * @description TypeScript export declaration node
 */

import type { TSNode, SourceSpan, TSNodeKind } from './TSNode';
import type { TSVisitor } from '../visitor/TSVisitor';
import { TSExportSpecifier } from './TSExportSpecifier';

export { TSExportSpecifier };

/**
 * Export declaration node supporting named, re-export, and type-only exports.
 */
export class TSExportDeclaration implements TSNode {
    public readonly kind: TSNodeKind = 'export-declaration' as const;

    constructor(
        public readonly specifiers: readonly TSExportSpecifier[],
        public readonly moduleSpecifier?: string,
        public readonly exportAll: boolean = false,
        public readonly isTypeOnly: boolean = false,
        public readonly span?: SourceSpan
    ) {
        Object.freeze(this);
    }

    public get isReExport(): boolean {
        return this.moduleSpecifier !== undefined;
    }

    public get isExportAll(): boolean {
        return this.exportAll && this.isReExport;
    }

    public addSpecifier(specifier: TSExportSpecifier): TSExportDeclaration {
        return new TSExportDeclaration(
            [...this.specifiers, specifier],
            this.moduleSpecifier,
            this.exportAll,
            this.isTypeOnly,
            this.span
        );
    }

    public asTypeOnly(): TSExportDeclaration {
        return new TSExportDeclaration(
            this.specifiers,
            this.moduleSpecifier,
            this.exportAll,
            true,
            this.span
        );
    }

    public static named(names: readonly string[]): TSExportDeclaration {
        return new TSExportDeclaration(
            names.map(name => new TSExportSpecifier(name))
        );
    }

    public static all(moduleSpecifier: string): TSExportDeclaration {
        return new TSExportDeclaration([], moduleSpecifier, true);
    }

    public static from(
        names: readonly string[],
        moduleSpecifier: string
    ): TSExportDeclaration {
        return new TSExportDeclaration(
            names.map(name => new TSExportSpecifier(name)),
            moduleSpecifier
        );
    }

    public static typeOnly(names: readonly string[]): TSExportDeclaration {
        return new TSExportDeclaration(
            names.map(name => new TSExportSpecifier(name)),
            undefined,
            false,
            true
        );
    }

    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitExportDeclaration(this);
    }
}
