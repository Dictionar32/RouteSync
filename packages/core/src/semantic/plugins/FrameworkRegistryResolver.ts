import { ObjectType, PrimitiveKind, PrimitiveType } from '../../../types/semantic';
import type { SemanticResolution } from '../../../types/domain/semanticResolution';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import type { SemanticTraceNode } from '../../../types/domain/semanticResolution';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { resolveFrameworkModel } from './frameworkModelResolution';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../../types';
import { type FrameworkMethodRule } from '../FrameworkRegistry';
import { hasFrameworkRule, selectFrameworkRule } from './frameworkRuleSelection';

function trace(input: string, output: string): readonly SemanticTraceNode[] {
  return Object.freeze([{
    source: 'FrameworkRegistryResolver',
    rule: `Framework registry lookup: ${input}`,
    input,
    output,
  }]);
}

function toResolution(rule: FrameworkMethodRule, input: string, context: ResolutionContext): SemanticResolution {
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
      return resolveFrameworkModel(
        rule.returns, input, context, trace(input, `model ${rule.returns.model.value}`), rule.confidence,
      );
    case 'object':
      const fields = Object.freeze(rule.returns.fields.map(field => Object.freeze({
        name: field.name,
        type: field.type,
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
        fields: Object.freeze(rule.returns.fields.map(field => Object.freeze({
          name: SemanticValueFactory.responseFieldName(field.name),
          type: field.type,
        }))),
      });
  }
}

export class FrameworkRegistryResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return hasFrameworkRule(meta);
  }

  resolve(meta: ResolverMeta, _context: ResolutionContext): SemanticResolution {
    if (meta.kind !== 'method_call' && meta.kind !== 'static_method_call') {
      return SemanticResolutionFactory.unknown({
        status: 'unknown', confidence: 0, trace: trace('invalid metadata', 'unknown'),
        boundAst: BoundSemanticFactory.unsupported('invalid_boundary_input'),
      });
    }

    const rule = selectFrameworkRule(meta);

    if (rule === undefined) {
      return SemanticResolutionFactory.unknown({
        status: 'unknown', confidence: 0, trace: trace(meta.name, 'unknown'),
        boundAst: BoundSemanticFactory.unsupported('unresolved_method'),
      });
    }

    return toResolution(rule, meta.name.value, _context);
  }
}
