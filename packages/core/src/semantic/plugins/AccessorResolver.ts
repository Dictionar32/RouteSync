import { SemanticResolution, SemanticType, TraceNode } from '../../types/contract';
import { ResolverPlugin, ResolutionContext, ResolverMeta, ModelNode, ModelAccessor } from '../types';

export class AccessorResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return !!(meta && meta.kind === 'model_accessor');
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    const model = context.models.find(m => m.name === meta.model);
    if (!model) {
      return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace: [{ source: 'AccessorResolver', rule: `Model ${meta.model || 'unknown'} not found in manifest` }]
      };
    }

    const colName = meta.column || '';
    if (model.accessors && model.accessors[colName]) {
      const acc = model.accessors[colName];
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
      trace: [{ source: 'AccessorResolver', rule: `Accessor ${colName} not found on model ${model.name}` }]
    };
  }

  private resolveAccessor(acc: ModelAccessor, currentModel: ModelNode, context: ResolutionContext): SemanticResolution {
    if (acc.resolvedType && acc.resolvedType !== 'unknown') {
      const t: SemanticType = acc.resolvedType === 'integer' || acc.resolvedType === 'number' ? 'number' :
                acc.resolvedType === 'boolean' ? 'boolean' :
                acc.resolvedType === 'array' ? 'array' : 'string';
      return {
        status: 'resolved',
        type: t,
        confidence: 90,
        trace: [{
          source: 'AccessorResolver',
          rule: 'Resolved type cache lookup',
          input: acc.resolvedType,
          output: t
        }]
      };
    }

    if (acc.expression) {
      return this.evaluateExpression(acc.expression, currentModel, context);
    }

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{ source: 'AccessorResolver', rule: 'Accessor has no expression or static resolution' }]
    };
  }

  private evaluateExpression(expr: ResolverMeta, currentModel: ModelNode, context: ResolutionContext): SemanticResolution {
    return context.kernel.resolve(expr, currentModel);
  }
}
