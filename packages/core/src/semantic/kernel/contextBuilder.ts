/**
 * contextBuilder.ts
 *
 * Context assembly and type guards for SemanticResolutionKernel.
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
    models: ModelNode[],
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
