/**
 * @file irTypes.ts
 * @description Common types, constants, and diagnostic collector for ContractIRBuilder sub-domains
 *
 * @module core/ir/domain/irTypes
 */

import type { TypeIR, ValidationRules } from '../../types/ir';
import type { ResolvedSemanticType } from '../../types/ir/resolvedSemanticTypes';

export const IR_VERSION = 'v1.0.0' as const;
export const GENERATOR_VERSION = '1.0.0' as const;

/**
 * Projection hints for emitters - lightweight metadata instead of duplicated TypeIR trees
 */
export interface ProjectionHints {
    /** Form fields should treat nullable as optional */
    readonly formNullableAsOptional?: boolean;
    /** Field emitters don't need modifiers */
    readonly stripModifiers?: boolean;
    /** Mapper needs runtime null checks */
    readonly includeRuntimeChecks?: boolean;
}

/**
 * Optimized ResourceFieldIR - single TypeIR + hints instead of 6 projections
 */
export interface OptimizedResourceFieldIR {
    readonly name: string;
    readonly transformedName: string;
    readonly type: TypeIR;
    readonly semanticType: ResolvedSemanticType;
    readonly hints: ProjectionHints;
    readonly description?: string;
    readonly validation?: ValidationRules;
    readonly source?: {
        readonly type: 'model_column' | 'accessor' | 'method' | 'computed' | 'relation';
        readonly path: string;
        readonly model?: string;
    };
}

/**
 * Diagnostic collector - replace direct console logging
 */
export class DiagnosticCollector {
    private diagnostics: Array<{ level: 'info' | 'warn' | 'error'; message: string; context?: unknown }> = [];

    info(message: string, context?: unknown): void {
        this.diagnostics.push({ level: 'info', message, context });
    }

    warn(message: string, context?: unknown): void {
        this.diagnostics.push({ level: 'warn', message, context });
    }

    error(message: string, context?: unknown): void {
        this.diagnostics.push({ level: 'error', message, context });
    }

    getDiagnostics(): typeof this.diagnostics {
        return [...this.diagnostics];
    }

    clear(): void {
        this.diagnostics = [];
    }
}
