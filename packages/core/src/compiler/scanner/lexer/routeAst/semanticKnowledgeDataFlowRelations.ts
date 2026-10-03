import { relationContains, relationUnique } from '../../../../semantic/kernel/relationMembership';
import { relationAll, relationAny, relationEqual, relationNotEqual, relationResolve } from '../../../relational/sequence';
import { typedDefine, typedDistinct, typedProject, typedRelation, typedSelect } from './semanticTypedRelation';
import type { SemanticClosureResult } from './semanticClosureEngine';
/**
 * Phase 163 — semantic Knowledge/Data-Flow source of truth.
 *
 * This model intentionally knows nothing about Tree-sitter, PhpAstValue, or
 * statement syntax. Syntax producers only provide evidence/provenance.
 * A relation connects semantic facts; graph insertion order never defines semantics.
 */
export interface SemanticText {
    readonly kind: 'text';
    readonly value: string;
}
export interface SemanticNumber {
    readonly kind: 'number';
    readonly value: number;
}
export interface SemanticBoolean {
    readonly kind: 'boolean';
    readonly value: boolean;
}
export type SemanticEvidenceProviderCode = 'parser' | 'lexer' | 'language_service' | 'framework_model' | 'reflection' | 'inference' | 'compiler_ir' | 'runtime_metadata';
export interface SemanticEvidenceProvider {
    readonly code: SemanticEvidenceProviderCode;
}
export const SEMANTIC_EVIDENCE_PROVIDER_KNOWLEDGE: readonly SemanticEvidenceProvider[] = Object.freeze(typedDefine(['parser', 'lexer', 'language_service', 'framework_model', 'reflection', 'inference', 'compiler_ir', 'runtime_metadata'] satisfies SemanticEvidenceProviderCode[], code => Object.freeze({ code }) satisfies SemanticEvidenceProvider));
export interface SemanticSource {
    readonly filePath: SemanticText;
    readonly span: SemanticSourceSpan;
    readonly evidence: SemanticEvidenceProvider;
}
export interface SemanticSourceOffset {
    readonly kind: 'source-offset';
    readonly value: number;
}
export interface SemanticSourceSpan {
    readonly kind: 'source-span';
    readonly start: SemanticSourceOffset;
    readonly end: SemanticSourceOffset;
}
/**
 * Semantic absence is data and is represented by SemanticPresence.
 */
