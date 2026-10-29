import type { SourceFile } from './names';
/** Canonical upstream semantic knowledge/dataflow vocabulary. Scanner syntax is evidence only. */
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
export const SEMANTIC_EVIDENCE_PROVIDER_KNOWLEDGE: readonly SemanticEvidenceProvider[] = Object.freeze([{ code: 'parser' }, { code: 'lexer' }, { code: 'language_service' }, { code: 'framework_model' }, { code: 'reflection' }, { code: 'inference' }, { code: 'compiler_ir' }, { code: 'runtime_metadata' }] satisfies readonly SemanticEvidenceProvider[]);
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
export interface SemanticPresenceHandlers<T, R> {
    readonly present: (value: T) => R;
    readonly absent: (reason: SemanticAbsenceReasonDefinition) => R;
}
export type SemanticPresence<T> = {
    readonly kind: 'present';
    readonly value: T;
    readonly continueWith: <R>(handlers: SemanticPresenceHandlers<T, R>) => R;
} | {
    readonly kind: 'absent';
    readonly reason: SemanticAbsenceReasonDefinition;
    readonly continueWith: <R>(handlers: SemanticPresenceHandlers<T, R>) => R;
};
export const SEMANTIC_ABSENCE_REASON_KNOWLEDGE: readonly SemanticAbsenceReasonDefinition[] = Object.freeze([{ code: 'not_applicable' }, { code: 'not_provided' }, { code: 'empty_clause' }, { code: 'void_emission' }] satisfies readonly SemanticAbsenceReasonDefinition[]);
export interface SemanticPresenceOperationsInterface {
    readonly present: <T>(value: T) => SemanticPresence<T>;
    readonly absent: <T>(code: SemanticAbsenceReasonCode) => SemanticPresence<T>;
}
export const semanticPresenceOperations: SemanticPresenceOperationsInterface = Object.freeze({
    present: <T>(value: T): SemanticPresence<T> => Object.freeze({
        kind: 'present',
        value,
        continueWith: <R>(handlers: SemanticPresenceHandlers<T, R>): R => handlers.present(value),
    }),
    absent: <T>(code: SemanticAbsenceReasonCode): SemanticPresence<T> => {
        const reason = Object.freeze({ code });
        return Object.freeze({
            kind: 'absent',
            reason,
            continueWith: <R>(handlers: SemanticPresenceHandlers<T, R>): R => handlers.absent(reason),
        });
    },
});
export const semanticPresent = <T>(value: T): SemanticPresence<T> => semanticPresenceOperations.present(value);
export const semanticAbsent = <T>(code: SemanticAbsenceReasonCode): SemanticPresence<T> => semanticPresenceOperations.absent(code);

/**
 * Domain-owned selection for canonical semantic knowledge. This deliberately
 * replaces the deleted generic relation foundation only for this vocabulary;
 * it is not exported as a reusable collection/relation framework.
 */
interface SemanticKnowledgeSelectionOperationsInterface {
    readonly assignmentReference: (code: SemanticAssignmentReferenceCode) => SemanticPresence<SemanticAssignmentReferenceDefinition>;
    readonly parserEvidence: () => SemanticEvidenceProvider;
    readonly dataFlowRole: (code: SemanticDataFlowRoleCode) => SemanticDataFlowRoleDefinition;
    readonly optionalGuard: (guard: SemanticFlowGuard | undefined) => SemanticPresence<SemanticFlowGuard>;
}

