import { ObjectType, PrimitiveKind, PrimitiveType } from '../../../types/semantic';
import type { SemanticResolution } from '../../../types/domain/semanticResolution';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import type { SemanticTraceNode } from '../../../types/domain/semanticResolution';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../../types';
import { lookupGlobalFunction, lookupMethod, lookupVariableMethod, type FrameworkMethodRule } from '../FrameworkRegistry';

function trace(input: string, output: string): readonly SemanticTraceNode[] {
  return Object.freeze([{
    source: 'FrameworkRegistryResolver',
    rule: `Framework registry lookup: ${input}`,
    input,
    output,
  }]);
}

function toResolution(rule: FrameworkMethodRule, input: string): SemanticResolution {
  switch (rule.returns.kind) {
    case 'scalar':
      return SemanticResolutionFactory.scalar({
        status: 'resolved',
        confidence: rule.confidence,
        trace: trace(input, rule.returns.semanticType.kind),
        boundAst: BoundSemanticFactory.methodCall({
          targetModel: { kind: 'unbound' },
          methodName: SemanticValueFactory.methodName(input),
          returnType: rule.returns.semanticType,
          cardinality: { kind: 'single' },
          nullability: { kind: 'non_nullable' },
        }),
        semanticType: rule.returns.semanticType,
        nullability: { kind: 'non_nullable' },
      });
    case 'model':
      return SemanticResolutionFactory.model({
        status: 'resolved',
        confidence: rule.confidence,
        trace: trace(input, `model ${rule.returns.model.value}`),
        boundAst: BoundSemanticFactory.modelReference(rule.returns.model),
        model: rule.returns.model,
        cardinality: { kind: rule.returns.cardinality },
        cardinality: rule.returns.cardinality,
      });
    case 'object':
      const fields = Object.freeze(rule.returns.fields.map(([name, semanticType]) => Object.freeze({
        name,
        type: semanticType,
        required: true,
        nullability: { kind: 'non_nullable' },
        description: 'Framework registry field',
      })));
      const objectType = ObjectType.create({
        name: 'FrameworkObject',
        baseName: 'FrameworkObject',
        properties: fields,
        role: 'plain',
      });
      return SemanticResolutionFactory.object({
        status: 'resolved',
        confidence: rule.confidence,
        trace: trace(input, 'object'),
        boundAst: BoundSemanticFactory.methodCall({
          targetModel: { kind: 'unbound' },
          methodName: SemanticValueFactory.methodName(input),
          returnType: objectType,
          cardinality: { kind: 'single' },
          nullability: { kind: 'non_nullable' },
        }),
        fields: Object.freeze(rule.returns.fields.map(([name, semanticType]) => [SemanticValueFactory.responseFieldName(name), semanticType] as const)),
      });
  }
}

function selectRule(meta: Extract<ResolverMeta, { kind: 'method_call' | 'static_method_call' }>): FrameworkMethodRule | undefined {
  if (meta.kind === 'method_call' && meta.target !== null && meta.target.kind === 'variable') {
    const variableRule = lookupVariableMethod(meta.target.name.value, meta.name.value);
    if (variableRule !== undefined) return variableRule;
  }

  if (meta.kind === 'method_call' && meta.target === null) {
    const globalRule = lookupGlobalFunction(meta.name.value);
    if (globalRule !== undefined) return globalRule;
  }

  return lookupMethod(meta.name.value);
}

export class FrameworkRegistryResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    const method = 'kind' in meta && (meta.kind === 'method_call' || meta.kind === 'static_method_call');
    if (!method) return false;
    const name = meta.name;
    const global = meta.kind === 'method_call' && meta.target === null && lookupGlobalFunction(name) !== undefined;
    const variable = meta.kind === 'method_call' && meta.target !== null && meta.target.kind === 'variable' && lookupVariableMethod(meta.target.name, name) !== undefined;
    return global || variable || lookupMethod(name) !== undefined;
  }

  resolve(meta: ResolverMeta, _context: ResolutionContext): SemanticResolution {
    if (meta.kind !== 'method_call' && meta.kind !== 'static_method_call') {
      return SemanticResolutionFactory.unknown({
        status: 'unknown', confidence: 0, trace: trace('invalid metadata', 'unknown'),
        boundAst: BoundSemanticFactory.unsupported('invalid_boundary_input'),
      });
    }

    const rule = selectRule(meta);

    if (rule === undefined) {
      return SemanticResolutionFactory.unknown({
        status: 'unknown', confidence: 0, trace: trace(meta.name, 'unknown'),
        boundAst: BoundSemanticFactory.unsupported('unresolved_method'),
      });
    }

    return toResolution(rule, meta.name.value);
  }
}
