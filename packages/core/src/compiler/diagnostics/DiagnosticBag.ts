/**
 * DiagnosticBag.ts
 * 
 * Immutable collection of diagnostics.
 */

import type { Diagnostic } from './Diagnostic';

/**
 * DiagnosticBag is an immutable collection of diagnostics.
 * 
 * Diagnostics are accumulated throughout compilation. Each operation
 * that reports a diagnostic returns a new DiagnosticBag with the
 * diagnostic added (copy-on-write semantics).
 * 
 * Usage:
 * ```typescript
 * let diagnostics = DiagnosticBag.createEmpty();
 * diagnostics = diagnostics.report({
 *   code: 'E0001',
 *   severity: 'error',
 *   message: 'Type mismatch'
 * });
 * const allDiagnostics = diagnostics.getDiagnostics();
 * ```
 */
export class DiagnosticBag {
    /**
     * Private constructor enforces factory methods.
     */
    private constructor(private readonly items: readonly Diagnostic[] = []) { }

    /**
     * Create an empty diagnostic bag.
     * 
     * @returns Empty diagnostic bag
     */
    public static createEmpty(): DiagnosticBag {
        return new DiagnosticBag([]);
    }

    /**
     * Report a diagnostic.
     * 
     * Returns a new DiagnosticBag with the diagnostic added.
     * The original bag is unchanged (immutable).
     * 
     * @param diagnostic - Diagnostic to report
     * @returns New diagnostic bag with diagnostic added
     */
    public report(diagnostic: Diagnostic): DiagnosticBag {
        return new DiagnosticBag([...this.items, diagnostic]);
    }

    /**
     * Get all diagnostics.
     * 
     * @returns Array of diagnostics
     */
    public getDiagnostics(): readonly Diagnostic[] {
        return this.items;
    }

    /**
     * Checks if any error-level diagnostics are recorded.
     */
    public hasErrors(): boolean {
        return this.items.some(d => d.severity === 'error');
    }

    /**
     * Returns all error-level diagnostics.
     */
    public getErrors(): readonly Diagnostic[] {
        return this.items.filter(d => d.severity === 'error');
    }

    /**
     * Returns all warning-level diagnostics.
     */
    public getWarnings(): readonly Diagnostic[] {
        return this.items.filter(d => d.severity === 'warning');
    }

    /**
     * Merges another diagnostic bag into a new immutable bag.
     */
    public merge(other: DiagnosticBag): DiagnosticBag {
        return new DiagnosticBag([...this.items, ...other.getDiagnostics()]);
    }

    /**
     * Fail-fast boundary gatekeeper: Throws CompilerValidationError if any errors exist.
     */
    public assertNoErrors(stageName: string = 'Validation'): void {
        const errors = this.getErrors();
        if (errors.length > 0) {
            const errorMessages = errors.map(e => `[${e.code}] ${e.message}`).join('\n');
            throw new CompilerValidationError(
                `[Verified Pipeline - ${stageName} Gatekeeper] Rejected ${errors.length} diagnostic error(s):\n${errorMessages}`,
                errors
            );
        }
    }
}

/**
 * Fail-fast compiler validation error representing rejected input at pipeline boundary.
 */
export class CompilerValidationError extends Error {
    public readonly diagnostics: readonly Diagnostic[];

    constructor(message: string, diagnostics: readonly Diagnostic[]) {
        super(message);
        this.name = 'CompilerValidationError';
        this.diagnostics = Object.freeze([...diagnostics]);
        Object.setPrototypeOf(this, CompilerValidationError.prototype);
    }
}