const semanticKnowledgeSelectionOperations: SemanticKnowledgeSelectionOperationsInterface = Object.freeze({
    assignmentReference: (code: SemanticAssignmentReferenceCode): SemanticPresence<SemanticAssignmentReferenceDefinition> => {
        const definition = SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE.find(candidate => Object.is(candidate.code, code));
        return definition === undefined ? semanticAbsent('not_provided') : semanticPresent(definition);
    },
    parserEvidence: (): SemanticEvidenceProvider => SEMANTIC_EVIDENCE_PROVIDER_KNOWLEDGE.find(candidate => Object.is(candidate.code, 'parser'))!,
    dataFlowRole: (code: SemanticDataFlowRoleCode): SemanticDataFlowRoleDefinition =>
        SEMANTIC_DATA_FLOW_ROLE_KNOWLEDGE.find(candidate => Object.is(candidate.code, code))!,
    optionalGuard: (guard: SemanticFlowGuard | undefined): SemanticPresence<SemanticFlowGuard> =>
        guard === undefined ? semanticAbsent('not_provided') : semanticPresent(guard),
});
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
export const SEMANTIC_VALUE_KIND_KNOWLEDGE: readonly SemanticValueKindDefinition[] = Object.freeze([{ code: 'literal' }, { code: 'variable' }, { code: 'constant' }, { code: 'property' }, { code: 'array_access' }, { code: 'invocation' }] satisfies readonly SemanticValueKindDefinition[]);
export type SemanticOperatorCategoryCode = 'comparison' | 'arithmetic' | 'logical' | 'bitwise' | 'string' | 'unary';
export type SemanticOperatorCode = 'equal' | 'not_equal' | 'identical' | 'not_identical' | 'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal' | 'addition' | 'subtraction' | 'multiplication' | 'division' | 'modulo' | 'logical_and' | 'logical_or' | 'bitwise_or' | 'concat' | 'not' | 'negative' | 'positive' | 'bitwise_not';
export interface SemanticOperatorCategoryDefinition {
    readonly code: SemanticOperatorCategoryCode;
}
export const SEMANTIC_OPERATOR_CATEGORY_KNOWLEDGE: readonly SemanticOperatorCategoryDefinition[] = Object.freeze([{ code: 'comparison' }, { code: 'arithmetic' }, { code: 'logical' }, { code: 'bitwise' }, { code: 'string' }, { code: 'unary' }] satisfies readonly SemanticOperatorCategoryDefinition[]);
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
export const SEMANTIC_PREDICATE_MEANING_KNOWLEDGE: readonly SemanticPredicateMeaningDefinition[] = Object.freeze([{ code: 'boolean_evaluation' }, { code: 'nullish_evaluation' }, { code: 'match' }] satisfies readonly SemanticPredicateMeaningDefinition[]);
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
export const SEMANTIC_MATCH_MODE_KNOWLEDGE: readonly SemanticMatchModeDefinition[] = Object.freeze([{ code: 'loose' }, { code: 'strict' }] satisfies readonly SemanticMatchModeDefinition[]);
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
export const SEMANTIC_OUTCOME_ROLE_KNOWLEDGE: readonly SemanticOutcomeRoleDefinition[] = Object.freeze([{ code: 'satisfied' }, { code: 'unsatisfied' }, { code: 'matched' }, { code: 'unmatched' }, { code: 'default' }] satisfies readonly SemanticOutcomeRoleDefinition[]);
export interface SemanticOutcome {
    readonly id: KnowledgeId;
    readonly value: SemanticPresence<KnowledgeId>;
    readonly role: SemanticOutcomeRoleDefinition;
    readonly source: SemanticSource;
}
export type SemanticAssignmentOperatorCode = 'set' | 'add' | 'subtract' | 'multiply' | 'divide' | 'modulo' | 'concatenate' | 'null_coalesce' | 'power' | 'bitwise_and' | 'bitwise_or' | 'bitwise_xor' | 'shift_left' | 'shift_right';
export interface SemanticAssignmentOperatorDefinition {
    readonly code: SemanticAssignmentOperatorCode;
    readonly effect: SemanticAssignmentEffectDefinition;
}
export type SemanticAssignmentEffectCode = 'write' | 'read-write';
export interface SemanticAssignmentEffectProjectionInterface {
    readonly project: (assignment: SemanticAssignment) => readonly SemanticModRefRelation[];
}
export interface SemanticAssignmentEffectDefinition {
    readonly code: SemanticAssignmentEffectCode;
    readonly projection: SemanticAssignmentEffectProjectionInterface;
}
export interface SemanticAssignmentEffectKnowledgeInterface {
    readonly write: SemanticAssignmentEffectDefinition;
    readonly readWrite: SemanticAssignmentEffectDefinition;
}
/**
 * Assignment effects own their domain projection. Compound assignment exposes
 * separate read and write relations instead of compressing both into `mod-ref`.
 */
