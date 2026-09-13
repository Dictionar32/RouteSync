/**
 * @file TSBaseVisitor.ts
 * @description Base visitor class with default fallback behaviors
 */

import type { TSVisitor } from './TSVisitor';
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
import { visitAll } from './visitorUtils';

export { visitAll };

/**
 * Base visitor with default implementations for all AST node visit methods.
 * Subclasses override specific node handlers as needed.
 */
export abstract class TSBaseVisitor<R> implements TSVisitor<R> {
    protected abstract defaultResult(): R;

    protected aggregateResults(results: readonly R[]): R {
        return results[0] ?? this.defaultResult();
    }

    visitFile(_node: TSFile): R { return this.defaultResult(); }
    visitImportDeclaration(_node: TSImportDeclaration): R { return this.defaultResult(); }
    visitInterfaceDeclaration(_node: TSInterfaceDeclaration): R { return this.defaultResult(); }
    visitTypeAliasDeclaration(_node: TSTypeAliasDeclaration): R { return this.defaultResult(); }
    visitFunctionDeclaration(_node: TSFunctionDeclaration): R { return this.defaultResult(); }
    visitPropertySignature(_node: TSPropertySignature): R { return this.defaultResult(); }
    visitMethodSignature(_node: TSMethodSignature): R { return this.defaultResult(); }
    visitTypeReference(_node: TSTypeReference): R { return this.defaultResult(); }
    visitArrayType(_node: TSArrayType): R { return this.defaultResult(); }
    visitUnionType(_node: TSUnionType): R { return this.defaultResult(); }
    visitIntersectionType(_node: TSIntersectionType): R { return this.defaultResult(); }
    visitExportDeclaration(_node: TSExportDeclaration): R { return this.defaultResult(); }
    visitComment(_node: TSComment): R { return this.defaultResult(); }
}
