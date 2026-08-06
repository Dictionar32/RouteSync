/**
 * @file ImportCollector.ts
 * @description Collects and manages import requirements during code generation
 * 
 * Phase 3 - Day 1, Task 1.2
 * 
 * ImportCollector tracks all external type references that need imports.
 * Handles deduplication, sorting, and conversion to TSImportDeclaration nodes.
 */

/**
 * Specification for a single import source
 * Contains all named imports, default import, and namespace import for one source
 */
export interface ImportSpec {
    /** Source path for import (e.g., './types', '../models/User') */
    readonly source: string;

    /** Set of named imports dari source ini */
    readonly named: ReadonlySet<string>;

    /** Default import name (e.g., import React from 'react') */
    readonly defaultImport?: string;

    /** Namespace import (e.g., import * as types from './types') */
    readonly namespaceImport?: string;

    /** Whether import is type-only (import type { ... }) */
    readonly isTypeOnly: boolean;
}

/**
 * Internal mutable version untuk building ImportSpec
 */
interface MutableImportSpec {
    source: string;
    named: Set<string>;
    defaultImport?: string;
    namespaceImport?: string;
    isTypeOnly: boolean;
}

/**
 * ImportCollector - Collects import requirements during generation
 * 
 * Responsibilities:
 * - Track all named imports per source
 * - Deduplicate imports from same source
 * - Sort imports consistently
 * - Convert to TSImportDeclaration nodes
 * 
 * @example
 * ```typescript
 * const collector = new ImportCollector();
 * 
 * // Add named imports
 * collector.addNamedImport('User', './types');
 * collector.addNamedImport('Post', './types');
 * collector.addNamedImport('Product', './models');
 * 
 * // Get sorted, deduplicated imports
 * const imports = collector.getImports();
 * // Returns:
 * // [
 * //   { source: './models', named: Set(['Product']), isTypeOnly: true },
 * //   { source: './types', named: Set(['Post', 'User']), isTypeOnly: true }
 * // ]
 * ```
 */
export class ImportCollector {
    /**
     * Internal storage: source → import spec
     * Uses Map untuk efficient lookup and deduplication
     */
    private imports = new Map<string, MutableImportSpec>();

    /**
     * Add named import requirement
     * 
     * @param name - Name of type/value to import
     * @param source - Source path
     * @param isTypeOnly - Whether import is type-only (default: true)
     * 
     * @example
     * ```typescript
     * collector.addNamedImport('User', './types');
     * collector.addNamedImport('useState', 'react', false); // value import
     * ```
     */
    public addNamedImport(name: string, source: string, isTypeOnly: boolean = true): void {
        // Get or create import spec untuk source ini
        let spec = this.imports.get(source);

        if (!spec) {
            spec = {
                source,
                named: new Set(),
                isTypeOnly
            };
            this.imports.set(source, spec);
        }

        // Add named import (Set handles deduplication)
        spec.named.add(name);
    }

    /**
     * Add default import requirement
     * 
     * @param defaultName - Name untuk default import
     * @param source - Source path
     * @param isTypeOnly - Whether import is type-only (default: false)
     * 
     * @example
     * ```typescript
     * collector.addDefaultImport('React', 'react');
     * ```
     */
    public addDefaultImport(defaultName: string, source: string, isTypeOnly: boolean = false): void {
        let spec = this.imports.get(source);

        if (!spec) {
            spec = {
                source,
                named: new Set(),
                defaultImport: defaultName,
                isTypeOnly
            };
            this.imports.set(source, spec);
        } else {
            // Update existing spec dengan default import
            spec.defaultImport = defaultName;
        }
    }

    /**
     * Add namespace import requirement
     * 
     * @param namespaceName - Name untuk namespace
     * @param source - Source path
     * @param isTypeOnly - Whether import is type-only (default: false)
     * 
     * @example
     * ```typescript
     * collector.addNamespaceImport('types', './types');
     * // import * as types from './types'
     * ```
     */
    public addNamespaceImport(namespaceName: string, source: string, isTypeOnly: boolean = false): void {
        let spec = this.imports.get(source);

        if (!spec) {
            spec = {
                source,
                named: new Set(),
                namespaceImport: namespaceName,
                isTypeOnly
            };
            this.imports.set(source, spec);
        } else {
            // Update existing spec dengan namespace import
            spec.namespaceImport = namespaceName;
        }
    }

    /**
     * Get all collected imports as immutable specs
     * 
     * Returns sorted array of ImportSpec:
     * 1. Sorted by source path alphabetically
     * 2. Named imports sorted within each spec
     * 3. All specs are frozen (immutable)
     * 
     * @returns Array of import specifications
     */
    public getImports(): readonly ImportSpec[] {
        const specs: ImportSpec[] = [];

        // Convert mutable specs to immutable
        for (const mutableSpec of this.imports.values()) {
            // Sort named imports alphabetically
            const sortedNamed = Array.from(mutableSpec.named).sort();

            const spec: ImportSpec = {
                source: mutableSpec.source,
                named: new Set(sortedNamed) as ReadonlySet<string>,
                defaultImport: mutableSpec.defaultImport,
                namespaceImport: mutableSpec.namespaceImport,
                isTypeOnly: mutableSpec.isTypeOnly
            };

            // Freeze untuk immutability
            Object.freeze(spec);
            specs.push(spec);
        }

        // Sort by source path
        specs.sort((a, b) => a.source.localeCompare(b.source));

        return specs;
    }

    /**
     * Check if import already collected
     * 
     * @param name - Name to check
     * @param source - Source path
     * @returns true if import already collected
     */
    public has(name: string, source: string): boolean {
        const spec = this.imports.get(source);
        return spec ? spec.named.has(name) : false;
    }

    /**
     * Clear all collected imports
     * Useful untuk resetting collector between generations
     */
    public clear(): void {
        this.imports.clear();
    }

    /**
     * Get number of import sources
     * @returns Number of unique sources
     */
    public get sourceCount(): number {
        return this.imports.size;
    }

    /**
     * Get total number of named imports
     * @returns Total named imports across all sources
     */
    public get namedCount(): number {
        let count = 0;
        for (const spec of this.imports.values()) {
            count += spec.named.size;
        }
        return count;
    }
}