export const semanticAssignmentEffectKnowledge: SemanticAssignmentEffectKnowledgeInterface = Object.freeze({
    write: Object.freeze({
        code: 'write',
        projection: Object.freeze({
            project: (assignment: SemanticAssignment): readonly SemanticModRefRelation[] => Object.freeze([
                Object.freeze({ accessor: assignment.id, location: assignment.target, kind: 'mod', alias: 'must-alias', source: assignment.source }),
            ]),
        }),
    }),
    readWrite: Object.freeze({
        code: 'read-write',
        projection: Object.freeze({
            project: (assignment: SemanticAssignment): readonly SemanticModRefRelation[] => Object.freeze([
                Object.freeze({ accessor: assignment.id, location: assignment.target, kind: 'ref', alias: 'must-alias', source: assignment.source }),
                Object.freeze({ accessor: assignment.id, location: assignment.target, kind: 'mod', alias: 'must-alias', source: assignment.source }),
            ]),
        }),
    }),
});
export const SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE: readonly SemanticAssignmentOperatorDefinition[] = Object.freeze([
    Object.freeze({ code: 'set', effect: semanticAssignmentEffectKnowledge.write }),
    Object.freeze({ code: 'add', effect: semanticAssignmentEffectKnowledge.readWrite }),
    Object.freeze({ code: 'subtract', effect: semanticAssignmentEffectKnowledge.readWrite }),
    Object.freeze({ code: 'multiply', effect: semanticAssignmentEffectKnowledge.readWrite }),
    Object.freeze({ code: 'divide', effect: semanticAssignmentEffectKnowledge.readWrite }),
    Object.freeze({ code: 'modulo', effect: semanticAssignmentEffectKnowledge.readWrite }),
    Object.freeze({ code: 'concatenate', effect: semanticAssignmentEffectKnowledge.readWrite }),
    Object.freeze({ code: 'null_coalesce', effect: semanticAssignmentEffectKnowledge.readWrite }),
    Object.freeze({ code: 'power', effect: semanticAssignmentEffectKnowledge.readWrite }),
    Object.freeze({ code: 'bitwise_and', effect: semanticAssignmentEffectKnowledge.readWrite }),
    Object.freeze({ code: 'bitwise_or', effect: semanticAssignmentEffectKnowledge.readWrite }),
    Object.freeze({ code: 'bitwise_xor', effect: semanticAssignmentEffectKnowledge.readWrite }),
    Object.freeze({ code: 'shift_left', effect: semanticAssignmentEffectKnowledge.readWrite }),
    Object.freeze({ code: 'shift_right', effect: semanticAssignmentEffectKnowledge.readWrite }),
] satisfies readonly SemanticAssignmentOperatorDefinition[]);
export type SemanticAssignmentReferenceCode = 'by_value' | 'by_reference';
export interface SemanticAssignmentReferenceIdentityBinding {
    readonly assignment: KnowledgeId;
    readonly left: KnowledgeId;
    readonly right: KnowledgeId;
    readonly source: SemanticSource;
}
export interface SemanticAssignmentReferenceIdentityProjectionInterface {
    readonly project: (assignment: SemanticAssignment) => readonly SemanticAssignmentReferenceIdentityBinding[];
}
export interface SemanticAssignmentReferenceDefinition {
    readonly code: SemanticAssignmentReferenceCode;
    /** Reference mode owns whether this assignment establishes an identity binding. */
    readonly identityProjection: SemanticAssignmentReferenceIdentityProjectionInterface;
}
const noAssignmentReferenceBindings: readonly SemanticAssignmentReferenceIdentityBinding[] = Object.freeze([]);
const byValueAssignmentReferenceIdentityProjection: SemanticAssignmentReferenceIdentityProjectionInterface = Object.freeze({
    project: (_assignment: SemanticAssignment): readonly SemanticAssignmentReferenceIdentityBinding[] => noAssignmentReferenceBindings,
});
const byReferenceAssignmentIdentityProjection: SemanticAssignmentReferenceIdentityProjectionInterface = Object.freeze({
    project: (assignment: SemanticAssignment): readonly SemanticAssignmentReferenceIdentityBinding[] => Object.freeze([
        Object.freeze({ assignment: assignment.id, left: assignment.target, right: assignment.value, source: assignment.source }),
    ]),
});
export const SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE: readonly SemanticAssignmentReferenceDefinition[] = Object.freeze([
    Object.freeze({ code: 'by_value', identityProjection: byValueAssignmentReferenceIdentityProjection }),
    Object.freeze({ code: 'by_reference', identityProjection: byReferenceAssignmentIdentityProjection }),
] satisfies readonly SemanticAssignmentReferenceDefinition[]);
export interface SemanticAssignmentReferenceOperationsInterface {
    readonly resolve: (code: SemanticAssignmentReferenceCode) => SemanticPresence<SemanticAssignmentReferenceDefinition>;
}
export const semanticAssignmentReference: SemanticAssignmentReferenceOperationsInterface = Object.freeze({
    resolve: semanticKnowledgeSelectionOperations.assignmentReference,
});
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
export const SEMANTIC_BINDING_ORIGIN_KNOWLEDGE: readonly SemanticBindingOriginDefinition[] = Object.freeze([{ code: 'parameter' }, { code: 'assignment' }, { code: 'iteration' }, { code: 'exception_handler' }] satisfies readonly SemanticBindingOriginDefinition[]);
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
export const SEMANTIC_CAST_KNOWLEDGE: readonly SemanticCastDefinition[] = Object.freeze([{ code: 'int' }, { code: 'float' }, { code: 'string' }, { code: 'bool' }, { code: 'array' }, { code: 'object' }] satisfies readonly SemanticCastDefinition[]);
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
export const SEMANTIC_ACCESS_MODE_KNOWLEDGE: readonly SemanticAccessModeDefinition[] = Object.freeze([{ code: 'direct' }, { code: 'nullsafe' }] satisfies readonly SemanticAccessModeDefinition[]);
export type SemanticAccessMember = {
    readonly kind: 'knowledge-id';
    readonly value: KnowledgeId;
} | {
    readonly kind: 'identifier';
    readonly value: SemanticIdentifier;
};
export interface SemanticAccess {
    readonly id: KnowledgeId;
    readonly receiver: KnowledgeId;
    readonly member: SemanticAccessMember;
    readonly mode: SemanticAccessModeDefinition;
    readonly source: SemanticSource;
}
export type SemanticEmissionCode = 'result' | 'exception';
export interface SemanticEmissionDefinition {
    readonly code: SemanticEmissionCode;
}
export const SEMANTIC_EMISSION_KNOWLEDGE: readonly SemanticEmissionDefinition[] = Object.freeze([{ code: 'result' }, { code: 'exception' }] satisfies readonly SemanticEmissionDefinition[]);
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
export const SEMANTIC_INCLUDE_KNOWLEDGE: readonly SemanticIncludeDefinition[] = Object.freeze([{ code: 'include' }, { code: 'include_once' }, { code: 'require' }, { code: 'require_once' }] satisfies readonly SemanticIncludeDefinition[]);
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
/** Source-backed effect results emitted beside the canonical semantic fact. */
/** Concrete assignment-reference continuation owned by the upstream semantic fact domain. */
export interface SemanticAssignmentReferenceFactOperationsInterface {
    readonly identityBindings: (facts: readonly SemanticFact[]) => readonly SemanticAssignmentReferenceIdentityBinding[];
}

