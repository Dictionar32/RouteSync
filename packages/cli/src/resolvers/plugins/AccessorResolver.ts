import { SemanticResolution, TraceNode } from '@routesync/core';
import { ResolverPlugin, ResolutionContext } from '../types';

export class AccessorResolver implements ResolverPlugin {
  canResolve(meta: any): boolean {
    return meta && meta.kind === 'model_accessor';
  }

  resolve(meta: any, context: ResolutionContext): SemanticResolution {
    const model = context.models.find((m: any) => m.name === meta.model);
    if (!model) {
      return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace: [{ source: 'AccessorResolver', rule: `Model ${meta.model} not found in manifest` }]
      };
    }

    if (model.accessors && model.accessors[meta.column]) {
      const acc = model.accessors[meta.column];
      const nodeId = `${model.name}.${meta.column}`;
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
        rule: `Accessor lookup: ${model.name}.${meta.column}`,
        input: meta.column,
        output: res.type
      }];
      trace.push(...res.trace);
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
      trace: [{ source: 'AccessorResolver', rule: `Accessor ${meta.column} not found on model ${model.name}` }]
    };
  }

  private resolveAccessor(acc: Record<string, unknown>, currentModel: Record<string, unknown>, context: ResolutionContext): SemanticResolution {
    // If expression is already a resolved SemanticResolution, return it directly
    const expr = acc.expression;
    if (expr && typeof expr === 'object' && 'status' in (expr as Record<string, unknown>) && (expr as Record<string, unknown>).status === 'resolved') {
      return expr as SemanticResolution;
    }

    if (acc.resolvedType && acc.resolvedType !== 'unknown') {
      const t = acc.resolvedType === 'integer' || acc.resolvedType === 'number' ? 'number' :
                acc.resolvedType === 'boolean' ? 'boolean' :
                acc.resolvedType === 'array' ? 'unknown[]' : 'string';
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

    // Prefer parsed_ast (the raw AST node) over expression (which may be a resolved result)
    if (acc.parsed_ast) {
      return this.evaluateExpression(acc.parsed_ast as Record<string, unknown>, currentModel, context);
    }

    if (expr && typeof expr === 'object' && 'kind' in (expr as Record<string, unknown>)) {
      return this.evaluateExpression(expr as Record<string, unknown>, currentModel, context);
    }

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{ source: 'AccessorResolver', rule: 'Accessor has no expression or static resolution' }]
    };
  }

  private evaluateExpression(expr: Record<string, unknown>, currentModel: Record<string, unknown>, context: ResolutionContext): SemanticResolution {
    if (!expr) {
      return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace: [{ source: 'AccessorResolver', rule: 'Empty expression' }]
      };
    }
    return context.kernel.resolve(expr, currentModel);
  }
}
