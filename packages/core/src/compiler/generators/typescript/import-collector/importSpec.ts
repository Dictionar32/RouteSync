/**
 * Import Specification Types.
 *
 * @module compiler/generators/typescript/import-collector
 */

/**
 * Specification for a single import source
 */
export interface ImportSpec {
    /** Source path for import (e.g., './types', '../models/User') */
    readonly source: string;

    /** Set of named imports from this source */
    readonly named: ReadonlySet<string>;

    /** Default import name (e.g., import React from 'react') */
    readonly defaultImport?: string;

    /** Namespace import (e.g., import * as types from './types') */
    readonly namespaceImport?: string;

    /** Whether import is type-only (import type { ... }) */
    readonly isTypeOnly: boolean;
}

/**
 * Internal mutable specification for collecting imports
 */
export interface MutableImportSpec {
    source: string;
    named: Set<string>;
    defaultImport?: string;
    namespaceImport?: string;
    isTypeOnly: boolean;
}

/**
 * Converts a mutable import spec to an immutable frozen ImportSpec
 */
export function freezeImportSpec(mutable: MutableImportSpec): ImportSpec {
    const sortedNamed = Array.from(mutable.named).sort();
    const spec: ImportSpec = {
        source: mutable.source,
        named: new Set(sortedNamed) as ReadonlySet<string>,
        defaultImport: mutable.defaultImport,
        namespaceImport: mutable.namespaceImport,
        isTypeOnly: mutable.isTypeOnly
    };
    return Object.freeze(spec);
}
