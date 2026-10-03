import type { SemanticResolution } from '../../types/domain/semanticResolution';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import { SemanticResolutionFactory } from '../../types/domain/semanticResolutionFactory';
import { SemanticValueFactory } from '../../types/domain/semanticValues';
import { BoundSemanticFactory } from '../../types/domain/boundAst';
import { relationEqual, relationGate } from '../kernel/semanticRelations';
import { relationEvery, relationFirst, relationIsSome, relationOptionFold, relationTextEndsWith, type RelationOption } from '../kernel/relationalSequence';

/**
 * Resource graph knowledge is a declarative constraint catalog.
 * Meta facts are evidence; rule satisfaction is delegated to the relation
 * kernel, and the witnessed rule carries its own semantic provenance.
 */
type ResourceRuleId = 'resource_collection_static_call' | 'resource_instance';
type ResourceCardinality = 'single' | 'collection';
type ResourceConstraint =
  | Readonly<{ readonly kind: 'meta_kind'; readonly value: ResolverMeta['kind'] }>
  | Readonly<{ readonly kind: 'meta_name'; readonly value: string }>
  | Readonly<{ readonly kind: 'meta_class_suffix'; readonly value: string }>;
type ResourceRule = Readonly<{
  readonly id: ResourceRuleId;
  readonly cardinality: ResourceCardinality;
  readonly rule: string;
  readonly constraints: readonly ResourceConstraint[];
}>;
type ResourceRuleWitness = Readonly<{
  readonly rule: ResourceRule;
  readonly constraints: readonly ResourceConstraint[];
}>;

const resourceRules: readonly ResourceRule[] = Object.freeze([
  Object.freeze({
    id: 'resource_collection_static_call',
    cardinality: 'collection',
    rule: 'Resource collection static call mapping',
    constraints: Object.freeze([
      Object.freeze({ kind: 'meta_kind', value: 'static_method_call' }),
      Object.freeze({ kind: 'meta_name', value: 'collection' }),
    ]),
  }),
  Object.freeze({
    id: 'resource_instance',
    cardinality: 'single',
    rule: 'Resource instance mapping',
    constraints: Object.freeze([
      Object.freeze({ kind: 'meta_kind', value: 'new_instance' }),
      Object.freeze({ kind: 'meta_class_suffix', value: 'Resource' }),
    ]),
  }),
]);

const witnessConstraint = (meta: ResolverMeta, constraint: ResourceConstraint): boolean => relationGate(
  relationEqual(constraint.kind, 'meta_kind'),
  () => relationEqual(meta.kind, constraint.value),
  () => relationGate(
    relationEqual(constraint.kind, 'meta_name'),
    () => relationEqual(meta.name.value, constraint.value),
    () => relationTextEndsWith(meta.className.value, constraint.value),
  ),
);

const witnessRule = (meta: ResolverMeta, rule: ResourceRule): RelationOption<ResourceRuleWitness> =>
  relationOptionFold(
    relationEvery(rule.constraints, constraint => witnessConstraint(meta, constraint)),
    () => ({ kind: 'none' }),
    () => ({ kind: 'some', value: Object.freeze({ rule, constraints: rule.constraints }) }),
  );

const witnessedRule = (meta: ResolverMeta): RelationOption<ResourceRuleWitness> => {
  const candidate = relationFirst(resourceRules, rule => relationIsSome(witnessRule(meta, rule)));
  return relationOptionFold(candidate, () => ({ kind: 'none' }), rule => witnessRule(meta, rule));
};

export const ResourceGraphResolver: ResolverPlugin = Object.freeze({
  canResolve: (meta: ResolverMeta): boolean => relationOptionFold(
    witnessedRule(meta),
    () => false,
    () => true,
  ),
  resolve: (meta: ResolverMeta, _context: ResolutionContext): SemanticResolution => relationOptionFold(
    witnessedRule(meta),
    () => SemanticResolutionFactory.indeterminate({
      status: 'indeterminate',
      confidence: 0,
      trace: [],
      boundAst: BoundSemanticFactory.unsupported('unsupported_syntax'),
    }),
    witness => resource(meta.className.value, witness.rule.cardinality, witness.rule.rule),
  ),
});

function resource(name: string, cardinality: ResourceCardinality, rule: string): SemanticResolution {
  const resource = SemanticValueFactory.resourceName(name);
  return SemanticResolutionFactory.resource({
    status: 'resolved',
    confidence: 100,
    trace: [{ source: 'ResourceGraphResolver', rule, input: name, output: `resource: ${name}` }],
    boundAst: BoundSemanticFactory.resourceReference(resource),
    resource,
    cardinality: { kind: cardinality },
  });
}
