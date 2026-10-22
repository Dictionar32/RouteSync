/** Public contract for source-to-semantic resource mapping. */
import type { AstSemanticStageInterface } from './astSemanticStageInterfaceAlgebra';
import type { AstMappingInterface } from './astMappingInterface';
import type { AstSemanticStagePort } from './astSemanticStageInterface';
import type { StaticReceiver, StaticMethodAction } from './expression';
import type { ClassName, MethodName } from './names';

export interface ResourceSemanticMappingContract {
  readonly kind: 'resource_semantic_mapping_contract';
  readonly version: 1;
  readonly sourceVocabulary: 'php-resource-ast-evidence';
  readonly targetVocabulary: 'upstream-semantic-ast';
  readonly ruleOwnership: 'upstream-semantic-algebra';
  readonly executorOwnership: 'generic-upstream-runtime';
  readonly unsupportedMapping: 'explicit-error';
}

export type ResourceStructuralMappingPrefix =
  | 'argument'
  | 'array_entry'
  | 'array_key'
  | 'assignment_target'
  | 'destructuring'
  | 'static_property_owner'
  | 'parameter_type'
  | 'access'
  | 'literal'
  | 'primitive';

export type ResourceStructuralMappingSourceKind =
  | 'positional' | 'named' | 'unpacked' | 'keyed' | 'string' | 'integer' | 'expression'
  | 'variable' | 'variables' | 'destructuring' | 'property' | 'static_property' | 'array_element' | 'append'
  | 'reference_variable' | 'nested' | 'skipped' | 'named_class' | 'named' | 'self' | 'static' | 'parent'
  | 'primitive' | 'nullable' | 'direct' | 'nullsafe' | 'number' | 'boolean' | 'null'
  | 'bool' | 'int' | 'float' | 'mixed' | 'array';

export type ResourceStructuralMappingTargetKind =
  | 'positional' | 'named' | 'unpacked' | 'implicit' | 'keyed' | 'string_literal' | 'number_literal' | 'expression'
  | 'variable' | 'variables' | 'destructuring' | 'property' | 'static_property' | 'index' | 'append'
  | 'reference_variable' | 'nested' | 'skipped' | 'named_class' | 'named' | 'self' | 'static' | 'parent'
  | 'primitive' | 'nullable' | 'direct' | 'nullsafe' | 'string' | 'number' | 'boolean' | 'null'
  | 'mixed' | 'unspecified';

/**
 * Closed structural evidence vocabulary. Each variant owns the source kinds
 * that are valid for its structural domain, preventing invalid prefix/kind
 * combinations from crossing the upstream authority boundary.
 */
export type ResourceStructuralMappingInput =
  | Readonly<{ readonly kind: 'argument'; readonly sourceKind: 'positional' | 'named' | 'unpacked' }>
  | Readonly<{ readonly kind: 'array_entry'; readonly sourceKind: 'positional' | 'keyed' | 'unpacked' }>
  | Readonly<{ readonly kind: 'array_key'; readonly sourceKind: 'string' | 'integer' | 'expression' }>
  | Readonly<{ readonly kind: 'assignment_target'; readonly sourceKind: 'variable' | 'variables' | 'destructuring' | 'property' | 'static_property' | 'array_element' | 'append' }>
  | Readonly<{ readonly kind: 'destructuring'; readonly sourceKind: 'variable' | 'reference_variable' | 'keyed' | 'nested' | 'skipped' }>
  | Readonly<{ readonly kind: 'static_property_owner'; readonly sourceKind: 'named_class' | 'self' | 'static' | 'parent' }>
  | Readonly<{ readonly kind: 'parameter_type'; readonly sourceKind: 'primitive' | 'named' | 'nullable' }>
  | Readonly<{ readonly kind: 'access'; readonly sourceKind: 'direct' | 'nullsafe' }>
  | Readonly<{ readonly kind: 'literal'; readonly sourceKind: 'string' | 'number' | 'boolean' | 'null' }>
  | Readonly<{ readonly kind: 'primitive'; readonly sourceKind: 'bool' | 'string' | 'int' | 'float' | 'mixed' | 'array' }>;

/** Closed source vocabulary accepted by the upstream semantic mapping authority. */
export type ResourceSemanticMappingSourceKind =
  'binary_identical' |
  'binary_equal' |
  'binary_not_identical' |
  'binary_not_equal' |
  'binary_greater_than' |
  'binary_greater_or_equal' |
  'binary_less_than' |
  'binary_less_or_equal' |
  'binary_addition' |
  'binary_subtraction' |
  'binary_multiplication' |
  'binary_division' |
  'binary_modulo' |
  'binary_logical_and' |
  'binary_logical_or' |
  'binary_bitwise_or' |
  'binary_concat' |
  'unary_negative' |
  'unary_positive' |
  'unary_bitwise_not' |
  'unary_not' |
  'cast_int' |
  'cast_float' |
  'cast_string' |
  'cast_bool' |
  'cast_array' |
  'cast_object' |
  'assignment_set' |
  'assignment_add' |
  'assignment_subtract' |
  'assignment_multiply' |
  'assignment_divide' |
  'assignment_modulo' |
  'assignment_concatenate' |
  'assignment_null_coalesce' |
  'assignment_power' |
  'assignment_bitwise_and' |
  'assignment_bitwise_or' |
  'assignment_bitwise_xor' |
  'assignment_shift_left' |
  'assignment_shift_right' |
  'reference_by_value' |
  'reference_by_reference';

/** Closed target vocabulary emitted by the upstream semantic mapping authority. */
export type ResourceSemanticMappingTargetKind =
  'strict_equal' |
  'equal' |
  'strict_not_equal' |
  'not_equal' |
  'greater' |
  'greater_equal' |
  'less' |
  'less_equal' |
  'add' |
  'subtract' |
  'multiply' |
  'divide' |
  'modulo' |
  'and' |
  'or' |
  'bitwise_or' |
  'concat' |
  'negate' |
  'positive' |
  'bitwise_not' |
  'not' |
  'integer' |
  'float' |
  'string' |
  'boolean' |
  'array' |
  'json' |
  'set' |
  'concatenate' |
  'null_coalesce' |
  'power' |
  'bitwise_and' |
  'bitwise_xor' |
  'shift_left' |
  'shift_right' |
  'by_value' |
  'by_reference';

export interface ResourceSemanticMappingAuthorityInterface {
  readonly kind: 'resource_semantic_mapping_authority';
  readonly contract: ResourceSemanticMappingContract;
  readonly resolveSemanticKind: (sourceKind: ResourceSemanticMappingSourceKind) => ResourceSemanticMappingTargetKind;
  readonly resolveStructuralKind: (input: ResourceStructuralMappingInput) => ResourceStructuralMappingTargetKind;
  readonly resolveStaticReceiver: (className: ClassName) => StaticReceiver;
  readonly resolveStaticAction: (className: ClassName, method: MethodName) => StaticMethodAction;
  readonly resolveMappingPort: (sourceKind: ResourceSemanticMappingSourceKind) => AstSemanticStagePort;
  readonly resolveAstMappingInterface: (sourceKind: ResourceSemanticMappingSourceKind) => AstMappingInterface;
  readonly resolveMappingInterface: (sourceKind: ResourceSemanticMappingSourceKind) => AstSemanticStageInterface;
}

