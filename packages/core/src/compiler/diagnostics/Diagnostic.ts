/**
 * Closed semantic diagnostic vocabulary.
 *
 * Diagnostics are compiler judgments, not loosely-shaped error objects.  The
 * absence of source evidence and the absence of a fix are represented by
 * explicit variants so downstream passes never need host-language optional
 * fields to interpret a diagnostic.
 */
import { FileSpan } from "../types/FileSpan";

export interface TextEdit {
    readonly span: FileSpan;
    readonly newText: string;
}

export interface DiagnosticFix {
    readonly description: string;
    readonly edits: readonly TextEdit[];
}

/** Closed derivation breadcrumb emitted with every diagnostic. */
export type DiagnosticTraceNode =
    | { readonly kind: 'stage'; readonly name: string }
    | { readonly kind: 'relation'; readonly name: string; readonly fact: string }
    | { readonly kind: 'rewrite'; readonly name: string; readonly rule: string };

export type DiagnosticTrace =
    | { readonly kind: 'empty' }
    | { readonly kind: 'path'; readonly nodes: readonly DiagnosticTraceNode[] };

/** Closed suggestion state: absence is semantic, never an optional field. */
export type DiagnosticSuggestion =
    | { readonly kind: 'none' }
    | { readonly kind: 'available'; readonly description: string; readonly fix: DiagnosticFix };

export type DiagnosticSuggestions =
    | { readonly kind: 'none' }
    | { readonly kind: 'many'; readonly items: readonly DiagnosticSuggestion[] };

export type DiagnosticSeverity = 'error' | 'warning';

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

/** Explicit source-evidence state for a diagnostic. */
export type DiagnosticLocation =
    | { readonly kind: 'none' }
    | { readonly kind: 'source'; readonly span: FileSpan };

/** Explicit remediation state for a diagnostic. */
export type DiagnosticFixState =
    | { readonly kind: 'none' }
    | { readonly kind: 'available'; readonly fix: DiagnosticFix };

export interface Diagnostic {
    readonly code: string;
    readonly severity: DiagnosticSeverity;
    readonly category: DiagnosticCategory;
    readonly message: string;
    readonly location: DiagnosticLocation;
    readonly fix: DiagnosticFixState;
    readonly trace: DiagnosticTrace;
    readonly suggestions: DiagnosticSuggestions;
}

export const DiagnosticLocation = Object.freeze({
    none: (): DiagnosticLocation => Object.freeze({ kind: 'none' as const }),
    source: (span: FileSpan): DiagnosticLocation => Object.freeze({ kind: 'source' as const, span })
});

export const DiagnosticFixState = Object.freeze({
    none: (): DiagnosticFixState => Object.freeze({ kind: 'none' as const }),
    available: (fix: DiagnosticFix): DiagnosticFixState => Object.freeze({ kind: 'available' as const, fix })
});

export interface DiagnosticInput {
    readonly code: string;
    readonly severity: DiagnosticSeverity;
    readonly category: DiagnosticCategory;
    readonly message: string;
    readonly location: DiagnosticLocation;
    readonly fix: DiagnosticFixState;
    readonly trace: DiagnosticTrace;
    readonly suggestions: DiagnosticSuggestions;
}

export const createDiagnostic = (input: DiagnosticInput): Diagnostic => Object.freeze({
    code: input.code,
    severity: input.severity,
    category: input.category,
    message: input.message,
    location: input.location,
    fix: input.fix,
    trace: input.trace,
    suggestions: input.suggestions
});
