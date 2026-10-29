/**
 * Declarative semantic mapping program for upstream resource expression vocabulary.
 *
 * Source syntax is evidence. The existing upstream authority owns the closed
 * source-to-target vocabulary contract; scanner consumers must not reclassify it.
 */
import { astSemanticStageInterfaceOf, type AstSemanticStageInterface } from './astSemanticStageInterfaceAlgebra';
import { astMappingInterface, type AstMappingFact, type AstMappingInterface } from './astMappingInterface';
import type { AstSemanticTerm } from './astSemanticInterface';
import type { AstRuleName, AstWitnessName } from './ast';
import { astSemanticStageContract } from './astSemanticStageAuthority';
import { astSemanticStageProofOperations, type AstSemanticProofResult } from './astSemanticStageProof';
import type { StaticReceiver, StaticMethodAction } from './expression';
import type { ResourceSemanticMappingSourceKind, ResourceSemanticMappingTargetKind, ResourceStructuralMappingInput } from './resourceSemanticMappingInterface';
import { classNameEquals, methodNameEquals, createClassName, createMethodName, type ClassName, type MethodName } from './names';
import { astSemanticTextTerm } from './astSemanticInterface';
import { createUpstreamMappingPort, upstreamMappingFact } from './astSemanticStageAuthority';
import type { AstSemanticStagePort } from './astSemanticStageInterface';

export type ResourceMappingRelation =
  | 'source_kind'
  | 'semantic_kind'
  | 'literal_kind'
  | 'literal_semantic_kind';

type MappingRule = SemanticRelationRewrite<ResourceMappingRelation>;

const rule = (id: string, from: string, to: string, priority = 0): MappingRule => ({
  id,
  priority,
  when: [{ relation: 'source_kind', arguments: [from] }],
  then: [{ relation: 'semantic_kind', arguments: [to] }],
});

const RESOURCE_SEMANTIC_MAPPING_PAIRS = [
  ['binary_identical', 'strict_equal'],
  ['binary_equal', 'equal'],
  ['binary_not_identical', 'strict_not_equal'],
  ['binary_not_equal', 'not_equal'],
  ['binary_greater_than', 'greater'],
  ['binary_greater_or_equal', 'greater_equal'],
  ['binary_less_than', 'less'],
  ['binary_less_or_equal', 'less_equal'],
  ['binary_addition', 'add'],
  ['binary_subtraction', 'subtract'],
  ['binary_multiplication', 'multiply'],
  ['binary_division', 'divide'],
  ['binary_modulo', 'modulo'],
  ['binary_logical_and', 'and'],
  ['binary_logical_or', 'or'],
  ['binary_bitwise_or', 'bitwise_or'],
  ['binary_concat', 'concat'],
  ['unary_negative', 'negate'],
  ['unary_positive', 'positive'],
  ['unary_bitwise_not', 'bitwise_not'],
  ['unary_not', 'not'],
  ['cast_int', 'integer'],
  ['cast_float', 'float'],
  ['cast_string', 'string'],
  ['cast_bool', 'boolean'],
  ['cast_array', 'array'],
  ['cast_object', 'json'],
  ['assignment_set', 'set'],
  ['assignment_add', 'add'],
  ['assignment_subtract', 'subtract'],
  ['assignment_multiply', 'multiply'],
  ['assignment_divide', 'divide'],
  ['assignment_modulo', 'modulo'],
  ['assignment_concatenate', 'concatenate'],
  ['assignment_null_coalesce', 'null_coalesce'],
  ['assignment_power', 'power'],
  ['assignment_bitwise_and', 'bitwise_and'],
  ['assignment_bitwise_or', 'bitwise_or'],
  ['assignment_bitwise_xor', 'bitwise_xor'],
  ['assignment_shift_left', 'shift_left'],
  ['assignment_shift_right', 'shift_right'],
  ['reference_by_value', 'by_value'],
  ['reference_by_reference', 'by_reference'],
] as const satisfies readonly (readonly [ResourceSemanticMappingSourceKind, ResourceSemanticMappingTargetKind])[];

