/**
 * CompilationContext.ts
 * 
 * Defines the compilation context that provides environment and configuration
 * for compiler pass execution.
 */

import type { DiagnosticBag } from '../diagnostics/DiagnosticBag';
import type { CompilerFingerprint } from '../fingerprint/Fingerprint';
import { DiagnosticBag as DiagnosticBagImpl } from '../diagnostics/DiagnosticBag';

/**
 * Compiler options controlling compilation behavior.
 */
export interface CompilerOptions {
    /**
     * Enable watch mode for incremental compilation.
     */
    readonly watch: boolean;

    /**
     * Enable strict type checking and validation.
     */
    readonly strict: boolean;

    /**
     * Compiler version for fingerprinting.
     */
    readonly compilerVersion?: string;

    /**
     * Parser version for fingerprinting.
     */
    readonly parserVersion?: string;

    /**
     * PHP version for fingerprinting.
     */
    readonly phpVersion?: string;

    /**
     * Framework version (e.g., Laravel version) for fingerprinting.
     */
    readonly frameworkVersion?: string;

    /**
     * Target backend (e.g., 'typescript', 'javascript').
     */
    readonly targetBackend?: string;

    /**
     * Feature flags controlling optional compiler behaviors.
     */
    readonly featureFlags?: ReadonlyMap<string, boolean>;
}

/**
 * File snapshot for incremental compilation.
 */
export interface FileSnapshot {
    readonly filePath: string;
    readonly content: string;
    readonly hash: string;
}

/**
 * Virtual file system interface.
 * Abstracts file I/O operations for testing and flexibility.
 */
export interface VirtualFileSystem {
    /**
     * Read file content.
     */
    readFile(path: string): string;

    /**
     * Write file content.
     */
    writeFile(path: string, content: string): void;

    /**
     * Take snapshot of current file system state.
     */
    snapshot(): readonly FileSnapshot[];
}

/**
 * CompilationContext encapsulates the environment for compiler pass execution.
 * 
 * Provides:
 * - Diagnostic collection
 * - File system abstraction
 * - Compiler options and configuration
 * - Fingerprinting for caching and invalidation
 */
export class CompilationContext {
    constructor(
        public readonly diagnostics: DiagnosticBag,
        public readonly fileSystem: VirtualFileSystem,
        public readonly options: CompilerOptions
    ) { }

    /**
     * Get compiler fingerprint for caching and invalidation.
     * 
     * The fingerprint captures all factors that affect compilation output:
     * - Compiler/parser/PHP/framework versions
     * - Target backend
     * - Strict mode setting
     * - Feature flags
     * 
     * @returns Compiler fingerprint
     */
    public getFingerprint(): CompilerFingerprint {
        return {
            compilerVersion: this.options.compilerVersion || '6.1.0',
            parserVersion: this.options.parserVersion || '1.0.0',
            phpVersion: this.options.phpVersion || '8.2.0',
            frameworkVersion: this.options.frameworkVersion || '10.0.0',
            targetBackend: this.options.targetBackend || 'typescript',
            strictMode: this.options.strict,
            featureFlags: this.options.featureFlags || new Map()
        };
    }

    /**
     * Create default compilation context for testing or simple use cases.
     * 
     * @returns Default compilation context
     */
    public static default(): CompilationContext {
        return new CompilationContext(
            DiagnosticBagImpl.createEmpty(),
            {
                readFile: () => '',
                writeFile: () => { },
                snapshot: () => []
            },
            { watch: false, strict: true }
        );
    }
}
