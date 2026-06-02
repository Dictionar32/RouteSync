import { ResolverPlugin, ResolutionContext, ResolutionResult, EvidenceNode } from '../types';

export class ModelColumnResolver implements ResolverPlugin {
  canResolve(meta: any): boolean {
    return meta && meta.kind === 'model_column';
  }

  resolve(meta: any, context: ResolutionContext): ResolutionResult {
    const model = context.models.find((m: any) => m.name === meta.model);
    if (!model) {
      return { status: 'unresolved', type: 'unknown', confidence: 0, evidence: [], unresolvedReason: `Model ${meta.model} not found in manifest` };
    }

    const col = model.columns?.find((c: any) => c.name === meta.column);
    if (col) {
      let tsType = context.kernel.mapSqlTypeToTs(col.type);
      const evidence: EvidenceNode[] = [{ kind: 'column', name: `${model.name}.${col.name}`, detail: `sqlType: ${col.type}` }];
      
      const castType = (model.casts || {})[col.name];
      if (castType) {
          tsType = context.kernel.mapCastToTs(castType, tsType);
          evidence.push({ kind: 'accessor', name: `${model.name}::$casts[${col.name}]`, detail: `cast: ${castType}` });
      }
      return { status: 'resolved', type: tsType, confidence: 100, evidence };
    }

    if (model.accessors && model.accessors[meta.column]) {
      return context.kernel.resolve({ kind: 'model_accessor', model: meta.model, column: meta.column }, model);
    }

    if (model.relations && model.relations[meta.column]) {
      const rel = model.relations[meta.column];
      if (rel.model) {
        return {
          status: 'resolved',
          type: rel.model,
          confidence: 100,
          evidence: [{ kind: 'relation', name: `${model.name}.${meta.column}`, detail: `Target: ${rel.model}` }]
        };
      }
    }

    return { status: 'unresolved', type: 'unknown', confidence: 0, evidence: [], unresolvedReason: `Property ${meta.column} not found on model ${model.name}` };
}
}
