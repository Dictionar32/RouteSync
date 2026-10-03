/** Strict property-access consumer. Target semantics are resolved upstream. */
import type { SemanticResolution } from '../../../../types/domain/semanticResolution';
import type { ResolutionContext, ResolverMeta } from '../../../types';
import { resolveInScope } from '../../../kernel/resolveInScope';
import { SemanticResolutionFactory } from '../../../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../../../types/domain/boundAst';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import { relationAny, relationEqual, relationResolve } from '../../../kernel/semanticRelations';
import { relationOptionFold, relationRefine } from '../../../kernel/relationalSequence';

type PropertyMeta = Extract<ResolverMeta, { kind: 'property_access' | 'nullsafe_property_access' }>;
type StructuredTarget = Extract<SemanticResolution, { kind: 'object' | 'query_projection' }>;
type ModelTarget = Extract<SemanticResolution, { kind: 'model' }>;
type Nullability = { readonly kind: 'nullable' | 'non_nullable' };

const isPropertyMeta = (meta: ResolverMeta): meta is PropertyMeta =>
  relationAny([relationEqual(meta.kind, 'property_access'), relationEqual(meta.kind, 'nullsafe_property_access')]);
const isStructuredTarget = (target: SemanticResolution): target is StructuredTarget =>
  relationAny([relationEqual(target.kind, 'object'), relationEqual(target.kind, 'query_projection')]);
const isModelTarget = (target: SemanticResolution): target is ModelTarget => relationEqual(target.kind, 'model');

const nullabilityOf = (meta: PropertyMeta): Nullability => relationResolve(
  relationEqual(meta.kind, 'nullsafe_property_access'),
  () => ({ kind: 'nullable' }),
  () => ({ kind: 'non_nullable' }),
);

export function resolvePropertyAccess(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
  return relationOptionFold(
    relationRefine(meta, isPropertyMeta),
    () => indeterminate('Invalid property-access metadata'),
    property => {
      const target = resolveInScope(context.kernel, property.target, context.scope);
      return relationResolve(
        isStructuredTarget(target),
        () => resolveStructuredField(property, target),
        () => relationResolve(
          isModelTarget(target),
          () => resolveModelProperty(property, target),
          () => indeterminate(`Property target is not a model or structured object: ${target.kind}`),
        ),
      );
    },
  );
}

function resolveModelProperty(meta: PropertyMeta, target: ModelTarget): SemanticResolution {
  const access = target.definition.surface.byName.access(SemanticValueFactory.propertyName(meta.property.value));
  return relationResolve(
    relationEqual(access.kind, 'missing'),
    () => indeterminate(`Model property is not declared: ${meta.property.value}`),
    () => {
      const property = access.value.property;
      const semanticType = property.semanticType;
      return SemanticResolutionFactory.scalar({
        status: 'resolved', confidence: target.confidence,
        trace: [...target.trace, {
          source: 'PropertyAccessResolver', rule: 'Model property access resolved by surface fact',
          input: property.property.value.value, output: semanticType.kind,
        }],
        boundAst: target.boundAst, semanticType, nullability: nullabilityOf(meta),
      });
    },
  );
}

function resolveStructuredField(meta: PropertyMeta, target: StructuredTarget): SemanticResolution {
  const fieldName = SemanticValueFactory.responseFieldName(meta.property.value);
  const field = target.surface.byName.lookupField(fieldName);
  return relationResolve(
    relationEqual(field.kind, 'missing'),
    () => indeterminate(`Structured field is not declared: ${meta.property.value}`),
    () => {
      const semanticType = field.value.type;
      const boundAst = relationResolve(
        relationEqual(target.kind, 'query_projection'),
        () => BoundSemanticFactory.projectionField({ sourceModel: target.sourceModel, field: field.value.name, semanticType }),
        () => target.boundAst,
      );
      return SemanticResolutionFactory.scalar({
        status: 'resolved', confidence: target.confidence,
        trace: [...target.trace, {
          source: 'PropertyAccessResolver', rule: 'Structured field lookup from upstream declaration',
          input: field.value.name.value, output: semanticType.kind,
        }],
        boundAst, semanticType, nullability: nullabilityOf(meta),
      });
    },
  );
}

function indeterminate(rule: string): SemanticResolution {
  return SemanticResolutionFactory.indeterminate({
    status: 'indeterminate', confidence: 0,
    trace: [{ source: 'PropertyAccessResolver', rule, input: 'property_access', output: 'indeterminate' }],
    boundAst: BoundSemanticFactory.unsupported('unresolved_property'),
  });
}