const identityBindingsFromAssignmentFacts = (facts: readonly SemanticFact[]): readonly SemanticAssignmentReferenceIdentityBinding[] => {
    const bindings: SemanticAssignmentReferenceIdentityBinding[] = [];
    for (const fact of facts) {
        if (fact.kind === 'assignment') {
            bindings.push(...fact.value.reference.identityProjection.project(fact.value));
        }
    }
    return Object.freeze(bindings);
};

export const semanticAssignmentReferenceFactOperations: SemanticAssignmentReferenceFactOperationsInterface = Object.freeze({
    identityBindings: identityBindingsFromAssignmentFacts,
});

export type SemanticModRefKind = 'mod' | 'ref' | 'mod-ref' | 'no-mod-ref';
export type SemanticAliasKind = 'must-alias' | 'may-alias' | 'no-alias';
export interface SemanticModRefRelation {
  readonly accessor: KnowledgeId;
  readonly location: KnowledgeId;
  readonly kind: SemanticModRefKind;
  readonly alias: SemanticAliasKind;
  readonly source: SemanticSource;
}
export type SemanticModRefFact = Readonly<{
  readonly kind: 'invocation_effect_summary_unmodeled';
  readonly fact: KnowledgeId;
  readonly source: SemanticSource;
}>;

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
export const SEMANTIC_DATA_FLOW_ROLE_KNOWLEDGE: readonly SemanticDataFlowRoleDefinition[] = Object.freeze([
    { code: 'operator' },
    { code: 'operand_left' },
    { code: 'operand_right' },
    { code: 'operand' },
    { code: 'receiver' },
    { code: 'index' },
    { code: 'part' },
    { code: 'argument' },
    { code: 'callable' },
    { code: 'array_key' },
    { code: 'array_value' },
    { code: 'class_expression' },
    { code: 'value' },
    { code: 'predicate' },
    { code: 'alternative' },
    { code: 'subject' },
    { code: 'candidate' },
    { code: 'body' },
    { code: 'initializer' },
    { code: 'update' },
    { code: 'iterable' },
    { code: 'target' },
    { code: 'binding' },
    { code: 'emitted_value' },
    { code: 'exception_type' },
    { code: 'handler' },
    { code: 'finally_block' },
    { code: 'member' },
    { code: 'availability' },
] satisfies readonly SemanticDataFlowRoleDefinition[]);
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

