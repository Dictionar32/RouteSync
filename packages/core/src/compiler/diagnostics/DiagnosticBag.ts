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
}