export type SemanticAbsenceReasonCode = 'not_applicable' | 'not_provided' | 'empty_clause' | 'void_emission';
export interface SemanticAbsenceReasonDefinition {
    readonly code: SemanticAbsenceReasonCode;
}
export type SemanticPresence<T> = {
    readonly kind: 'present';
    readonly value: T;
} | {
    readonly kind: 'absent';
    readonly reason: SemanticAbsenceReasonDefinition;
};
export const SEMANTIC_ABSENCE_REASON_KNOWLEDGE: readonly SemanticAbsenceReasonDefinition[] = Object.freeze(typedDefine(['not_applicable', 'not_provided', 'empty_clause', 'void_emission'] satisfies SemanticAbsenceReasonCode[], code => Object.freeze({ code }) satisfies SemanticAbsenceReasonDefinition));
export const semanticPresent = <T>(value: T): SemanticPresence<T> => Object.freeze({ kind: 'present', value });
export const semanticAbsent = <T>(code: SemanticAbsenceReasonCode): SemanticPresence<T> => Object.freeze({ kind: 'absent', reason: Object.freeze({ code }) });
export interface SemanticKnowledgeIdentity {
    readonly kind: 'knowledge-identity';
    readonly source: SemanticSource;
    readonly role: SemanticKnowledgeRoleCode;
    readonly slot: SemanticText;
}
export interface KnowledgeId {
    readonly kind: 'knowledge-id';
    readonly identity: SemanticKnowledgeIdentity;
}
export interface SemanticIdentifier {
    readonly kind: 'identifier';
    readonly value: SemanticText;
}
export interface SemanticOperation {
    readonly kind: 'operation';
    readonly name: SemanticText;
}
export type SemanticLiteral = {
    readonly kind: 'string';
    readonly value: SemanticText;
} | {
    readonly kind: 'number';
    readonly value: SemanticNumber;
} | {
    readonly kind: 'boolean';
    readonly value: SemanticBoolean;
} | {
    readonly kind: 'null';
};
export interface SemanticScope {
    readonly id: KnowledgeId;
    readonly source: SemanticPresence<SemanticSource>;
}
export interface SemanticTextValue {
    readonly kind: 'text';
    readonly value: SemanticText;
}
export type SemanticValueKindCode = 'literal' | 'variable' | 'constant' | 'property' | 'array_access' | 'invocation';
export interface SemanticValueKindDefinition {
    readonly code: SemanticValueKindCode;
}
export const SEMANTIC_VALUE_KIND_KNOWLEDGE: readonly SemanticValueKindDefinition[] = Object.freeze(typedDefine(['literal', 'variable', 'constant', 'property', 'array_access', 'invocation'] satisfies SemanticValueKindCode[], code => Object.freeze({ code }) satisfies SemanticValueKindDefinition));
export type SemanticOperatorCategoryCode = 'comparison' | 'arithmetic' | 'logical' | 'bitwise' | 'string' | 'unary';
export type SemanticOperatorCode = 'equal' | 'not_equal' | 'identical' | 'not_identical' | 'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal' | 'addition' | 'subtraction' | 'multiplication' | 'division' | 'modulo' | 'logical_and' | 'logical_or' | 'bitwise_or' | 'concat' | 'not' | 'negative' | 'positive' | 'bitwise_not';
export interface SemanticOperatorCategoryDefinition {
    readonly code: SemanticOperatorCategoryCode;
}
export const SEMANTIC_OPERATOR_CATEGORY_KNOWLEDGE: readonly SemanticOperatorCategoryDefinition[] = Object.freeze(typedDefine(['comparison', 'arithmetic', 'logical', 'bitwise', 'string', 'unary'] satisfies SemanticOperatorCategoryCode[], code => Object.freeze({ code }) satisfies SemanticOperatorCategoryDefinition));
export interface SemanticVariable {
    readonly id: KnowledgeId;
    readonly name: SemanticIdentifier;
    readonly scope: KnowledgeId;
    readonly source: SemanticSource;
}
export interface SemanticValue {
    readonly id: KnowledgeId;
    readonly kind: SemanticValueKindDefinition;
    readonly name: SemanticPresence<SemanticIdentifier>;
    readonly value: SemanticPresence<SemanticLiteral>;
    readonly source: SemanticSource;
}
export type SemanticOperatorArityCode = 'unary' | 'binary';
export type SemanticOperatorResultCode = 'boolean' | 'number' | 'string' | 'value';
export interface SemanticOperatorMeaningDefinition {
    readonly code: SemanticOperatorCode;
    readonly arity: SemanticOperatorArityCode;
    readonly result: SemanticOperatorResultCode;
}
export type SemanticOperatorFactKindCode = 'comparison' | 'binary-operation' | 'unary-operation';
export interface SemanticOperatorDefinition {
    readonly code: SemanticOperatorCode;
    readonly category: SemanticOperatorCategoryDefinition;
    readonly meaning: SemanticOperatorMeaningDefinition;
    /** Canonical semantic fact shape produced by this operator. */
    readonly factKind: SemanticOperatorFactKindCode;
}
export interface SemanticOperator {
    readonly id: KnowledgeId;
    readonly definition: SemanticOperatorDefinition;
    readonly source: SemanticSource;
}
export interface SemanticComparison {
    readonly id: KnowledgeId;
    readonly operator: KnowledgeId;
    readonly left: KnowledgeId;
    readonly right: KnowledgeId;
    readonly source: SemanticSource;
}
/**
 * A binary operator application is semantic knowledge, independent of syntax nodes.
 * Comparisons are a specialized binary operation, where arithmetic, logical,
 * bitwise, and string operations retain the same typed operand structure.
 */
export interface SemanticBinaryOperation {
    readonly id: KnowledgeId;
    readonly operator: KnowledgeId;
    readonly left: KnowledgeId;
    readonly right: KnowledgeId;
    readonly source: SemanticSource;
}
/**
 * A unary operator application is semantic knowledge, not a generic expression value.
 */