/**
 * Canonical-model invariant validation. This does not construct the model; it
 * only verifies that the facts remain the source of truth and every data-flow
 * edge references knowledge that actually exists in those facts. Any Set used
 * here is a temporary validation index, never semantic state.
 */

/** Canonical semantic knowledge/dataflow input contract. */
export interface SemanticKnowledgeDataFlow {
  readonly facts: readonly SemanticFact[];
  /** Effect-domain evidence emitted at the source construction boundary. */
  readonly modRefFacts: readonly SemanticModRefFact[];
  /** Concrete mod/ref effects emitted at the same source construction boundary. */
  readonly modRefRelations: readonly SemanticModRefRelation[];
  readonly dataFlow: readonly SemanticDataFlowFact[];
  readonly relations: readonly SemanticDataFlowEdge[];
}

/** Domain constructor contract: text values are created through the semantic text ADT. */
export interface SemanticTextFactoryInterface {
    readonly create: (value: string) => SemanticText;
}
export const semanticText: SemanticTextFactoryInterface = Object.freeze({
    create: (value: string): SemanticText => Object.freeze({ kind: 'text', value }),
});

/** Domain constructor contract for numeric semantic facts. */
export interface SemanticNumberFactoryInterface {
    readonly create: (value: number) => SemanticNumber;
}
export const semanticNumber: SemanticNumberFactoryInterface = Object.freeze({
    create: (value: number): SemanticNumber => Object.freeze({ kind: 'number', value }),
});

