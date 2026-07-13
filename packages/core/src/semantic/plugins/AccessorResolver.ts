import { SemanticResolution, TraceNode } from '../../types/contract';
import { ResolverPlugin, ResolutionContext, ResolverMeta, ModelNode, ModelAccessor } from '../types';

export class AccessorResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return !!(meta && meta.kind === 'model_accessor');
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    if (meta.kind !== 'model_accessor') {
      return { status: 'unknown', type: 'unknown', confidence: 0, trace: [] };
    }
    const symbol = context.symbolTable.get(meta.model);
    if (!symbol) {
      return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace: [{ source: 'AccessorResolver', rule: `Model ${meta.model || 'unknown'} not found in manifest` }]
      };
    }

    const colName = meta.column || '';
    const acc = symbol.accessor(colName);
    if (acc) {
      const model = symbol.node;
      const nodeId = `${model.name}.${colName}`;
      if (!context.cycleDetector.enter(nodeId)) {
         return {
           status: 'unknown',
           type: 'unknown',
           confidence: 0,
           trace: [{ source: 'AccessorResolver', rule: `Cycle detected at accessor ${nodeId}` }]
         };
      }
      
      const res = this.resolveAccessor(acc, model, context);
      context.cycleDetector.leave(nodeId);
      
      const trace: TraceNode[] = [{
        source: 'AccessorResolver',
        rule: `Accessor lookup: ${model.name}.${colName}`,
        input: colName,
        output: res.type
      }];
      if (res.trace) trace.push(...res.trace);
      return {
         status: res.status,
         type: res.type,
         model: res.model,
         resource: res.resource,
         collection: res.collection,
         paginated: res.paginated,
         nullable: res.nullable,
         confidence: res.confidence,
         trace
      };
    }

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{ source: 'AccessorResolver', rule: `Accessor ${colName} not found on model ${symbol.name}` }]
    };
  }

  private resolveAccessor(acc: ModelAccessor, currentModel: ModelNode, context: ResolutionContext): SemanticResolution {
    // Cache: already resolved by a previous scan (incremental.ts always
    // sets `semantic` to the resolved outcome, never a raw meta — unlike
    // the old `expression` field, there's no ambiguity to check for here).
    if (acc.semantic && acc.semantic.status === 'resolved') {
      return acc.semantic;
    }

    if (acc.ast) {
      return context.kernel.resolve(acc.ast, currentModel);
    }

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{ source: 'AccessorResolver', rule: 'Accessor has no expression or static resolution' }]
    };
  }
}