export const RESOURCE_SEMANTIC_MAPPING_RULES: readonly MappingRule[] = Object.freeze([
  ...relationProject(RESOURCE_SEMANTIC_MAPPING_PAIRS, ([from, to], index) => rule(`resource-semantic-map-${index}`, from, to)),
]);

const semanticKind = (sourceKind: ResourceSemanticMappingSourceKind): ResourceSemanticMappingTargetKind => {
  const mapping = relationLookup(RESOURCE_SEMANTIC_MAPPING_PAIRS, sourceKind);
  return relationOptionFold(
    mapping,
    () => { throw Error(`No declarative semantic mapping for ${sourceKind}`); },
    pair => pair[1],
  );
};

export const resolveResourceSemanticKind = semanticKind;

export const resolveResourceSemanticMappingPort = (sourceKind: ResourceSemanticMappingSourceKind): AstSemanticStagePort => createUpstreamMappingPort([
  upstreamMappingFact('upstream_maps', astSemanticTextTerm(sourceKind), astSemanticTextTerm(semanticKind(sourceKind))),
]);


const RESOURCE_STRUCTURAL_MAPPING_PAIRS = [

    ['argument_positional', 'positional'], ['argument_named', 'named'], ['argument_unpacked', 'unpacked'],
    ['array_entry_positional', 'implicit'], ['array_entry_keyed', 'keyed'], ['array_entry_unpacked', 'unpacked'],
    ['array_key_string', 'string_literal'], ['array_key_integer', 'number_literal'], ['array_key_expression', 'expression'],
    ['assignment_target_variable', 'variable'], ['assignment_target_variables', 'variables'], ['assignment_target_destructuring', 'destructuring'],
    ['assignment_target_property', 'property'], ['assignment_target_static_property', 'static_property'], ['assignment_target_array_element', 'index'], ['assignment_target_append', 'append'],
    ['destructuring_variable', 'variable'], ['destructuring_reference_variable', 'reference_variable'], ['destructuring_keyed', 'keyed'], ['destructuring_nested', 'nested'], ['destructuring_skipped', 'skipped'],
    ['static_property_owner_named_class', 'named_class'], ['static_property_owner_self', 'self'], ['static_property_owner_static', 'static'], ['static_property_owner_parent', 'parent'],
    ['parameter_type_primitive', 'primitive'], ['parameter_type_named', 'named'], ['parameter_type_nullable', 'nullable'],
    ['access_direct', 'direct'], ['access_nullsafe', 'nullsafe'],
    ['literal_string', 'string'], ['literal_number', 'number'], ['literal_boolean', 'boolean'], ['literal_null', 'null'],
    ['primitive_bool', 'boolean'], ['primitive_string', 'string'], ['primitive_int', 'number'], ['primitive_float', 'number'], ['primitive_mixed', 'mixed'], ['primitive_array', 'unspecified'],
  
] satisfies readonly (readonly [string, ResourceStructuralMappingTargetKind])[];


export const RESOURCE_STRUCTURAL_MAPPING_RULES: readonly MappingRule[] = Object.freeze([
  ...relationProject(RESOURCE_STRUCTURAL_MAPPING_PAIRS, ([from, to], index): MappingRule => ({
    id: `resource-structural-map-${index}`,
    priority: 0,
    when: [{ relation: 'source_kind', arguments: [from] }],
    then: [{ relation: 'semantic_kind', arguments: [to] }],
  })),
]);

export const RESOURCE_ALL_MAPPING_RULES: readonly MappingRule[] = Object.freeze([
  ...RESOURCE_SEMANTIC_MAPPING_RULES,
  ...RESOURCE_STRUCTURAL_MAPPING_RULES,
]);

/**
 * Structural mapping is a closed upstream vocabulary projection. The scanner supplies
 * source evidence; the authority returns a typed target discriminant. The executor does
 * not invoke the relational rewrite runtime or reinterpret an untyped result.
 */