/** Domain constructor contract for boolean semantic facts. */
export interface SemanticBooleanFactoryInterface {
    readonly create: (value: boolean) => SemanticBoolean;
}
export const semanticBoolean: SemanticBooleanFactoryInterface = Object.freeze({
    create: (value: boolean): SemanticBoolean => Object.freeze({ kind: 'boolean', value }),
});

/** Source navigation offsets are created as explicit semantic values. */
export interface SemanticSourceOffsetFactoryInterface {
    readonly create: (value: number) => SemanticSourceOffset;
}
export const semanticSourceOffset: SemanticSourceOffsetFactoryInterface = Object.freeze({
    create: (value: number): SemanticSourceOffset => Object.freeze({ kind: 'source-offset', value }),
});

/** Source spans own their endpoint construction instead of leaking offset arithmetic to consumers. */
export interface SemanticSourceSpanFactoryInterface {
    readonly create: (start: number, end: number) => SemanticSourceSpan;
}
export const semanticSourceSpan: SemanticSourceSpanFactoryInterface = Object.freeze({
    create: (start: number, end: number): SemanticSourceSpan => Object.freeze({
        kind: 'source-span',
        start: semanticSourceOffset.create(start),
        end: semanticSourceOffset.create(end),
    }),
});
export type SemanticSourceEquality =
    | Readonly<{ readonly kind: 'same_semantic_source' }>
    | Readonly<{ readonly kind: 'different_semantic_source' }>;
export interface SemanticSourceOperationsInterface {
    readonly create: (filePath: string, startOffset: number, endOffset: number, evidence?: SemanticEvidenceProvider) => SemanticSource;
    readonly createForFile: (sourceFile: SourceFile, startOffset: number, endOffset: number, evidence: SemanticEvidenceProvider) => SemanticSource;
    readonly same: (left: SemanticSource, right: SemanticSource) => SemanticSourceEquality;
}
export const semanticSource: SemanticSourceOperationsInterface = Object.freeze({
    create: (filePath: string, startOffset: number, endOffset: number, evidence: SemanticEvidenceProvider = semanticKnowledgeSelectionOperations.parserEvidence()): SemanticSource => Object.freeze({ filePath: semanticText.create(filePath), span: semanticSourceSpan.create(startOffset, endOffset), evidence }),
    createForFile: (sourceFile: SourceFile, startOffset: number, endOffset: number, evidence: SemanticEvidenceProvider): SemanticSource => Object.freeze({ filePath: semanticText.create(sourceFile.value.value), span: semanticSourceSpan.create(startOffset, endOffset), evidence }),
    same: (left: SemanticSource, right: SemanticSource): SemanticSourceEquality =>
        left.filePath.value === right.filePath.value
        && left.span.start.value === right.span.start.value
        && left.span.end.value === right.span.end.value
        && left.evidence.code === right.evidence.code
            ? Object.freeze({ kind: 'same_semantic_source' as const })
            : Object.freeze({ kind: 'different_semantic_source' as const }),
});
export const knowledgeId = (source: SemanticSource, role: SemanticKnowledgeRoleCode, slot = 'self'): KnowledgeId => Object.freeze({
    kind: 'knowledge-id',
    identity: Object.freeze({
        kind: 'knowledge-identity',
        source,
        role,
        slot: semanticText.create(slot),
    }),
});
export type KnowledgeIdEquality =
    | Readonly<{ readonly kind: 'same_knowledge_id' }>
    | Readonly<{ readonly kind: 'different_knowledge_id' }>;