export interface SemanticUnaryOperation {
    readonly id: KnowledgeId;
    readonly operator: KnowledgeId;
    readonly operand: KnowledgeId;
    readonly source: SemanticSource;
}
export type SemanticPredicateMeaningCode = 'boolean_evaluation' | 'nullish_evaluation' | 'match';
export interface SemanticPredicateMeaningDefinition {
    readonly code: SemanticPredicateMeaningCode;
}
export const SEMANTIC_PREDICATE_MEANING_KNOWLEDGE: readonly SemanticPredicateMeaningDefinition[] = Object.freeze(typedDefine(['boolean_evaluation', 'nullish_evaluation', 'match'] satisfies SemanticPredicateMeaningCode[], code => Object.freeze({ code }) satisfies SemanticPredicateMeaningDefinition));
export interface SemanticPredicate {
    readonly id: KnowledgeId;
    readonly meaning: SemanticPredicateMeaningDefinition;
    readonly expression: KnowledgeId;
    readonly source: SemanticSource;
}
export type SemanticMatchModeCode = 'loose' | 'strict';
export interface SemanticMatchModeDefinition {
    readonly code: SemanticMatchModeCode;
}
export const SEMANTIC_MATCH_MODE_KNOWLEDGE: readonly SemanticMatchModeDefinition[] = Object.freeze(typedDefine(['loose', 'strict'] satisfies SemanticMatchModeCode[], code => Object.freeze({ code }) satisfies SemanticMatchModeDefinition));
export interface SemanticMatch {
    readonly id: KnowledgeId;
    readonly mode: SemanticMatchModeDefinition;
    readonly subject: KnowledgeId;
    readonly candidate: KnowledgeId;
    readonly source: SemanticSource;
}
export type SemanticPredicatePolarity = 'satisfied' | 'unsatisfied';
export interface SemanticMerge {
    readonly id: KnowledgeId;
    readonly values: readonly KnowledgeId[];
    readonly selector: SemanticPresence<KnowledgeId>;
    readonly source: SemanticSource;
}
export type SemanticOutcomeRoleCode = 'satisfied' | 'unsatisfied' | 'matched' | 'unmatched' | 'default';
export interface SemanticOutcomeRoleDefinition {
    readonly code: SemanticOutcomeRoleCode;
}
export const SEMANTIC_OUTCOME_ROLE_KNOWLEDGE: readonly SemanticOutcomeRoleDefinition[] = Object.freeze(typedDefine(['satisfied', 'unsatisfied', 'matched', 'unmatched', 'default'] satisfies SemanticOutcomeRoleCode[], code => Object.freeze({ code }) satisfies SemanticOutcomeRoleDefinition));
export interface SemanticOutcome {
    readonly id: KnowledgeId;
    readonly value: SemanticPresence<KnowledgeId>;
    readonly role: SemanticOutcomeRoleDefinition;
    readonly source: SemanticSource;
}
export type SemanticAssignmentOperatorCode = 'set' | 'add' | 'subtract' | 'multiply' | 'divide' | 'modulo' | 'concatenate' | 'null_coalesce' | 'power' | 'bitwise_and' | 'bitwise_or' | 'bitwise_xor' | 'shift_left' | 'shift_right';
export interface SemanticAssignmentOperatorDefinition {
    readonly code: SemanticAssignmentOperatorCode;
}
export type SemanticAssignmentEffectCode = 'write' | 'read-write';
export interface SemanticAssignmentEffectDefinition {
    readonly code: SemanticAssignmentEffectCode;
    readonly operators: readonly SemanticAssignmentOperatorCode[];
}
/** Semantic operator→memory-effect knowledge; consumers do not encode operator policy. */
export const SEMANTIC_ASSIGNMENT_EFFECT_KNOWLEDGE: readonly SemanticAssignmentEffectDefinition[] = Object.freeze([
    Object.freeze({ code: 'write', operators: Object.freeze(['set'] satisfies SemanticAssignmentOperatorCode[]) }),
    Object.freeze({
        code: 'read-write',
        operators: Object.freeze([
            'add', 'subtract', 'multiply', 'divide', 'modulo', 'concatenate', 'null_coalesce',
            'power', 'bitwise_and', 'bitwise_or', 'bitwise_xor', 'shift_left', 'shift_right',
        ] satisfies SemanticAssignmentOperatorCode[]),
    }),
]);
export const semanticAssignmentEffect = (operator: SemanticAssignmentOperatorCode): SemanticPresence<SemanticAssignmentEffectDefinition> => relationResolve(SEMANTIC_ASSIGNMENT_EFFECT_KNOWLEDGE.find(effect => effect.operators.includes(operator)), effect => semanticPresent(effect), () => semanticAbsent('not_provided'));
export const SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE: readonly SemanticAssignmentOperatorDefinition[] = Object.freeze(typedDefine([
    'set', 'add', 'subtract', 'multiply', 'divide', 'modulo', 'concatenate',
    'null_coalesce', 'power', 'bitwise_and', 'bitwise_or', 'bitwise_xor',
    'shift_left', 'shift_right',
] satisfies SemanticAssignmentOperatorCode[], code => Object.freeze({ code }) satisfies SemanticAssignmentOperatorDefinition));
export type SemanticAssignmentReferenceCode = 'by_value' | 'by_reference';
export interface SemanticAssignmentReferenceDefinition {
    readonly code: SemanticAssignmentReferenceCode;
}
export const SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE: readonly SemanticAssignmentReferenceDefinition[] = Object.freeze(typedDefine(['by_value', 'by_reference'] satisfies SemanticAssignmentReferenceCode[], code => Object.freeze({ code }) satisfies SemanticAssignmentReferenceDefinition));
export const semanticAssignmentReference = (code: SemanticAssignmentReferenceCode): SemanticPresence<SemanticAssignmentReferenceDefinition> => relationResolve(SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE.find(definition => relationEqual(definition.code, code)), definition => semanticPresent(definition), () => semanticAbsent('not_provided'));
export interface SemanticAssignment {
    readonly id: KnowledgeId;
    readonly target: KnowledgeId;
    readonly value: KnowledgeId;
    readonly operator: SemanticAssignmentOperatorDefinition;
    readonly reference: SemanticAssignmentReferenceDefinition;
    readonly source: SemanticSource;
}
export type SemanticBindingOriginCode = 'parameter' | 'assignment' | 'iteration' | 'exception_handler';
export interface SemanticBindingOriginDefinition {
    readonly code: SemanticBindingOriginCode;
}
export const SEMANTIC_BINDING_ORIGIN_KNOWLEDGE: readonly SemanticBindingOriginDefinition[] = Object.freeze(typedDefine(['parameter', 'assignment', 'iteration', 'exception_handler'] satisfies SemanticBindingOriginCode[], code => Object.freeze({ code }) satisfies SemanticBindingOriginDefinition));
/**
 * A binding is semantic knowledge about a name receiving a value. Availability
 * is represented by a knowledge dependency rather than a statement path/index.
 */
