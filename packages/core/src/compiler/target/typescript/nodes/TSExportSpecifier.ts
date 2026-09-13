/**
 * @file TSExportSpecifier.ts
 * @description Export specifier node for named exports
 *
 * Example: export { User }; export { User as UserType };
 *
 * @module compiler/target/typescript/nodes
 */

import type { TSNode, SourceSpan, TSNodeKind } from './TSNode';

/**
 * Export specifier for named exports
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
