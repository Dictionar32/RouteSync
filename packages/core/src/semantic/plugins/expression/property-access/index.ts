/** Strict property-access consumer. Target semantics are resolved upstream. */
import type { SemanticResolution } from '../../../../types/domain/semanticResolution';
import type { ResolutionContext, ResolverMeta } from '../../../types';
import { resolveInScope } from '../../../kernel/resolveInScope';
import { SemanticResolutionFactory } from '../../../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../../../types/domain/boundAst';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';

export function resolvePropertyAccess(
  meta: ResolverMeta,
  context: ResolutionContext,
): SemanticResolution {
  if (meta.kind !== 'property_access' && meta.kind !== 'nullsafe_property_access') {
    return unknown('Invalid property-access metadata');
  }
  const target = resolveInScope(context.kernel, meta.target, context.scope);
  if (target.kind === 'object' || target.kind === 'query_projection') {
    return resolveStructuredField(meta, target);
  }
  if (target.kind !== 'model') return unknown(`Property target is not a model or structured object: ${target.kind}`);
  return resolveModelProperty(meta, target);
}

function resolveModelProperty(
  meta: Extract<ResolverMeta, { kind: 'property_access' | 'nullsafe_property_access' }>,
  target: Extract<SemanticResolution, { kind: 'model' }>,
): SemanticResolution {
  const access = target.definition.surface.byName.access(
    SemanticValueFactory.propertyName(meta.property.value),
  );
  if (access.kind === 'missing') return unknown(`Model property is not declared: ${meta.property.value}`);

  const nullability = meta.kind === 'nullsafe_property_access'
    ? { kind: 'nullable' as const }
    : { kind: 'non_nullable' as const };
  const semanticType = access.value.property.semanticType;

  return SemanticResolutionFactory.scalar({
    status: 'resolved', confidence: target.confidence,
    trace: [...target.trace, {
      source: 'PropertyAccessResolver', rule: 'Model property access resolved by surface fact',
      input: access.value.property.property.value.value, output: semanticType.kind,
    }],
    boundAst: target.boundAst,
    semanticType, nullability,
  });
}

function resolveStructuredField(
  meta: Extract<ResolverMeta, { kind: 'property_access' | 'nullsafe_property_access' }>,
  target: Extract<SemanticResolution, { kind: 'object' | 'query_projection' }>,
): SemanticResolution {
  const fieldName = SemanticValueFactory.responseFieldName(meta.property.value);
  if (target.kind === 'query_projection') {
    const field = target.surface.byName.lookupField(fieldName);
    if (field.kind === 'missing') return unknown(`Structured field is not declared: ${meta.property.value}`);
    const semanticType = field.value.type;
    return SemanticResolutionFactory.scalar({
      status: 'resolved', confidence: target.confidence, trace: [...target.trace, {
        source: 'PropertyAccessResolver', rule: 'Structured field lookup from upstream declaration',
        input: field.value.name.value, output: semanticType.kind,
      }],
      boundAst: BoundSemanticFactory.projectionField({ sourceModel: target.sourceModel, field: field.value.name, semanticType }),
      semanticType, nullability: meta.kind === 'nullsafe_property_access' ? { kind: 'nullable' } : { kind: 'non_nullable' },
    });
  }

  const field = target.surface.byName.lookupField(fieldName);
  if (field.kind === 'missing') return unknown(`Structured field is not declared: ${meta.property.value}`);
  const semanticType = field.value.type;
  return SemanticResolutionFactory.scalar({
    status: 'resolved', confidence: target.confidence, trace: [...target.trace, {
      source: 'PropertyAccessResolver', rule: 'Structured field lookup from upstream declaration',
      input: field.value.name.value, output: semanticType.kind,
    }],
    boundAst: target.boundAst,
    semanticType, nullability: meta.kind === 'nullsafe_property_access' ? { kind: 'nullable' } : { kind: 'non_nullable' },
  });
}

function unknown(rule: string): SemanticResolution {
  return SemanticResolutionFactory.unknown({
    status: 'unknown', confidence: 0,
    trace: [{ source: 'PropertyAccessResolver', rule, input: 'property_access', output: 'unknown' }],
    boundAst: BoundSemanticFactory.unsupported('unresolved_property'),
  });
}