export interface SemanticBinding {
    readonly id: KnowledgeId;
    readonly variable: KnowledgeId;
    readonly value: SemanticPresence<KnowledgeId>;
    readonly origin: SemanticBindingOriginDefinition;
    readonly availability: SemanticPresence<KnowledgeId>;
    readonly source: SemanticSource;
}
/** A variable occurrence raised into semantic knowledge rather than inferred from statement traversal. */
export interface SemanticReference {
    readonly id: KnowledgeId;
    readonly variable: KnowledgeId;
    readonly availability: SemanticPresence<KnowledgeId>;
    readonly source: SemanticSource;
}
/**
 * A callable is semantic knowledge about a value-producing/exception-producing
 * boundary. It deliberately does not encode a function-declaration syntax node.
 * Parameters, body and emissions are identities in the canonical knowledge model.
 */
export interface SemanticCallable {
    readonly id: KnowledgeId;
    readonly name: SemanticPresence<SemanticIdentifier>;
    readonly parameters: readonly KnowledgeId[];
    readonly body: SemanticPresence<KnowledgeId>;
    readonly emissions: readonly KnowledgeId[];
    readonly source: SemanticSource;
}
export interface SemanticInvocation {
    readonly id: KnowledgeId;
    readonly receiver: SemanticPresence<KnowledgeId>;
    readonly operation: SemanticOperation;
    readonly arguments: readonly KnowledgeId[];
    readonly source: SemanticSource;
}
export type SemanticCastCode = 'int' | 'float' | 'string' | 'bool' | 'array' | 'object';
export interface SemanticCastDefinition {
    readonly code: SemanticCastCode;
}
export const SEMANTIC_CAST_KNOWLEDGE: readonly SemanticCastDefinition[] = Object.freeze(typedDefine(['int', 'float', 'string', 'bool', 'array', 'object'] satisfies SemanticCastCode[], code => Object.freeze({ code }) satisfies SemanticCastDefinition));
export interface SemanticCast {
    readonly id: KnowledgeId;
    readonly definition: SemanticCastDefinition;
    readonly operand: KnowledgeId;
    readonly source: SemanticSource;
}
export interface SemanticArrayEntry {
    readonly key: SemanticPresence<KnowledgeId>;
    readonly value: KnowledgeId;
}
export interface SemanticArray {
    readonly id: KnowledgeId;
    readonly entries: readonly SemanticArrayEntry[];
    readonly source: SemanticSource;
}
export interface SemanticStaticInvocation {
    readonly id: KnowledgeId;
    readonly className: SemanticIdentifier;
    readonly operation: SemanticOperation;
    readonly arguments: readonly KnowledgeId[];
    readonly source: SemanticSource;
}
export interface SemanticConstruction {
    readonly id: KnowledgeId;
    readonly className: SemanticPresence<SemanticIdentifier>;
    readonly classExpression: SemanticPresence<KnowledgeId>;
    readonly arguments: readonly KnowledgeId[];
    readonly source: SemanticSource;
}
export interface SemanticTypeCheck {
    readonly id: KnowledgeId;
    readonly expression: KnowledgeId;
    readonly className: SemanticIdentifier;
    readonly source: SemanticSource;
}
export interface SemanticClassReference {
    readonly id: KnowledgeId;
    readonly className: SemanticIdentifier;
    readonly source: SemanticSource;
}
export interface SemanticClassConstant {
    readonly id: KnowledgeId;
    readonly owner: SemanticIdentifier;
    readonly name: SemanticIdentifier;
    readonly source: SemanticSource;
}
export interface SemanticResourceAccess {
    readonly id: KnowledgeId;
    readonly resource: SemanticIdentifier;
    readonly argument: KnowledgeId;
    readonly source: SemanticSource;
}
export interface SemanticInterpolatedString {
    readonly id: KnowledgeId;
    readonly parts: readonly KnowledgeId[];
    readonly source: SemanticSource;
}
export interface SemanticMagicConstant {
    readonly id: KnowledgeId;
    readonly name: SemanticText;
    readonly source: SemanticSource;
}
export interface SemanticClosure {
    readonly id: KnowledgeId;
    readonly parameters: readonly SemanticIdentifier[];
    readonly captures: readonly SemanticIdentifier[];
    readonly returnType: SemanticPresence<SemanticText>;
    readonly body: KnowledgeId;
    readonly source: SemanticSource;
}
export interface SemanticArrowFunction {
    readonly id: KnowledgeId;
    readonly parameters: readonly SemanticIdentifier[];
    readonly body: KnowledgeId;
    readonly source: SemanticSource;
}
export interface SemanticAnonymousClass {
    readonly id: KnowledgeId;
    readonly extendsClass: SemanticPresence<SemanticIdentifier>;
    readonly source: SemanticSource;
}
export interface SemanticUnsupportedExpression {
    readonly id: KnowledgeId;
    readonly reason: SemanticText;
    readonly source: SemanticSource;
}
export type SemanticAccessModeCode = 'direct' | 'nullsafe';
export interface SemanticAccessModeDefinition {
    readonly code: SemanticAccessModeCode;
}
export const SEMANTIC_ACCESS_MODE_KNOWLEDGE: readonly SemanticAccessModeDefinition[] = Object.freeze(typedDefine(['direct', 'nullsafe'] satisfies SemanticAccessModeCode[], code => Object.freeze({ code }) satisfies SemanticAccessModeDefinition));
export interface SemanticAccess {
    readonly id: KnowledgeId;
    readonly receiver: KnowledgeId;
    readonly member: SemanticIdentifier | KnowledgeId;
    readonly mode: SemanticAccessModeDefinition;
    readonly source: SemanticSource;
}
export type SemanticEmissionCode = 'result' | 'exception';
export interface SemanticEmissionDefinition {
    readonly code: SemanticEmissionCode;
}
export const SEMANTIC_EMISSION_KNOWLEDGE: readonly SemanticEmissionDefinition[] = Object.freeze(typedDefine(['result', 'exception'] satisfies SemanticEmissionCode[], code => Object.freeze({ code }) satisfies SemanticEmissionDefinition));
/**
 * A semantic emission records a produced function result or raised exception
 * without encoding an execution transition, successor, or terminator edge.
 */
