import { ResolverPlugin, ResolutionContext, ResolutionResult, EvidenceNode } from '../types';

export class ExpressionResolver implements ResolverPlugin {
  canResolve(meta: any): boolean {
    return meta && (meta.kind === 'literal' || meta.kind === 'type_cast' || meta.kind === 'property_access' || meta.kind === 'binary_operation' || meta.kind === 'variable');
  }

  resolve(meta: any, context: ResolutionContext): ResolutionResult {
    const currentModel = context.contextModel;

    if (meta.kind === 'variable') {
      if (meta.name === 'this') {
        if (currentModel && currentModel.name) {
           return { status: 'resolved', type: currentModel.name, confidence: 100, evidence: [{ kind: 'variable', name: 'this', detail: `Resolves to current context model: ${currentModel.name}` }] };
        }
      }
      return { status: 'unresolved', type: 'unknown', confidence: 0, evidence: [{ kind: 'variable', name: meta.name, detail: 'Unknown variable' }], unresolvedReason: `Unknown variable: ${meta.name}` };
    }

    if (meta.kind === 'literal') {
      const t = meta.type === 'number' ? 'number' : meta.type === 'boolean' ? 'boolean' : 'string';
      return { status: 'resolved', type: t, confidence: 100, evidence: [{ kind: 'primitive', name: 'literal', detail: meta.value }] };
    }

    if (meta.kind === 'binary_operation') {
      const ev: EvidenceNode[] = [{ kind: 'primitive', name: 'binary_operation', detail: meta.operator }];
      
      const leftRes = context.kernel.resolve(meta.left, currentModel);
      const rightRes = context.kernel.resolve(meta.right, currentModel);
      ev.push(...leftRes.evidence);
      ev.push(...rightRes.evidence);
      
      let resolvedType = 'number'; // defaults to number for math operators
      if (meta.operator === '.') {
        resolvedType = 'string'; // string concatenation in PHP
      } else if (leftRes.type === 'string' || rightRes.type === 'string') {
        if (meta.operator === '+') {
            // Technically in PHP + on string tries to cast, but in TS + means string concat if any is string
            resolvedType = 'string';
        }
      }
      
      return { status: 'resolved', type: resolvedType, confidence: 90, evidence: ev };
    }

    if (meta.kind === 'type_cast') {
      const t = meta.type === 'number' ? 'number' : meta.type === 'boolean' ? 'boolean' : 'string';
      const ev: EvidenceNode[] = [{ kind: 'primitive', name: 'type_cast', detail: meta.type }];
      if (meta.argument) {
          const argRes = context.kernel.resolve(meta.argument, currentModel);
          ev.push(...argRes.evidence);
      }
      return { status: 'resolved', type: t, confidence: 100, evidence: ev };
    }

    if (meta.kind === 'property_access') {
      const prop = meta.property;
      let targetModel = currentModel;
      const ev: EvidenceNode[] = [];

      if (meta.target) {
          const targetRes = context.kernel.resolve(meta.target, currentModel);
          ev.push(...targetRes.evidence);
          
          if (targetRes.status === 'resolved' && targetRes.type !== 'unknown') {
              // Special framework classes
              if (targetRes.type === 'NewAccessToken' && prop === 'plainTextToken') {
                  ev.push({ kind: 'property_access', name: 'plainTextToken', detail: 'Token string' });
                  return { status: 'resolved', type: 'string', confidence: 90, evidence: ev };
              }
              
              // The type might be a Model name, e.g. 'User' or 'Payment'
              const tm = context.models.find((m: any) => m.name === targetRes.type || m.name.toLowerCase() === targetRes.type.toLowerCase());
              if (tm) {
                  targetModel = tm;
              } else {
                  return { status: 'unresolved', type: 'unknown', confidence: 0, evidence: ev, unresolvedReason: `Target type ${targetRes.type} is not a known model` };
              }
          } else if (meta.target.kind === 'model') {
              const tm = context.models.find((m: any) => m.name === meta.target.model);
              if (tm) {
                  targetModel = tm;
              }
          } else if (meta.target.kind === 'relation') {
             const relName = meta.target.name;
             const rel = currentModel.relations?.[relName];
             if (rel && rel.model) {
                const tm = context.models.find((m: any) => m.name === rel.model);
                if (tm) {
                    targetModel = tm;
                    ev.push({ kind: 'relation', name: `${currentModel.name}.${relName}`, detail: `Target: ${tm.name}` });
                } else {
                    return { status: 'unresolved', type: 'unknown', confidence: 0, evidence: ev, unresolvedReason: `Target model ${rel.model} not found` };
                }
             } else {
                return { status: 'unresolved', type: 'unknown', confidence: 0, evidence: ev, unresolvedReason: `Relation ${relName} not found on ${currentModel.name}` };
             }
          } else {
              return { status: 'unresolved', type: 'unknown', confidence: 0, evidence: ev, unresolvedReason: `Cannot resolve target of property access: ${meta.target.kind}` };
          }
      }

      const innerMeta = { kind: 'model_column', model: targetModel?.name || currentModel?.name, column: prop };
      const innerRes = context.kernel.resolve(innerMeta, targetModel || currentModel);
      ev.push(...innerRes.evidence);
      return {
          status: innerRes.status,
          type: innerRes.type,
          confidence: innerRes.confidence,
          evidence: ev,
          unresolvedReason: innerRes.unresolvedReason
      };
    }

    return { status: 'unresolved', type: 'unknown', confidence: 0, evidence: [], unresolvedReason: `Unsupported expression kind: ${meta.kind}` };
  }
}
