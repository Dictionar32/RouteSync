/**
 * Closed, immutable diagnostic relation.
 *
 * Diagnostics are semantic facts. The bag is a value object rather than a
 * mutable/class-backed container, so diagnostic accumulation has the same
 * algebraic shape as the compiler's other relation stores.
 */
import type { Diagnostic } from './Diagnostic';
import { relationNotEqual, relationEqual, relationGate, relationProject, relationSelect } from '../../semantic/foundation/relationalSequence';

export type DiagnosticGate =
    | { readonly kind: 'accepted'; readonly stageName: string; readonly diagnostics: readonly Diagnostic[] }
    | { readonly kind: 'rejected'; readonly stageName: string; readonly diagnostics: readonly Diagnostic[] };

export interface DiagnosticBag {
    readonly kind: 'diagnostic_bag';
    readonly items: readonly Diagnostic[];
    readonly report: (diagnostic: Diagnostic) => DiagnosticBag;
    readonly getDiagnostics: () => readonly Diagnostic[];
    readonly hasErrors: () => boolean;
    readonly getErrors: () => readonly Diagnostic[];
    readonly getWarnings: () => readonly Diagnostic[];
    readonly merge: (other: DiagnosticBag) => DiagnosticBag;
    readonly evaluateGate: (stageName: string) => DiagnosticGate;
    readonly assertNoErrors: (stageName: string) => void;
}

const createDiagnosticBag = (items: readonly Diagnostic[]): DiagnosticBag => {
    const frozenItems = Object.freeze([...items]);
    const report = (diagnostic: Diagnostic): DiagnosticBag => createDiagnosticBag([...frozenItems, diagnostic]);
    const getDiagnostics = (): readonly Diagnostic[] => frozenItems;
    const getErrors = (): readonly Diagnostic[] => Object.freeze(relationSelect(frozenItems, diagnostic => relationEqual(diagnostic.severity, 'error')));
    const getWarnings = (): readonly Diagnostic[] => Object.freeze(relationSelect(frozenItems, diagnostic => relationEqual(diagnostic.severity, 'warning')));
    const hasErrors = (): boolean => relationNotEqual(getErrors().length, 0);
    const merge = (other: DiagnosticBag): DiagnosticBag => createDiagnosticBag([...frozenItems, ...other.items]);
    const evaluateGate = (stageName: string): DiagnosticGate => {
        const errors = getErrors();
        return relationGate(
            relationEqual(errors.length, 0),
            () => Object.freeze({ kind: 'accepted' as const, stageName, diagnostics: frozenItems }),
            () => Object.freeze({ kind: 'rejected' as const, stageName, diagnostics: errors }),
        );
    };
    const assertNoErrors = (stageName: string): void => {
        const gate = evaluateGate(stageName);
        relationGate(
            relationEqual(gate.kind, 'accepted'),
            () => {},
            () => {
                const diagnostics = getErrors();
                const errorMessages = relationProject(diagnostics, error => `[${error.code}] ${error.message}`).join('\n');
                throw createCompilerValidationError(
                    `[Verified Pipeline - ${stageName} Gatekeeper] Rejected ${diagnostics.length} diagnostic error(s):\n${errorMessages}`,
                    diagnostics,
                );
            },
        );
    };
    return Object.freeze({ kind: 'diagnostic_bag' as const, items: frozenItems, report, getDiagnostics, hasErrors, getErrors, getWarnings, merge, evaluateGate, assertNoErrors });
};

export const DiagnosticBag = Object.freeze({
    createEmpty: (): DiagnosticBag => createDiagnosticBag([]),
    from: (items: readonly Diagnostic[]): DiagnosticBag => createDiagnosticBag(items),
});

export interface CompilerValidationError extends Error {
    readonly diagnostics: readonly Diagnostic[];
}

const createCompilerValidationError = (message: string, diagnostics: readonly Diagnostic[]): CompilerValidationError => {
    const error = Error(message) as CompilerValidationError;
    Object.defineProperties(error, {
        name: { value: 'CompilerValidationError', enumerable: true },
        diagnostics: { value: Object.freeze([...diagnostics]), enumerable: true },
    });
    return error;
};