export interface SemanticEmission {
    readonly id: KnowledgeId;
    readonly definition: SemanticEmissionDefinition;
    readonly value: SemanticPresence<KnowledgeId>;
    readonly source: SemanticSource;
}
export type SemanticIncludeCode = 'include' | 'include_once' | 'require' | 'require_once';
export interface SemanticIncludeDefinition {
    readonly code: SemanticIncludeCode;
}
export const SEMANTIC_INCLUDE_KNOWLEDGE: readonly SemanticIncludeDefinition[] = Object.freeze(typedDefine(['include', 'include_once', 'require', 'require_once'] satisfies SemanticIncludeCode[], code => Object.freeze({ code }) satisfies SemanticIncludeDefinition));
export interface SemanticInclude {
    readonly id: KnowledgeId;
    readonly definition: SemanticIncludeDefinition;
    readonly expression: KnowledgeId;
    readonly source: SemanticSource;
}
export interface SemanticUnset {
    readonly id: KnowledgeId;
    readonly targets: readonly KnowledgeId[];
    readonly source: SemanticSource;
}
/**
 * A syntax-neutral semantic region. It is a container holding related facts rather than
 * a source-control node. Source constructs may provide evidence supporting
 * a region, but the region itself has no control ontology.
 */
export interface SemanticRegion {
    readonly id: KnowledgeId;
    readonly source: SemanticSource;
}
export interface SemanticExceptionHandler {
    readonly id: KnowledgeId;
    readonly exceptionType: KnowledgeId;
    readonly variable: SemanticPresence<SemanticIdentifier>;
    readonly body: KnowledgeId;
    readonly source: SemanticSource;
}
export interface SemanticExceptionBoundary {
    readonly id: KnowledgeId;
    readonly body: KnowledgeId;
    readonly catches: readonly KnowledgeId[];
    readonly finallyBlock: SemanticPresence<KnowledgeId>;
    readonly source: SemanticSource;
}
export type SemanticFact = {
    readonly kind: 'variable';
    readonly value: SemanticVariable;
} | {
    readonly kind: 'value';
    readonly value: SemanticValue;
} | {
    readonly kind: 'operator';
    readonly value: SemanticOperator;
} | {
    readonly kind: 'comparison';
    readonly value: SemanticComparison;
} | {
    readonly kind: 'binary-operation';
    readonly value: SemanticBinaryOperation;
} | {
    readonly kind: 'unary-operation';
    readonly value: SemanticUnaryOperation;
} | {
    readonly kind: 'predicate';
    readonly value: SemanticPredicate;
} | {
    readonly kind: 'merge';
    readonly value: SemanticMerge;
} | {
    readonly kind: 'match';
    readonly value: SemanticMatch;
} | {
    readonly kind: 'outcome';
    readonly value: SemanticOutcome;
} | {
    readonly kind: 'assignment';
    readonly value: SemanticAssignment;
} | {
    readonly kind: 'binding';
    readonly value: SemanticBinding;
} | {
    readonly kind: 'reference';
    readonly value: SemanticReference;
} | {
    readonly kind: 'callable';
    readonly value: SemanticCallable;
} | {
    readonly kind: 'invocation';
    readonly value: SemanticInvocation;
} | {
    readonly kind: 'access';
    readonly value: SemanticAccess;
} | {
    readonly kind: 'cast';
    readonly value: SemanticCast;
} | {
    readonly kind: 'array';
    readonly value: SemanticArray;
} | {
    readonly kind: 'static-invocation';
    readonly value: SemanticStaticInvocation;
} | {
    readonly kind: 'construction';
    readonly value: SemanticConstruction;
} | {
    readonly kind: 'type-check';
    readonly value: SemanticTypeCheck;
} | {
    readonly kind: 'class-reference';
    readonly value: SemanticClassReference;
} | {
    readonly kind: 'class-constant';
    readonly value: SemanticClassConstant;
} | {
    readonly kind: 'resource-access';
    readonly value: SemanticResourceAccess;
} | {
    readonly kind: 'interpolated-string';
    readonly value: SemanticInterpolatedString;
} | {
    readonly kind: 'magic-constant';
    readonly value: SemanticMagicConstant;
} | {
    readonly kind: 'closure';
    readonly value: SemanticClosure;
} | {
    readonly kind: 'arrow-function';
    readonly value: SemanticArrowFunction;
} | {
    readonly kind: 'anonymous-class';
    readonly value: SemanticAnonymousClass;
} | {
    readonly kind: 'unsupported-expression';
    readonly value: SemanticUnsupportedExpression;
} | {
    readonly kind: 'emission';
    readonly value: SemanticEmission;
} | {
    readonly kind: 'include';
    readonly value: SemanticInclude;
} | {
    readonly kind: 'unset';
    readonly value: SemanticUnset;
} | {
    readonly kind: 'region';
    readonly value: SemanticRegion;
} | {
    readonly kind: 'exception-handler';
    readonly value: SemanticExceptionHandler;
} | {
    readonly kind: 'exception';
    readonly value: SemanticExceptionBoundary;
} | {
    readonly kind: 'scope';
    readonly value: SemanticScope;
};
export type SemanticKnowledgeRoleCode = SemanticFact['kind'] | 'reference';
export type SemanticDataFlowRelationCode = 'depends_on' | 'flows_to';
export interface SemanticDataFlowRelationDefinition {
    readonly code: SemanticDataFlowRelationCode;
}
/**
 * The relation code answers *what class of flow* exists. The role answers
 * *why the source participates in the target*. This is semantic knowledge,
 * not a Tree-sitter field name and not an execution-order edge.
 */
