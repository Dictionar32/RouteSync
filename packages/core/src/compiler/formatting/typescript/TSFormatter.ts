/**
 * @file TSFormatter.ts
 * @description Format and optimize TypeScript Target AST
 * 
 * Formatter Phase (Otak/Brain - Optimization):
 * - Input: TSFile (unformatted Target AST)
 * - Output: TSFile (formatted Target AST)
 * - Pure AST transformation (no strings)
 * - Immutable operations (return new AST)
 */

import { TSFile } from '../../target/typescript/nodes/TSFile';
import type { TSImportDeclaration } from '../../target/typescript/nodes/TSImportDeclaration';
import type { TSInterfaceDeclaration } from '../../target/typescript/nodes/TSInterfaceDeclaration';
import type { TSTypeAliasDeclaration } from '../../target/typescript/nodes/TSTypeAliasDeclaration';

/**
 * Type union untuk semua declaration types
 */
type TSDeclaration = TSInterfaceDeclaration | TSTypeAliasDeclaration;

/**
 * Sorting strategy untuk imports
 */
type ImportSortStrategy = 'alphabetical' | 'grouped' | 'none';

/**
 * Sorting strategy untuk declarations
 */
type DeclarationSortStrategy = 'type-first' | 'alphabetical' | 'none';

/**
 * Formatter configuration
 */
interface TSFormatterConfig {
    readonly importSorting: ImportSortStrategy;
    readonly declarationSorting: DeclarationSortStrategy;
    readonly groupTypeImports: boolean;
}

/**
 * Default formatter configuration
 */
const DEFAULT_CONFIG: TSFormatterConfig = {
    importSorting: 'grouped',
    declarationSorting: 'type-first',
    groupTypeImports: true
};

/**
 * TypeScript AST Formatter
 * 
 * Implements compiler-grade AST optimization and organization.
 * Works on AST structure, not strings.
 * 
 * Note: Tidak menggunakan IFormatter<TSFile> generic constraint karena
 * TSFile uses TSVisitor (TS-specific) bukan ITargetVisitor (generic).
 * TSFormatter adalah layer spesifik untuk TypeScript AST.
 */
export class TSFormatter {
    private readonly config: TSFormatterConfig;

    constructor(config: Partial<TSFormatterConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        Object.freeze(this.config);
    }
    /**
     * Format TypeScript AST
     * 
     * Main entry point - returns new formatted AST (immutable)
     */
    public format(file: TSFile): TSFile {
        // Sort imports berdasarkan strategy
        const sortedImports = this.formatImports(file.imports);

        // Sort declarations berdasarkan strategy
        const sortedDeclarations = this.formatDeclarations(file.declarations);

        // Return new TSFile dengan formatted content
        return new TSFile(sortedImports, sortedDeclarations);
    }

    /**
     * Format imports: sort dan group
     */
    private formatImports(imports: readonly TSImportDeclaration[]): TSImportDeclaration[] {
        if (this.config.importSorting === 'none') {
            return [...imports];
        }

        // First, sort imports
        let sorted = this.sortImports([...imports]);

        // Then, group if configured
        if (this.config.groupTypeImports) {
            sorted = this.groupImportsByType(sorted);
        }

        return sorted;
    }

    /**
     * Sort imports berdasarkan configured strategy
     */
    private sortImports(imports: TSImportDeclaration[]): TSImportDeclaration[] {
        switch (this.config.importSorting) {
            case 'alphabetical':
                return this.sortImportsAlphabetically(imports);

            case 'grouped':
                return this.sortImportsGrouped(imports);

            case 'none':
                return imports;
        }
    }

    /**
     * Sort imports alphabetically by source path
     */
    private sortImportsAlphabetically(imports: TSImportDeclaration[]): TSImportDeclaration[] {
        return imports.sort((a, b) => a.from.localeCompare(b.from));
    }

    /**
     * Sort imports grouped by type and externality
     */
    private sortImportsGrouped(imports: TSImportDeclaration[]): TSImportDeclaration[] {
        return imports.sort((a, b) => {
            // 1. Type imports first
            if (a.isType && !b.isType) return -1;
            if (!a.isType && b.isType) return 1;

            // 2. External before local
            const aIsExternal = !a.from.startsWith('.');
            const bIsExternal = !b.from.startsWith('.');

            if (aIsExternal && !bIsExternal) return -1;
            if (!aIsExternal && bIsExternal) return 1;

            // 3. Alphabetically within groups
            return a.from.localeCompare(b.from);
        });
    }

    /**
     * Group imports by type vs value
     */
    private groupImportsByType(imports: TSImportDeclaration[]): TSImportDeclaration[] {
        const typeImports: TSImportDeclaration[] = [];
        const valueImports: TSImportDeclaration[] = [];

        for (const imp of imports) {
            if (imp.isType) {
                typeImports.push(imp);
            } else {
                valueImports.push(imp);
            }
        }

        // Type imports first, then value imports
        return [...typeImports, ...valueImports];
    }

    /**
     * Format declarations: sort berdasarkan strategy
     */
    private formatDeclarations(declarations: readonly TSDeclaration[]): TSDeclaration[] {
        if (this.config.declarationSorting === 'none') {
            return [...declarations];
        }

        return this.sortDeclarations([...declarations]);
    }

    /**
     * Sort declarations berdasarkan configured strategy
     */
    private sortDeclarations(declarations: TSDeclaration[]): TSDeclaration[] {
        switch (this.config.declarationSorting) {
            case 'type-first':
                return this.sortDeclarationsTypeFirst(declarations);

            case 'alphabetical':
                return this.sortDeclarationsAlphabetically(declarations);

            case 'none':
                return declarations;
        }
    }

    /**
     * Sort declarations: interfaces first, then type aliases, alphabetically within groups
     */
    private sortDeclarationsTypeFirst(declarations: TSDeclaration[]): TSDeclaration[] {
        return declarations.sort((a, b) => {
            // 1. Interfaces before type aliases
            if (a.kind === 'interface-declaration' && b.kind !== 'interface-declaration') {
                return -1;
            }
            if (a.kind !== 'interface-declaration' && b.kind === 'interface-declaration') {
                return 1;
            }

            // 2. Alphabetically by name within same type
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Sort declarations purely alphabetically
     */
    private sortDeclarationsAlphabetically(declarations: TSDeclaration[]): TSDeclaration[] {
        return declarations.sort((a, b) => a.name.localeCompare(b.name));
    }
}
