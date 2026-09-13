/**
 * contextBuilder.ts
 *
 * Context assembly and type guards for SemanticResolutionKernel.
 *
 * @module core/semantic/kernel
 */

import type { SemanticResolution } from '../../types/contract';
import type { FieldNode } from '../../types/field';
import { isObject, hasProperty, isString } from '../../utils/type-guards';
import type {
    ModelNode,
    SemanticResolutionKernelContract,
    CycleDetector,
    ResolutionContext
} from '../types';
import type { SymbolTable } from '../SymbolTable';

export function isFieldNodeRecord(value: unknown): value is Record<string, FieldNode> {
    if (!isObject(value)) return false;
    return Object.values(value).every(val =>
        isObject(val) &&
        hasProperty(val, 'kind') &&
        isString(val.kind)
    );
}

export function isSemanticResolutionRecord(value: unknown): value is Record<string, SemanticResolution> {
    if (!isObject(value)) return false;
    return Object.values(value).every(val =>
        isObject(val) &&
        hasProperty(val, 'status') &&
        hasProperty(val, 'type') &&
        hasProperty(val, 'confidence') &&
        hasProperty(val, 'trace')
    );
}

export function buildResolutionContext(
    models: ModelNode[],
    resources: unknown[],
    kernel: SemanticResolutionKernelContract,
    cycleDetector: CycleDetector,
    symbolTable: SymbolTable,
    contextModel?: unknown
): ResolutionContext {
    const context: ResolutionContext = {
        models,
        resources,
        kernel,
        cycleDetector,
        symbolTable,
        contextModel
    };

    if (contextModel && isObject(contextModel)) {
        if (hasProperty(contextModel, 'fileName') && isString(contextModel.fileName)) {
            context.fileName = contextModel.fileName;
        }
        if (hasProperty(contextModel, 'assignments') && isFieldNodeRecord(contextModel.assignments)) {
            context.assignments = contextModel.assignments;
        }
        if (hasProperty(contextModel, 'resolvedAssignments') && isSemanticResolutionRecord(contextModel.resolvedAssignments)) {
            context.resolvedAssignments = contextModel.resolvedAssignments;
        }
    }

    return context;
}