export type SemanticDataFlowRoleCode = 'operator' | 'operand_left' | 'operand_right' | 'operand' | 'receiver' | 'index' | 'part' | 'argument' | 'callable' | 'array_key' | 'array_value' | 'class_expression' | 'value' | 'predicate' | 'alternative' | 'subject' | 'candidate' | 'body' | 'initializer' | 'update' | 'iterable' | 'target' | 'binding' | 'emitted_value' | 'exception_type' | 'handler' | 'finally_block' | 'member' | 'availability';
export interface SemanticDataFlowRoleDefinition {
    readonly code: SemanticDataFlowRoleCode;
}
export const SEMANTIC_DATA_FLOW_ROLE_KNOWLEDGE: readonly SemanticDataFlowRoleDefinition[] = Object.freeze(typedDefine([
    'operator', 'operand_left', 'operand_right', 'operand', 'receiver', 'index',
    'part', 'argument', 'callable', 'array_key', 'array_value', 'class_expression',
    'value', 'predicate', 'alternative', 'subject', 'candidate',
    'body', 'initializer', 'update', 'iterable', 'target', 'binding',
    'emitted_value', 'exception_type', 'handler', 'finally_block', 'member', 'availability',
] satisfies SemanticDataFlowRoleCode[], code => Object.freeze({ code }) satisfies SemanticDataFlowRoleDefinition));
/**
 * A guard is semantic data, not a CFG edge. It records the predicate under
 * which a dependency/value-flow is valid, allowing path-sensitive reasoning
 * without making source control syntax the source of truth.
 */
export interface SemanticFlowGuard {
    readonly predicate: KnowledgeId;
    readonly polarity: SemanticPredicatePolarity;
}
export type SemanticDataFlowFact = {
    readonly kind: 'dependency';
    readonly source: KnowledgeId;
    readonly target: KnowledgeId;
    readonly role: SemanticDataFlowRoleDefinition;
    readonly guard: SemanticPresence<SemanticFlowGuard>;
} | {
    readonly kind: 'value-flow';
    readonly source: KnowledgeId;
    readonly target: KnowledgeId;
    readonly role: SemanticDataFlowRoleDefinition;
    readonly guard: SemanticPresence<SemanticFlowGuard>;
};
/**
 * Derived graph projection. Data-flow facts are canonical; this edge shape is
 * compatibility/index projection consumed by graph-oriented consumers only.
 */
export interface SemanticDataFlowEdge {
    readonly from: KnowledgeId;
    readonly to: KnowledgeId;
    readonly relation: SemanticDataFlowRelationDefinition;
    readonly role: SemanticDataFlowRoleDefinition;
}
export interface SemanticKnowledgeDataFlow {
    readonly facts: readonly SemanticFact[];
    readonly dataFlow: readonly SemanticDataFlowFact[];
    /**
     * Declarative control relations derived from canonical semantic facts and
     * saturated by the relation solver. They are a semantic projection, not
     * syntax/control-flow nodes.
     */
    /** Canonical construct-free semantic relations consumed by the solver/rewrite layer. */
    readonly semanticRelations?: readonly import('./semanticRelationTheory').SemanticTheoryFact[];
    /** Canonical proof-carrying closure; the only semantic input used by new lowering. */
    readonly semanticClosure?: SemanticClosureResult;
    /** @deprecated Derived graph projection; dataFlow is canonical. */
    readonly relations: readonly SemanticDataFlowEdge[];
}
/**
 * Canonical-model invariant validation. This does not construct the model; it
 * only verifies that the facts remain the source of truth and every data-flow
 * edge references knowledge that actually exists in those facts. Any Set used
 * here is a temporary validation index, never semantic state.
 */
