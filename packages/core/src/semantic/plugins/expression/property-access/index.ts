/** Strict property-access consumer. Target semantics are resolved upstream. */
import type { SemanticResolution } from '../../../../types/domain/semanticResolution';
import type { ResolutionContext, ResolverMeta } from '../../../types';
import { SemanticResolutionFactory } from '../../../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../../../types/domain/boundAst';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import { PrimitiveKind, PrimitiveType } from '../../../../compiler/types/SemanticType';

export function resolvePropertyAccess(
  meta: ResolverMeta,
  context: ResolutionContext,
): SemanticResolution {
  if (meta.kind !== 'property_access' && meta.kind !== 'nullsafe_property_access') {
    return unknown('Invalid property-access metadata');
  }
  const target = context.kernel.resolve(meta.target, context.contextModel);
  if (target.kind === 'object' || target.kind === 'query_projection') {
    return resolveStructuredField(meta, target);
  }
  if (target.kind !== 'model') return unknown(`Property target is not a model or structured object: ${target.kind}`);

  const inner = context.kernel.resolve({
    kind: 'model_column', model: target.model, column: SemanticValueFactory.columnName(meta.property.value),
  }, context.contextModel);
  if (inner.kind !== 'scalar') return inner;
  if (meta.kind === 'property_access') return inner;
  return SemanticResolutionFactory.scalar({
    ...inner,
    nullability: { kind: 'nullable' },
    trace: [...inner.trace, {
      source: 'PropertyAccessResolver', rule: 'Nullsafe access propagates nullability',
      input: meta.property.value, output: 'nullable',
    }],
  });
}

function resolveStructuredField(
  meta: Extract<ResolverMeta, { kind: 'property_access' | 'nullsafe_property_access' }>,
  target: Extract<SemanticResolution, { kind: 'object' | 'query_projection' }>,
): SemanticResolution {
  const found = target.fields.find(([name]) => name.value === meta.property.value);
  if (!found) return unknown(`Structured field is not declared: ${meta.property.value}`);
  const [field, semanticType] = found;
  const boundAst = target.kind === 'query_projection'
    ? BoundSemanticFactory.projectionField({ sourceModel: target.sourceModel, field, semanticType })
    : target.boundAst;
  return SemanticResolutionFactory.scalar({
    status: 'resolved', confidence: target.confidence, trace: [...target.trace, {
      source: 'PropertyAccessResolver', rule: 'Structured field lookup from upstream declaration',
      input: field.value, output: semanticType.kind,
    }], boundAst, semanticType, nullability: meta.kind === 'nullsafe_property_access' ? { kind: 'nullable' } : { kind: 'non_nullable' },
  });
}

function unknown(rule: string): SemanticResolution {
  return SemanticResolutionFactory.unknown({
    status: 'unknown', confidence: 0,
    trace: [{ source: 'PropertyAccessResolver', rule, input: 'property_access', output: 'unknown' }],
    boundAst: BoundSemanticFactory.unsupported('unresolved_property'),
  });
}