export interface SemanticKnowledgeIdOperationsInterface {
    readonly same: (left: KnowledgeId, right: KnowledgeId) => KnowledgeIdEquality;
}
export const semanticKnowledgeIdOperations: SemanticKnowledgeIdOperationsInterface = Object.freeze({
    same: (left: KnowledgeId, right: KnowledgeId): KnowledgeIdEquality =>
        semanticSource.same(left.identity.source, right.identity.source).kind === 'same_semantic_source'
        && Object.is(left.identity.role, right.identity.role)
        && Object.is(left.identity.slot.value, right.identity.slot.value)
            ? Object.freeze({ kind: 'same_knowledge_id' as const })
            : Object.freeze({ kind: 'different_knowledge_id' as const }),
});
/** Derived lookup key for legacy relation indexes; typed equality is the identity contract. */
export const knowledgeIdKey = (id: KnowledgeId): string => {
    const { source, role, slot } = id.identity;
    return `${source.filePath.value}:${source.span.start.value}:${source.span.end.value}:${role}:${slot.value}`;
};
/** Creates an explicit semantic identifier value used by upstream knowledge facts. */
export interface SemanticIdentifierOperationsInterface {
    readonly create: (value: string) => SemanticIdentifier;
}
export const semanticIdentifier: SemanticIdentifierOperationsInterface = Object.freeze({
    create: (value: string): SemanticIdentifier => Object.freeze({ kind: 'identifier', value: semanticText.create(value) }),
});
/** Creates a semantic operation descriptor; it is not a generic string helper. */
export interface SemanticOperationOperationsInterface {
    readonly create: (value: string) => SemanticOperation;
}
export const semanticOperation: SemanticOperationOperationsInterface = Object.freeze({
    create: (value: string): SemanticOperation => Object.freeze({ kind: 'operation', name: semanticText.create(value) }),
});
export const semanticFact = <T extends SemanticFact>(fact: T): T => Object.freeze(fact);
export interface SemanticDataFlowRoleOperationsInterface {
    readonly resolve: (code: SemanticDataFlowRoleCode) => SemanticDataFlowRoleDefinition;
}
export const semanticDataFlowRole: SemanticDataFlowRoleOperationsInterface = Object.freeze({
    resolve: semanticKnowledgeSelectionOperations.dataFlowRole,
});
/** Domain operation for recording a dependency fact in the semantic data-flow model. */
export interface SemanticDependencyOperationsInterface {
    readonly create: (source: KnowledgeId, target: KnowledgeId, role: SemanticDataFlowRoleCode, guard?: SemanticFlowGuard) => SemanticDataFlowFact;
}
export const semanticDependency: SemanticDependencyOperationsInterface = Object.freeze({
    create: (source: KnowledgeId, target: KnowledgeId, role: SemanticDataFlowRoleCode, guard?: SemanticFlowGuard): SemanticDataFlowFact => Object.freeze({
        kind: 'dependency',
        source,
        target,
        role: semanticDataFlowRole.resolve(role),
        guard: semanticKnowledgeSelectionOperations.optionalGuard(guard),
    }),
});
/** Domain operation for recording value-flow facts without erasing their semantic kind. */
export interface SemanticValueFlowOperationsInterface {
    readonly create: (source: KnowledgeId, target: KnowledgeId, role: SemanticDataFlowRoleCode, guard?: SemanticFlowGuard) => SemanticDataFlowFact;
}
export const semanticValueFlow: SemanticValueFlowOperationsInterface = Object.freeze({
    create: (source: KnowledgeId, target: KnowledgeId, role: SemanticDataFlowRoleCode, guard?: SemanticFlowGuard): SemanticDataFlowFact => Object.freeze({
        kind: 'value-flow',
        source,
        target,
        role: semanticDataFlowRole.resolve(role),
        guard: semanticKnowledgeSelectionOperations.optionalGuard(guard),
    }),
});
/** Domain operation preserving the explicit semantic relationship code and endpoints. */
export interface SemanticDataFlowEdgeOperationsInterface {
    readonly create: (from: KnowledgeId, to: KnowledgeId, relation: SemanticDataFlowRelationCode, role: SemanticDataFlowRoleCode) => SemanticDataFlowEdge;
}
export const semanticEdge: SemanticDataFlowEdgeOperationsInterface = Object.freeze({
    create: (from: KnowledgeId, to: KnowledgeId, relation: SemanticDataFlowRelationCode, role: SemanticDataFlowRoleCode): SemanticDataFlowEdge => Object.freeze({
        from,
        to,
        relation: Object.freeze({ code: relation }),
        role: semanticDataFlowRole.resolve(role),
    }),
});
/**
 * Semantic vocabulary is data. Syntax producers resolve syntax into these
 * descriptors; Maps/sets are only derived indexes.
 */