export const validateSemanticKnowledgeDataFlow = (dataFlow: SemanticKnowledgeDataFlow): void => {
    const fail = (message: string) => { throw Error(message); };
    const facts = typedRelation(dataFlow.facts);
    const factKeys = typedProject(facts, fact => knowledgeIdKey(fact.value.id)).tuples;
    const uniqueFactKeys = relationUnique(typedDistinct(typedRelation(factKeys), key => key).tuples);
    relationResolve(relationNotEqual(factKeys.length, uniqueFactKeys.length), () => fail('Duplicate semantic knowledge identity detected'), () => { });
    const unknownFlowEndpoint = typedSelect(typedRelation(dataFlow.dataFlow), flow => relationAny([relationEqual(relationContains(uniqueFactKeys, knowledgeIdKey(flow.source)), false), relationEqual(relationContains(uniqueFactKeys, knowledgeIdKey(flow.target)), false)])).tuples;
    relationResolve(unknownFlowEndpoint.length > 0, () => fail(`Semantic data-flow fact references unknown knowledge: ${knowledgeIdKey(unknownFlowEndpoint[0].source)} -> ${knowledgeIdKey(unknownFlowEndpoint[0].target)}`), () => { });
    const selfReferences = typedSelect(typedRelation(dataFlow.dataFlow), flow => relationEqual(knowledgeIdKey(flow.source), knowledgeIdKey(flow.target))).tuples;
    relationResolve(selfReferences.length > 0, () => fail(`Semantic data-flow fact cannot self-reference: ${knowledgeIdKey(selfReferences[0].source)}`), () => { });
    const unknownGuards = typedSelect(typedRelation(dataFlow.dataFlow), flow => relationAll([relationEqual(flow.guard.kind, 'present'), relationEqual(relationContains(uniqueFactKeys, knowledgeIdKey(flow.guard.value.predicate)), false)])).tuples;
    relationResolve(unknownGuards.length > 0, () => fail(`Semantic data-flow guard references unknown predicate: ${knowledgeIdKey((unknownGuards[0].guard satisfies Extract<typeof unknownGuards[0]['guard'], { readonly kind: 'present' }>).value.predicate)}`), () => { });
    const unsupportedRelations = typedSelect(typedRelation(dataFlow.relations), edge => relationEqual(typedSelect(typedRelation(dataFlow.dataFlow), flow => relationAll([
        relationEqual(knowledgeIdKey(flow.source), knowledgeIdKey(edge.from)),
        relationEqual(knowledgeIdKey(flow.target), knowledgeIdKey(edge.to)),
        relationEqual(relationResolve(relationEqual(flow.kind, 'dependency'), () => 'depends_on', () => 'flows_to'), edge.relation.code),
        relationEqual(flow.role.code, edge.role.code),
      ])).tuples.length, 0)).tuples;
    relationResolve(unsupportedRelations.length > 0, () => fail(`Derived relation is not backed by canonical data-flow: ${knowledgeIdKey(unsupportedRelations[0].from)} -> ${knowledgeIdKey(unsupportedRelations[0].to)} (${unsupportedRelations[0].role.code})`), () => { });
};
export const semanticText = (value: string): SemanticText => Object.freeze({ kind: 'text', value });
export const semanticNumber = (value: number): SemanticNumber => Object.freeze({ kind: 'number', value });
export const semanticBoolean = (value: boolean): SemanticBoolean => Object.freeze({ kind: 'boolean', value });
export const semanticSourceOffset = (value: number): SemanticSourceOffset => Object.freeze({ kind: 'source-offset', value });
export const semanticSourceSpan = (start: number, end: number): SemanticSourceSpan => Object.freeze({
    kind: 'source-span',
    start: semanticSourceOffset(start),
    end: semanticSourceOffset(end),
});
export const semanticSource = (filePath: string, startOffset: number, endOffset: number, evidence: SemanticEvidenceProvider = SEMANTIC_EVIDENCE_PROVIDER_KNOWLEDGE.find(item => relationEqual(item.code, 'parser')) satisfies SemanticEvidenceProvider): SemanticSource => Object.freeze({ filePath: semanticText(filePath), span: semanticSourceSpan(startOffset, endOffset), evidence });
export const knowledgeId = (source: SemanticSource, role: SemanticKnowledgeRoleCode, slot = 'self'): KnowledgeId => Object.freeze({
    kind: 'knowledge-id',
    identity: Object.freeze({
        kind: 'knowledge-identity',
        source,
        role,
        slot: semanticText(slot),
    }),
});
/** Derived lookup key. This string is never semantic source-of-truth. */
export const knowledgeIdKey = (id: KnowledgeId): string => {
    const { source, role, slot } = id.identity;
    return `${source.filePath.value}:${source.span.start.value}:${source.span.end.value}:${role}:${slot.value}`;
};
export const semanticIdentifier = (value: string): SemanticIdentifier => Object.freeze({ kind: 'identifier', value: semanticText(value) });
export const semanticOperation = (value: string): SemanticOperation => Object.freeze({ kind: 'operation', name: semanticText(value) });
export const semanticFact = <T extends SemanticFact>(fact: T): T => Object.freeze(fact);
export const semanticDataFlowRole = (code: SemanticDataFlowRoleCode): SemanticDataFlowRoleDefinition => relationResolve(SEMANTIC_DATA_FLOW_ROLE_KNOWLEDGE.find(definition => relationEqual(definition.code, code)), definition => definition, () => SEMANTIC_DATA_FLOW_ROLE_KNOWLEDGE[0]);
export const semanticDependency = (source: KnowledgeId, target: KnowledgeId, role: SemanticDataFlowRoleCode, guard?: SemanticFlowGuard): SemanticDataFlowFact => Object.freeze({
    kind: 'dependency',
    source,
    target,
    role: semanticDataFlowRole(role),
    guard: relationResolve(guard, () => semanticPresent<SemanticFlowGuard>(guard), () => semanticAbsent<SemanticFlowGuard>('not_provided')),
});
export const semanticValueFlow = (source: KnowledgeId, target: KnowledgeId, role: SemanticDataFlowRoleCode, guard?: SemanticFlowGuard): SemanticDataFlowFact => Object.freeze({
    kind: 'value-flow',
    source,
    target,
    role: semanticDataFlowRole(role),
    guard: relationResolve(guard, () => semanticPresent<SemanticFlowGuard>(guard), () => semanticAbsent<SemanticFlowGuard>('not_provided')),
});
export const semanticEdge = (from: KnowledgeId, to: KnowledgeId, relation: SemanticDataFlowRelationCode, role: SemanticDataFlowRoleCode): SemanticDataFlowEdge => Object.freeze({
    from,
    to,
    relation: Object.freeze({ code: relation }),
    role: semanticDataFlowRole(role),
});
/**
 * Semantic vocabulary is data. Syntax producers resolve syntax into these
 * descriptors; Maps/sets are only derived indexes.
 */
