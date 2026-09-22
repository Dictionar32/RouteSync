import type { SemanticResolution, SemanticTraceNode } from '../../types/domain/semanticResolution';
import { unknownResolution, resolutionLabel } from '../semanticResolutionSupport';
import type { ResolverPlugin, ResolutionContext, ResolverMeta, ModelNode, ModelAccessor } from '../types';
import { modelScope } from '../resolutionScope';
import { resolveInScope } from '../kernel/resolveInScope';

export class AccessorResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return !!(meta && meta.kind === 'model_accessor');
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    if (meta.kind !== 'model_accessor') {
      return unknownResolution('AccessorResolver', 'Unsupported accessor metadata', 'model_accessor', 'invalid_boundary_input');
    }
    const symbol = context.symbolTable.get(meta.model);
    if (!symbol) {
      return unknownResolution('AccessorResolver', `Model ${meta.model} not found in manifest`, meta.model, 'unresolved_symbol');
    }

    const colName = meta.column;
    const acc = symbol.accessor(colName);
    if (acc) {
      const model = symbol.node;
      const nodeId = `${model.definition.identity.name.value}.${colName}`;
      if (!context.cycleDetector.enter(nodeId)) {
         return unknownResolution('AccessorResolver', `Cycle detected at accessor ${nodeId}`, nodeId, 'invalid_boundary_input');
      }
      
      const res = this.resolveAccessor(acc, model, context);
      context.cycleDetector.leave(nodeId);
      
      const trace: SemanticTraceNode[] = [{
        source: 'AccessorResolver',
        rule: `Accessor lookup: ${model.definition.identity.name.value}.${colName}`,
        input: colName,
        output: resolutionLabel(res),
      }, ...res.trace];
      return { ...res, trace };
    }

    return unknownResolution('AccessorResolver', `Accessor ${colName} not found on model ${symbol.name}`, colName, 'unresolved_property');
  }

  private resolveAccessor(acc: ModelAccessor, currentModel: ModelNode, context: ResolutionContext): SemanticResolution {
    // Cache: already resolved by a previous scan (incremental.ts always
    // sets `semantic` to the resolved outcome, never a raw meta — unlike
    // the old `expression` field, there's no ambiguity to check for here).
    if (acc.semantic && acc.semantic.status === 'resolved') {
      return acc.semantic;
    }

    if (acc.ast) {
      return resolveInScope(context.kernel, acc.ast, modelScope(currentModel));
    }

    return unknownResolution('AccessorResolver', 'Accessor has no expression or static resolution', currentModel.name, 'unsupported_syntax');
  }
}