const semanticOperatorDefinition = (code: SemanticOperatorCode, category: SemanticOperatorCategoryCode, arity: SemanticOperatorArityCode, result: SemanticOperatorResultCode, factKind: SemanticOperatorFactKindCode): SemanticOperatorDefinition => Object.freeze({ code, category: Object.freeze({ code: category }), meaning: Object.freeze({ code, arity, result }), factKind });

const SEMANTIC_OPERATOR_DEFINITIONS: readonly SemanticOperatorDefinition[] = Object.freeze([
  semanticOperatorDefinition('equal', 'comparison', 'binary', 'boolean', 'comparison'),
  semanticOperatorDefinition('not_equal', 'comparison', 'binary', 'boolean', 'comparison'),
  semanticOperatorDefinition('identical', 'comparison', 'binary', 'boolean', 'comparison'),
  semanticOperatorDefinition('not_identical', 'comparison', 'binary', 'boolean', 'comparison'),
  semanticOperatorDefinition('greater_than', 'comparison', 'binary', 'boolean', 'comparison'),
  semanticOperatorDefinition('less_than', 'comparison', 'binary', 'boolean', 'comparison'),
  semanticOperatorDefinition('greater_or_equal', 'comparison', 'binary', 'boolean', 'comparison'),
  semanticOperatorDefinition('less_or_equal', 'comparison', 'binary', 'boolean', 'comparison'),
  semanticOperatorDefinition('addition', 'arithmetic', 'binary', 'value', 'binary-operation'),
  semanticOperatorDefinition('subtraction', 'arithmetic', 'binary', 'value', 'binary-operation'),
  semanticOperatorDefinition('multiplication', 'arithmetic', 'binary', 'value', 'binary-operation'),
  semanticOperatorDefinition('division', 'arithmetic', 'binary', 'value', 'binary-operation'),
  semanticOperatorDefinition('modulo', 'arithmetic', 'binary', 'value', 'binary-operation'),
  semanticOperatorDefinition('logical_and', 'logical', 'binary', 'boolean', 'binary-operation'),
  semanticOperatorDefinition('logical_or', 'logical', 'binary', 'boolean', 'binary-operation'),
  semanticOperatorDefinition('bitwise_or', 'bitwise', 'binary', 'value', 'binary-operation'),
  semanticOperatorDefinition('concat', 'string', 'binary', 'string', 'binary-operation'),
  semanticOperatorDefinition('not', 'unary', 'unary', 'boolean', 'unary-operation'),
  semanticOperatorDefinition('negative', 'unary', 'unary', 'number', 'unary-operation'),
  semanticOperatorDefinition('positive', 'unary', 'unary', 'number', 'unary-operation'),
  semanticOperatorDefinition('bitwise_not', 'unary', 'unary', 'value', 'unary-operation'),
]);
export const SEMANTIC_OPERATOR_KNOWLEDGE: readonly SemanticOperatorDefinition[] = SEMANTIC_OPERATOR_DEFINITIONS;
export const SEMANTIC_OPERATOR_INDEX: readonly (readonly [SemanticOperatorCode, SemanticOperatorDefinition])[] = Object.freeze(SEMANTIC_OPERATOR_KNOWLEDGE.map(definition => [definition.code, definition] as const));
export const SEMANTIC_RELATION_KNOWLEDGE: readonly SemanticDataFlowRelationDefinition[] = Object.freeze([{ code: 'depends_on' }, { code: 'flows_to' }] satisfies readonly SemanticDataFlowRelationDefinition[]);
export const SEMANTIC_RELATION_INDEX: readonly (readonly [SemanticDataFlowRelationCode, SemanticDataFlowRelationDefinition])[] = Object.freeze(SEMANTIC_RELATION_KNOWLEDGE.map(definition => [definition.code, definition] as const));