const binaryMeaning = (code: SemanticOperatorCode, result: SemanticOperatorResultCode = 'value'): SemanticOperatorMeaningDefinition => ({ code, arity: 'binary', result });
const unaryMeaning = (code: SemanticOperatorCode, result: SemanticOperatorResultCode = 'value'): SemanticOperatorMeaningDefinition => ({ code, arity: 'unary', result });
const comparison = (code: SemanticOperatorCode, result: SemanticOperatorResultCode = 'boolean'): SemanticOperatorDefinition => ({ code, category: { code: 'comparison' }, meaning: binaryMeaning(code, result), factKind: 'comparison' });
const binary = (code: SemanticOperatorCode, category: SemanticOperatorCategoryCode, result: SemanticOperatorResultCode = 'value'): SemanticOperatorDefinition => ({ code, category: { code: category }, meaning: binaryMeaning(code, result), factKind: 'binary-operation' });
const unary = (code: SemanticOperatorCode, result: SemanticOperatorResultCode = 'value'): SemanticOperatorDefinition => ({ code, category: { code: 'unary' }, meaning: unaryMeaning(code, result), factKind: 'unary-operation' });
const SEMANTIC_OPERATOR_DEFINITIONS: readonly SemanticOperatorDefinition[] = Object.freeze([
    comparison('equal'),
    comparison('not_equal'),
    comparison('identical'),
    comparison('not_identical'),
    comparison('greater_than'),
    comparison('less_than'),
    comparison('greater_or_equal'),
    comparison('less_or_equal'),
    binary('addition', 'arithmetic'),
    binary('subtraction', 'arithmetic'),
    binary('multiplication', 'arithmetic'),
    binary('division', 'arithmetic'),
    binary('modulo', 'arithmetic'),
    binary('logical_and', 'logical', 'boolean'),
    binary('logical_or', 'logical', 'boolean'),
    binary('bitwise_or', 'bitwise'),
    binary('concat', 'string', 'string'),
    unary('not', 'boolean'),
    unary('negative', 'number'),
    unary('positive', 'number'),
    unary('bitwise_not'),
]);
export const SEMANTIC_OPERATOR_KNOWLEDGE: readonly SemanticOperatorDefinition[] = Object.freeze(typedDefine(SEMANTIC_OPERATOR_DEFINITIONS, definition => Object.freeze({ ...definition, category: Object.freeze(definition.category), meaning: Object.freeze(definition.meaning) }) satisfies SemanticOperatorDefinition));
export const SEMANTIC_OPERATOR_INDEX: readonly (readonly [SemanticOperatorCode, SemanticOperatorDefinition])[] = typedProject(typedRelation(SEMANTIC_OPERATOR_KNOWLEDGE), definition => [definition.code, definition] satisfies readonly [SemanticOperatorCode, SemanticOperatorDefinition]).tuples;
export const SEMANTIC_RELATION_KNOWLEDGE: readonly SemanticDataFlowRelationDefinition[] = Object.freeze(typedDefine(['depends_on', 'flows_to'] satisfies SemanticDataFlowRelationCode[], code => Object.freeze({ code }) satisfies SemanticDataFlowRelationDefinition));
export const SEMANTIC_RELATION_INDEX: readonly (readonly [SemanticDataFlowRelationCode, SemanticDataFlowRelationDefinition])[] = typedProject(typedRelation(SEMANTIC_RELATION_KNOWLEDGE), definition => [definition.code, definition] satisfies readonly [SemanticDataFlowRelationCode, SemanticDataFlowRelationDefinition]).tuples;