export const resolveResourceStructuralKind = (
  input: ResourceStructuralMappingInput,
): ResourceStructuralMappingTargetKind => {
  const sourceKind = `${input.kind}_${input.sourceKind}`;
  const entries: readonly (readonly [string, ResourceStructuralMappingTargetKind])[] = RESOURCE_STRUCTURAL_MAPPING_PAIRS;
  const mapping = relationLookup(entries, sourceKind);
  return relationOptionFold(
    mapping,
    () => { throw Error(`No declarative structural mapping for ${sourceKind}`); },
    pair => pair[1],
  );
};

/**
 * Static receiver semantics are closed here, upstream. Scanner projections receive
 * the completed IR node and must not classify a string or select a constructor.
 */
export const resolveResourceStaticReceiver = (className: ClassName): StaticReceiver => relationGate(
  classNameEquals(className, createClassName('DB')),
  () => ({ kind: 'framework', receiver: { kind: 'database', name: className } }),
  () => relationGate(
    classNameEquals(className, createClassName('Attribute')),
    () => ({ kind: 'framework', receiver: { kind: 'attribute', name: className } }),
    () => ({ kind: 'class', name: className }),
  ),
);

/** Static action ownership also returns the completed semantic ADT, not a string label. */
export const resolveResourceStaticAction = (
  className: ClassName,
  method: MethodName,
): StaticMethodAction => relationGate(
  classNameEquals(className, createClassName('DB')) && methodNameEquals(method, createMethodName('raw')),
  () => ({ kind: 'database_raw' }),
  () => ({ kind: 'domain', name: method }),
);

const mappingTerm = (value: string): AstSemanticTerm => astSemanticTextTerm(value);
const mappingRule = (sourceKind: string): AstRuleName => ({ kind: 'ast_rule', value: { kind: 'string_value', value: `resource-semantic-map-${sourceKind}` } });
const mappingWitness = (sourceKind: string): AstWitnessName => ({ kind: 'ast_witness', value: { kind: 'string_value', value: `resource-semantic-map-witness-${sourceKind}` } });

export const resolveResourceAstMappingInterface = (sourceKind: ResourceSemanticMappingSourceKind): AstMappingInterface => {
  const targetKind = semanticKind(sourceKind);
  const source = mappingTerm(sourceKind);
  const target = mappingTerm(targetKind);
  const fact: AstMappingFact = Object.freeze({
    kind: 'ast_mapping_fact',
    relation: 'maps_source_to_upstream',
    source,
    target,
  });
  const origin: AstMappingFact = Object.freeze({
    kind: 'ast_mapping_preservation',
    relation: 'preserves_origin',
    source,
    target,
  });
  const refinement: AstMappingFact = Object.freeze({
    kind: 'ast_mapping_refinement',
    relation: 'refines_semantics',
    source,
    target,
  });
  const contract = astSemanticStageContract('upstream_mapping');
  const proofResult = astSemanticStageProofOperations.resolve('upstream_mapping', contract);
  const proof = relationOptionFold(
    relationRefine(proofResult, (value): value is AstSemanticProofResult & { readonly kind: 'proof' } => relationEqual(value.kind, 'proof')),
    () => ({
      kind: 'mapping_to_resolver_proof' as const,
      from: 'upstream_mapping' as const,
      to: 'resolver_graph' as const,
      preservation: contract.preservation,
      status: 'obligation' as const,
    }),
    value => value.proof,
  );
  const judgment = Object.freeze({
    kind: 'ast_mapping_judgment' as const,
    source,
    target,
    facts: Object.freeze([fact, origin, refinement]),
    derivations: Object.freeze([{
      kind: 'ast_mapping_derivation' as const,
      rule: mappingRule(sourceKind),
      witness: mappingWitness(sourceKind),
      premises: Object.freeze([fact]),
      conclusion: refinement,
    }]),
    preservation: contract.preservation,
    proof,
    closure: 'least_fixed_point' as const,
    reasoning: 'declarative_relation_rewrite_fixed_point' as const,
    authority: 'ast_mapping_judgment' as const,
    closed: true as const,
  });
  return astMappingInterface(judgment);
};

export const resolveResourceSemanticMappingInterface = (...args: Parameters<typeof resolveResourceSemanticMappingPort>): AstSemanticStageInterface =>
  astSemanticStageInterfaceOf(resolveResourceSemanticMappingPort(...args));
