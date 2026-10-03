/**
 * contextBuilder.ts
 *
 * Context assembly for SemanticResolutionKernel.
 *
 * Canonical semantic records own their discriminated ADTs; this module only
 * assembles the resolution context and does not publish parallel record guards.
 *
 * @module core/semantic/kernel
 */

import type {
    ModelNode,
    SemanticResolutionKernelContract,
    CycleDetector,
    ResolutionContext
} from '../types';
import type { SymbolTable } from '../SymbolTable';
import type { ResolutionScope } from '../resolutionScope';

export function buildResolutionContext(
    models: readonly ModelNode[],
    resources: readonly { readonly name: string }[],
    kernel: SemanticResolutionKernelContract,
    cycleDetector: CycleDetector,
    symbolTable: SymbolTable,
    scope: ResolutionScope
): ResolutionContext {
    return Object.freeze({
        models,
        resources,
        kernel,
        cycleDetector,
        symbolTable,
        fileName: 'global',
        scope,
    });
}
