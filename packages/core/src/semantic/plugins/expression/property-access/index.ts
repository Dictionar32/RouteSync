/**
 * Property Access Sub-Domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module semantic/plugins/expression/property-access
 */

import type { SemanticResolution, TraceNode } from '../../../../types/contract';
import type { ResolutionContext, ResolverMeta, ModelNode } from '../../../types';
import { tryResolveSpecialPropertyAccess } from './specialAccessHandler';
import {
    isModelNode,
    resolveTargetModelForPropertyAccess
} from './targetModelResolver';

export { tryResolveSpecialPropertyAccess } from './specialAccessHandler';
export { isModelNode, resolveTargetModelForPropertyAccess } from './targetModelResolver';

export function resolvePropertyAccess(
    meta: ResolverMeta,
    context: ResolutionContext,
    currentModel?: ModelNode
): SemanticResolution {
    const prop = meta.property || '';
    let targetModel: unknown = currentModel;
    const trace: TraceNode[] = [];

    if (meta.target) {
        const targetRes = context.kernel.resolve(meta.target, currentModel);
        if (targetRes.trace) trace.push(...targetRes.trace);

        const specialRes = tryResolveSpecialPropertyAccess(prop, meta, targetRes, trace);
        if (specialRes) {
            return specialRes;
        }

        const modelLookup = resolveTargetModelForPropertyAccess(meta, context, targetRes, trace);
        if (modelLookup.errorResolution) {
            return modelLookup.errorResolution;
        }
        if (modelLookup.targetModel) {
            targetModel = modelLookup.targetModel;
        }
    }

    let targetModelName: string | undefined = undefined;
    if (isModelNode(targetModel)) {
        targetModelName = targetModel.name;
    } else if (isModelNode(currentModel)) {
        targetModelName = currentModel.name;
    }

    const innerRes = context.kernel.resolve(
        { kind: 'model_column', model: targetModelName || '', column: prop },
        (targetModel || currentModel) as ModelNode
    );
    if (innerRes.trace) trace.push(...innerRes.trace);

    const isNullsafe = meta.kind === 'nullsafe_property_access';
    return {
        status: innerRes.status,
        type: innerRes.type,
        model: innerRes.model,
        resource: innerRes.resource,
        collection: innerRes.collection,
        paginated: innerRes.paginated,
        nullable: isNullsafe ? true : innerRes.nullable,
        confidence: innerRes.confidence,
        boundAst: innerRes.boundAst,
        trace
    };
}
