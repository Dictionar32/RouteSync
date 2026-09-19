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
  const property = target.definition.surface.byName.get(
    SemanticValueFactory.propertyName(meta.property.value),
  );
  if (property === undefined) return unknown(`Model property is not declared: ${meta.property.value}`);

  const nullability = meta.kind === 'nullsafe_property_access'
    ? { kind: 'nullable' as const }
    : { kind: 'non_nullable' as const };

  if (property.kind === 'column' || property.kind === 'accessor') {
    return SemanticResolutionFactory.scalar({
      status: 'resolved', confidence: target.confidence,
      trace: [...target.trace, {
        source: 'PropertyAccessResolver', rule: `Model ${property.kind} lookup from upstream semantic surface`,
        input: property.property.value, output: property.type.kind,
      }],
      boundAst: target.kind === 'model' ? target.boundAst : BoundSemanticFactory.unsupported('unresolved_property'),
      semanticType: property.type, nullability,
    });
  }

  return SemanticResolutionFactory.scalar({
    status: 'resolved', confidence: target.confidence,
    trace: [...target.trace, {
      source: 'PropertyAccessResolver', rule: 'Model relation lookup from upstream semantic surface',
      input: property.property.value, output: property.semanticType.kind,
    }],
    boundAst: target.boundAst,
    semanticType: property.semanticType,
    nullability,
  });
}

function resolveStructuredField(
  meta: Extract<ResolverMeta, { kind: 'property_access' | 'nullsafe_property_access' }>,
  target: Extract<SemanticResolution, { kind: 'object' | 'query_projection' }>,
): SemanticResolution {
  const field = target.kind === 'query_projection'
    ? target.surface.byName.get(SemanticValueFactory.responseFieldName(meta.property.value))
    : target.fields.find(field => field.name.value === meta.property.value);
  if (field === undefined) return unknown(`Structured field is not declared: ${meta.property.value}`);
  const semanticType = field.type;
  const boundAst = target.kind === 'query_projection'
    ? BoundSemanticFactory.projectionField({ sourceModel: target.sourceModel, field: field.name, semanticType })
    : target.boundAst;
  return SemanticResolutionFactory.scalar({
    status: 'resolved', confidence: target.confidence, trace: [...target.trace, {
      source: 'PropertyAccessResolver', rule: 'Structured field lookup from upstream declaration',
      input: field.name.value, output: semanticType.kind,
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
