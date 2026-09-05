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
 * Diagnostic category ADT discriminator.
 */
export const DiagnosticCategory = Object.freeze({
    Syntax: 'syntax',
    Schema: 'schema',
    TypeMismatch: 'type_mismatch',
    UnresolvedReference: 'unresolved_reference',
    InvariantViolation: 'invariant_violation'
} as const);

export type DiagnosticCategory = typeof DiagnosticCategory[keyof typeof DiagnosticCategory];

export interface DiagnosticCategorySpecification<C extends DiagnosticCategory = DiagnosticCategory> {
    readonly category: C;
    readonly isFatal: boolean;
    readonly description: string;
}

export type DiagnosticCategoryRegistry = {
    readonly [C in DiagnosticCategory]: DiagnosticCategorySpecification<C>;
};

export const DIAGNOSTIC_CATEGORY_REGISTRY: DiagnosticCategoryRegistry = Object.freeze({
    [DiagnosticCategory.Syntax]: {
        category: DiagnosticCategory.Syntax,
        isFatal: true,
        description: 'PHP or schema syntax error preventing lexical analysis'
    },
    [DiagnosticCategory.Schema]: {
        category: DiagnosticCategory.Schema,
        isFatal: true,
        description: 'Validation schema structural violation'
    },
    [DiagnosticCategory.TypeMismatch]: {
        category: DiagnosticCategory.TypeMismatch,
        isFatal: false,
        description: 'Type incompatibility between model, cast, and route'
    },
    [DiagnosticCategory.UnresolvedReference]: {
        category: DiagnosticCategory.UnresolvedReference,
        isFatal: false,
        description: 'Missing reference to controller, model, or resource'
    },
    [DiagnosticCategory.InvariantViolation]: {
        category: DiagnosticCategory.InvariantViolation,
        isFatal: true,
        description: 'Violation of verified data pipeline invariants'
    }
});

export interface DiagnosticCategoryVisitor<R> {
    readonly syntax: () => R;
    readonly schema: () => R;
    readonly type_mismatch: () => R;
    readonly unresolved_reference: () => R;
    readonly invariant_violation: () => R;
}

export function matchDiagnosticCategory<R>(
    category: DiagnosticCategory,
    visitor: DiagnosticCategoryVisitor<R>
): R {
    return visitor[category]();
}

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
     * Category classification.
     */
    readonly category?: DiagnosticCategory;

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
