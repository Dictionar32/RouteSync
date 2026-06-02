import { ResolverPlugin, ResolutionContext, ResolutionResult, EvidenceNode } from '../types';

export class AccessorResolver implements ResolverPlugin {
  canResolve(meta: any): boolean {
    return meta && meta.kind === 'model_accessor';
  }

  resolve(meta: any, context: ResolutionContext): ResolutionResult {
    const model = context.models.find((m: any) => m.name === meta.model);
    if (!model) {
      return { status: 'unresolved', type: 'unknown', confidence: 0, evidence: [], unresolvedReason: `Model ${meta.model} not found in manifest` };
    }

    if (model.accessors && model.accessors[meta.column]) {
      const acc = model.accessors[meta.column];
      const nodeId = `${model.name}.${meta.column}`;
      if (!context.cycleDetector.enter(nodeId)) {
         return { status: 'unresolved', type: 'unknown', confidence: 0, evidence: [], unresolvedReason: `Cycle detected at accessor ${nodeId}` };
      }
      
      const res = this.resolveAccessor(acc, model, context);
      context.cycleDetector.leave(nodeId);
      
      const evidence: EvidenceNode[] = [{ kind: 'accessor', name: `${model.name}.${meta.column}` }];
      evidence.push(...res.evidence);
      return {
         status: res.status,
         type: res.type,
         confidence: res.confidence,
         evidence,
         unresolvedReason: res.unresolvedReason
      };
    }

    return { status: 'unresolved', type: 'unknown', confidence: 0, evidence: [], unresolvedReason: `Accessor ${meta.column} not found on model ${model.name}` };
  }

  private resolveAccessor(acc: any, currentModel: any, context: ResolutionContext): ResolutionResult {
    if (acc.resolvedType && acc.resolvedType !== 'unknown') {
      const t = acc.resolvedType === 'integer' || acc.resolvedType === 'number' ? 'number' :
                acc.resolvedType === 'boolean' ? 'boolean' :
                acc.resolvedType === 'array' ? 'unknown[]' : 'string';
      return { status: 'resolved', type: t, confidence: 90, evidence: [{ kind: 'fallback', name: 'resolvedType_cache', detail: acc.resolvedType }] };
    }

    if (acc.expression) {
      return this.evaluateExpression(acc.expression, currentModel, context);
    }

    return { status: 'unresolved', type: 'unknown', confidence: 0, evidence: [], unresolvedReason: 'Accessor has no expression or static resolution' };
  }

  private evaluateExpression(expr: any, currentModel: any, context: ResolutionContext): ResolutionResult {
    if (!expr) return { status: 'unresolved', type: 'unknown', confidence: 0, evidence: [], unresolvedReason: 'Empty expression' };
    return context.kernel.resolve(expr, currentModel);
  }
}
