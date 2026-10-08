/**
 * Compiler Diagnostics Module
 * 
 * This module provides diagnostic types and collection for the RouteSync compiler.
 * Diagnostics include errors, warnings, and code fix suggestions.
 * 
 * Key components:
 * - Diagnostic: Error/warning representation
 * - DiagnosticBag: Immutable diagnostic collection
 * - TextEdit: Code fix representation
 * - DiagnosticFix: Code fix with edits
 * - FileSpan: Source location
 */

export {
    DiagnosticCategory,
    DIAGNOSTIC_CATEGORY_REGISTRY,
    matchDiagnosticCategory,
    DiagnosticLocation,
    DiagnosticFixState,
    createDiagnostic,
} from './Diagnostic';

export type {
    Diagnostic,
    DiagnosticTraceNode,
    DiagnosticTrace,
    DiagnosticSuggestion,
    DiagnosticSuggestions,
    DiagnosticSeverity,
    DiagnosticFix,
    TextEdit,
    DiagnosticCategorySpecification,
    DiagnosticCategoryRegistry,
    DiagnosticCategoryVisitor,
    DiagnosticInput,
} from './Diagnostic';

export { DiagnosticBag } from './DiagnosticBag';
export type { CompilerValidationError, DiagnosticBag as DiagnosticBagContract, DiagnosticGate } from './DiagnosticBag';

