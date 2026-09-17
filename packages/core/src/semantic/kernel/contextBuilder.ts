/**
 * contextBuilder.ts
 *
 * Context assembly and type guards for SemanticResolutionKernel.
 *
 * @module core/semantic/kernel
 */

import type { SemanticResolution } from '../../types/domain/semanticResolution';
import type { FieldNode } from '../../types/field';
import type {
    ModelNode,
    SemanticResolutionKernelContract,
    CycleDetector,
    ResolutionContext
} from '../types';
import type { SymbolTable } from '../SymbolTable';

export function buildResolutionContext(
    models: ModelNode[],
    resources: readonly { readonly name: string }[],
    kernel: SemanticResolutionKernelContract,
    cycleDetector: CycleDetector,
    symbolTable: SymbolTable,
    contextModel?: ModelNode
): ResolutionContext {
    return Object.freeze({
        models,
        resources,
        kernel,
        cycleDetector,
        symbolTable,
        contextModel,
        fileName: 'global',
        assignments: contextModel === undefined ? Object.freeze({}) : contextModel.assignments,
        resolvedAssignments: contextModel === undefined ? Object.freeze({}) : contextModel.resolvedAssignments,
    });
}
