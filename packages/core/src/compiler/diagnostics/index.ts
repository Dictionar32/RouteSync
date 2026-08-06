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
    Diagnostic,
    DiagnosticSeverity,
    DiagnosticFix,
    TextEdit,
} from './Diagnostic';

export { DiagnosticBag } from './DiagnosticBag';
