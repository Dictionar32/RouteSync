import { ObjectType } from '../../compiler/types/SemanticType';
import type { SemanticResolution } from '../../types/domain/semanticResolution';
import { SemanticResolutionFactory } from '../../types/domain/semanticResolutionFactory';
import type { SemanticTraceNode } from '../../types/domain/semanticResolution';
import { BoundSemanticFactory } from '../../types/domain/boundAst';
import { resolveFrameworkModel } from './frameworkModelResolution';
import { SemanticValueFactory } from '../../types/domain/semanticValues';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../../types';
import type { FrameworkMethodRule, FrameworkReturnDescriptor } from '../FrameworkRegistry';
import { hasFrameworkRule, selectFrameworkRule } from './frameworkRuleSelection';
import { relationOptionFold, relationProject, relationRefine } from '../kernel/relationalSequence';
import { relationAny, relationEqual } from '../kernel/semanticRelations';

function trace(input: string, output: string): readonly SemanticTraceNode[] {
  return Object.freeze([{ source: 'FrameworkRegistryResolver', rule: `Framework registry lookup: ${input}`, input, output }]);
}

type ScalarReturn = Extract<FrameworkReturnDescriptor, { readonly kind: 'scalar' }>;
type ModelReturn = Extract<FrameworkReturnDescriptor, { readonly kind: 'model' }>;
type ObjectReturn = Extract<FrameworkReturnDescriptor, { readonly kind: 'object' }>;
const isScalarReturn = (value: FrameworkReturnDescriptor): value is ScalarReturn => relationEqual(value.kind, 'scalar');
const isModelReturn = (value: FrameworkReturnDescriptor): value is ModelReturn => relationEqual(value.kind, 'model');
const isObjectReturn = (value: FrameworkReturnDescriptor): value is ObjectReturn => relationEqual(value.kind, 'object');
const isMethodMeta = (meta: ResolverMeta): meta is Extract<ResolverMeta, { kind: 'method_call' | 'static_method_call' }> =>
  relationAny([relationEqual(meta.kind, 'method_call'), relationEqual(meta.kind, 'static_method_call')]);

const scalarResolution = (rule: FrameworkMethodRule & { readonly returns: ScalarReturn }, input: string): SemanticResolution => SemanticResolutionFactory.scalar({
  status: 'resolved', confidence: rule.confidence, trace: trace(input, rule.returns.semanticType.kind),
  boundAst: BoundSemanticFactory.methodCall({ targetModel: { kind: 'unbound' }, methodName: SemanticValueFactory.methodName(input), returnType: rule.returns.semanticType, cardinality: { kind: 'single' }, nullability: { kind: 'non_nullable' } }),
  semanticType: rule.returns.semanticType,
  nullability: { kind: 'non_nullable' },
});

const modelResolution = (rule: FrameworkMethodRule & { readonly returns: ModelReturn }, input: string, context: ResolutionContext): SemanticResolution =>
  resolveFrameworkModel(rule.returns, input, context, trace(input, `model ${rule.returns.model.value}`), rule.confidence);

const objectResolution = (rule: FrameworkMethodRule & { readonly returns: ObjectReturn }, input: string): SemanticResolution => {
  const fields = Object.freeze(relationProject(rule.returns.fields, field => Object.freeze({ name: field.name, type: field.type, required: true, nullability: { kind: 'non_nullable' }, description: 'Framework registry field' })));
  const objectType = ObjectType.create({ name: 'FrameworkObject', baseName: 'FrameworkObject', properties: fields, role: 'plain' });
  return SemanticResolutionFactory.object({
    status: 'resolved', confidence: rule.confidence, trace: trace(input, 'object'),
    boundAst: BoundSemanticFactory.methodCall({ targetModel: { kind: 'unbound' }, methodName: SemanticValueFactory.methodName(input), returnType: objectType, cardinality: { kind: 'single' }, nullability: { kind: 'non_nullable' } }),
    fields: Object.freeze(relationProject(rule.returns.fields, field => ({ name: SemanticValueFactory.responseFieldName(field.name), type: field.type }))),
  });
};

function toResolution(rule: FrameworkMethodRule, input: string, context: ResolutionContext): SemanticResolution {
  const scalar = relationRefine(rule.returns, isScalarReturn);
  return relationOptionFold(scalar,
    () => {
      const model = relationRefine(rule.returns, isModelReturn);
      return relationOptionFold(model,
        () => {
          const object = relationRefine(rule.returns, isObjectReturn);
          return relationOptionFold(object, () => SemanticResolutionFactory.indeterminate({ status: 'indeterminate', confidence: 0, trace: trace(input, 'indeterminate'), boundAst: BoundSemanticFactory.unsupported('unresolved_method') }), value => objectResolution({ ...rule, returns: value }, input));
        },
        value => modelResolution({ ...rule, returns: value }, input, context),
      );
    },
    value => scalarResolution({ ...rule, returns: value }, input),
  );
}

const canResolve = (meta: ResolverMeta): boolean => relationOptionFold(relationRefine(meta, isMethodMeta), () => false, hasFrameworkRule);

const resolve = (meta: ResolverMeta, context: ResolutionContext): SemanticResolution => {
    return relationOptionFold(relationRefine(meta, isMethodMeta),
      () => SemanticResolutionFactory.indeterminate({ status: 'indeterminate', confidence: 0, trace: trace('invalid metadata', 'indeterminate'), boundAst: BoundSemanticFactory.unsupported('invalid_boundary_input') }),
      methodMeta => relationOptionFold(selectFrameworkRule(methodMeta),
        () => SemanticResolutionFactory.indeterminate({ status: 'indeterminate', confidence: 0, trace: trace(methodMeta.name, 'indeterminate'), boundAst: BoundSemanticFactory.unsupported('unresolved_method') }),
        rule => toResolution(rule, methodMeta.name.value, context)),
    );
};

export const FrameworkRegistryResolver: ResolverPlugin = Object.freeze({ canResolve, resolve });
