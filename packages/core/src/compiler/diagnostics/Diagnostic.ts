/**
 * Diagnostic.ts
 * 
 * Defines diagnostic types for compiler errors, warnings, and code fixes.
 */

/**
 * File span representing a location in source code.
 */
import { FileSpan } from "../types/FileSpan";

/**
 * Text edit for code fix.
 */
export interface TextEdit {
    readonly span: FileSpan;
    readonly newText: string;
}

/**
 * Code fix suggestion for a diagnostic.
 */
export interface DiagnosticFix {
    readonly description: string;
    readonly edits: readonly TextEdit[];
}

/**
 * Diagnostic severity level.
 */
export type DiagnosticSeverity = 'error' | 'warning';

/**
 * Compiler diagnostic.
 * 
 * Represents an error, warning, or informational message produced during
 * compilation. Optionally includes location information and code fixes.
 */
export interface Diagnostic {
    /**
     * Diagnostic code (e.g., 'E0001', 'W0042').
     */
    readonly code: string;

    /**
     * Severity level.
     */
    readonly severity: DiagnosticSeverity;

    /**
     * Human-readable diagnostic message.
     */
    readonly message: string;

    /**
     * Optional source location.
     */
    readonly location?: FileSpan;

    /**
     * Optional code fix suggestion.
     */
    readonly fix?: DiagnosticFix;
}
