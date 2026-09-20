/**
 * @file irTypes.ts
 * @description Common types, constants, and diagnostic collector for ContractIRBuilder sub-domains
 *
 * @module core/ir/domain/irTypes
 */

import type { TypeIR, TypeProjections, TransformFunction } from '../../types/ir';
import type { PropertyName, ModelName, TypeExpression } from '../../types/ir/nominalVocabulary';
import type { DescriptionText } from '../../types/upstream/valueObjects';
import type { SemanticType } from '../../compiler/types/SemanticType';

export const IR_VERSION = 'v1.0.0' as const;
export const GENERATOR_VERSION = '1.0.0' as const;

/**
 * Optimized ResourceFieldIR - complete TypeIR projections determined at the boundary
 */
export type OptimizedFieldSource =
    | { readonly type: 'computed'; readonly path: PropertyName }
    | { readonly type: 'model_column' | 'accessor' | 'method' | 'relation'; readonly path: PropertyName; readonly model: ModelName };

export interface OptimizedResourceFieldIR {
    readonly name: PropertyName;
    readonly transformedName: PropertyName;
    readonly type: TypeIR;
    readonly semanticType: SemanticType;
    readonly projections: TypeProjections;
    readonly transform: TransformFunction;
    readonly description: DescriptionText;
    readonly validation: readonly TypeExpression[];
    readonly source: OptimizedFieldSource;
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
