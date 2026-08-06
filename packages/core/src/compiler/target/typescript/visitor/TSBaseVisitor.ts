/**
 * @file TSBaseVisitor.ts
 * @description Base visitor class dengan default behaviors
 * 
 * Provides default implementations untuk semua visit methods.
 * Subclasses bisa override specific methods yang mereka butuhkan.
 * 
 * SKELETON ONLY - NO IMPLEMENTATION LOGIC YET
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

/**
 * Base visitor dengan default implementations
 * 
 * Default behavior:
 * - visitFile: visit all children
 * - visitImportDeclaration: return default
 * - visitInterfaceDeclaration: visit all members
 * - visitTypeAliasDeclaration: visit type
 * - visitPropertySignature: visit type
 * - visitMethodSignature: visit parameters dan return type
 * - visitTypeReference: return default
 * - visitArrayType: visit element type
 * - visitUnionType: visit all types
 * - visitIntersectionType: visit all types
 * - visitExportDeclaration: return default
 * 
 * @example
 * ```typescript
 * // Custom visitor yang hanya override specific methods
 * class ImportCollector extends TSBaseVisitor<string[]> {
 *   private imports: string[] = [];
 *   
 *   protected defaultResult(): string[] {
 *     return this.imports;
 *   }
 *   
 *   visitImportDeclaration(node: TSImportDeclaration): string[] {
 *     this.imports.push(node.moduleSpecifier);
 *     return this.imports;
 *   }
 *   
 *   // Other methods use default behavior
 * }
 * 
 * // Usage
 * const collector = new ImportCollector();
 * const imports = file.accept(collector);
 * console.log(imports); // ['./types', './api', ...]
 * ```
 */
export abstract class TSBaseVisitor<R> implements TSVisitor<R> {
    /**
     * Default result ketika tidak ada specific handling
     * Subclasses MUST override this
     */
    protected abstract defaultResult(): R;

    /**
     * Aggregate multiple results
     * Default: return first result
     * Override untuk custom aggregation logic
     */
    protected aggregateResults(results: readonly R[]): R {
        return results[0] ?? this.defaultResult();
    }

    /**
     * Visit file node
     * Default: visit imports, declarations, exports
     */
    visitFile(node: TSFile): R {
        // Implementation nanti
        // For now: return default
        return this.defaultResult();
    }

    /**
     * Visit import declaration
     * Default: return default result
     */
    visitImportDeclaration(node: TSImportDeclaration): R {
        return this.defaultResult();
    }

    /**
     * Visit interface declaration
     * Default: visit all members
     */
    visitInterfaceDeclaration(node: TSInterfaceDeclaration): R {
        // Implementation nanti
        // Should visit all members and aggregate results
        return this.defaultResult();
    }

    /**
     * Visit type alias declaration
     * Default: visit type
     */
    visitTypeAliasDeclaration(node: TSTypeAliasDeclaration): R {
        // Implementation nanti
        // Should visit node.type
        return this.defaultResult();
    }

    /**
     * Visit function declaration
     * Default: visit parameters dan return type
     */
    visitFunctionDeclaration(node: TSFunctionDeclaration): R {
        // Implementation nanti
        // Should visit all parameters and return type
        return this.defaultResult();
    }

    /**
     * Visit property signature
     * Default: visit type
     */
    visitPropertySignature(node: TSPropertySignature): R {
        // Implementation nanti
        // Should visit node.type
        return this.defaultResult();
    }

    /**
     * Visit method signature
     * Default: visit parameters dan return type
     */
    visitMethodSignature(node: TSMethodSignature): R {
        // Implementation nanti
        // Should visit all parameters and return type
        return this.defaultResult();
    }

    /**
     * Visit type reference
     * Default: visit type arguments if any
     */
    visitTypeReference(node: TSTypeReference): R {
        // Implementation nanti
        // Should visit type arguments if present
        return this.defaultResult();
    }

    /**
     * Visit array type
     * Default: visit element type
     */
    visitArrayType(node: TSArrayType): R {
        // Implementation nanti
        // Should visit node.elementType
        return this.defaultResult();
    }

    /**
     * Visit union type
     * Default: visit all types
     */
    visitUnionType(node: TSUnionType): R {
        // Implementation nanti
        // Should visit all node.types and aggregate
        return this.defaultResult();
    }

    /**
     * Visit intersection type
     * Default: visit all types
     */
    visitIntersectionType(node: TSIntersectionType): R {
        // Implementation nanti
        // Should visit all node.types and aggregate
        return this.defaultResult();
    }

    /**
     * Visit export declaration
     * Default: return default result
     */
    visitExportDeclaration(node: TSExportDeclaration): R {
        return this.defaultResult();
    }

    /**
     * Visit comment node
     * Default: return default result
     */
    visitComment(node: TSComment): R {
        return this.defaultResult();
    }
}

/**
 * Helper function untuk visit array of nodes
 * 
 * @internal
 */
export function visitAll<T, R>(
    nodes: readonly T[],
    visitor: TSVisitor<R>,
    visitMethod: (node: T) => R
): readonly R[] {
    return nodes.map(visitMethod);
}
