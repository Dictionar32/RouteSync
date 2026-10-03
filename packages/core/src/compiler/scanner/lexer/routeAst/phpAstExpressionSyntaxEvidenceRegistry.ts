import { relationNotEqual } from "../../../../semantic/kernel/semanticRelations";
import { relationResolve } from '../../../relational/sequence';
/**
 * Syntax/evidence boundary for PHP expression spellings.
 *
 * Concrete expression kinds are deliberately isolated here. The semantic
 * adapter does not dispatch on source-language expression constructs; it only
 * consumes this registry's neutral KnowledgeId projection.
 */
import type { AstIdentifier, PhpAstValue, PhpBlock } from '../phpAstTypes';
import { matchPhpAstValue, type PhpAstValueVisitor } from '../phpAstAlgebra';
import type { PhpInterpolatedStringPart, PhpArrayEntry, PhpArrayKey, PhpClosureReturnTypeAst, PhpMatchArm } from '../phpAstExpressionTypes';
import type { KnowledgeId, SemanticFact, SemanticLiteral, SemanticPresence, SemanticDataFlowRelationCode, SemanticDataFlowRoleCode, SemanticFlowGuard, SemanticValueKindCode, SemanticValueKindDefinition, SemanticAccessModeCode, SemanticAccessModeDefinition, SemanticOperatorDefinition, SemanticAssignmentOperatorCode, SemanticAssignmentOperatorDefinition, SemanticAssignmentReferenceCode, SemanticAssignmentReferenceDefinition, SemanticPredicateMeaningCode, SemanticPredicateMeaningDefinition, SemanticMatchModeCode, SemanticMatchModeDefinition, SemanticOutcomeRoleCode, SemanticOutcomeRoleDefinition, SemanticCastDefinition, SemanticAbsenceReasonCode, SemanticSource, SemanticIdentifier, SemanticOperation } from './semanticKnowledgeDataFlowRelations';
import { semanticText, semanticNumber, knowledgeId } from './semanticKnowledgeDataFlowRelations';
import { projectRelation } from '../../../relational/sequence';
import { relationFirstOption, relationOptionFold, relationVariantValue, type RelationOption } from '../../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';
type EvidenceSource = SemanticSource;
type EvidenceCode = string;
type EvidenceRelation = SemanticDataFlowRelationCode;
type EvidenceRole = SemanticDataFlowRoleCode;
type EvidenceSemanticValue = SemanticValueKindDefinition;
type EvidenceAccessMode = SemanticAccessModeDefinition;
type EvidenceOperator = SemanticOperatorDefinition;
type EvidenceAssignmentOperator = SemanticAssignmentOperatorDefinition;
type EvidenceAssignmentReference = SemanticAssignmentReferenceDefinition;
type EvidencePredicateMeaning = SemanticPredicateMeaningDefinition;
type EvidenceMatchMode = SemanticMatchModeDefinition;
type EvidenceOutcomeRole = SemanticOutcomeRoleDefinition;
type EvidenceCast = SemanticCastDefinition;

export interface PhpAstExpressionEvidenceContext {
    readonly evidenceSourceOf: (value: { readonly source: { readonly startOffset: number; readonly endOffset: number } }) => EvidenceSource;
    readonly add: (fact: SemanticFact) => KnowledgeId;
    readonly relate: (from: KnowledgeId, to: KnowledgeId, relation: EvidenceRelation, role: EvidenceRole, guard?: SemanticPresence<SemanticFlowGuard>) => void;
    readonly semanticVariable: (name: string, source: EvidenceSource) => KnowledgeId;
    readonly semanticValueKind: (code: SemanticValueKindCode) => EvidenceSemanticValue;
    readonly semanticAccessMode: (code: SemanticAccessModeCode) => EvidenceAccessMode;
    readonly semanticOperator: (kind: string) => RelationOption<SemanticOperatorDefinition>;
    readonly semanticAssignmentOperator: (code: SemanticAssignmentOperatorCode) => EvidenceAssignmentOperator;
    readonly semanticAssignmentReference: (code: SemanticAssignmentReferenceCode) => EvidenceAssignmentReference;
    readonly semanticIdentifier: (value: string) => SemanticIdentifier;
    readonly semanticOperation: (value: string) => SemanticOperation;
    readonly semanticOutcomeRole: (code: SemanticOutcomeRoleCode) => EvidenceOutcomeRole;
    readonly semanticPredicateMeaning: (code: SemanticPredicateMeaningCode) => EvidencePredicateMeaning;
    readonly semanticMatchMode: (code: SemanticMatchModeCode) => EvidenceMatchMode;
    readonly semanticPresent: <T>(value: T) => SemanticPresence<T>;
    readonly semanticAbsent: <T>(reason: SemanticAbsenceReasonCode) => SemanticPresence<T>;
    readonly literalValue: (value: PhpAstValue) => SemanticPresence<SemanticLiteral>;
    readonly predicate: (expressionId: KnowledgeId, source: EvidenceSource, meaning?: SemanticPredicateMeaningCode, slot?: string) => KnowledgeId;
    readonly outcome: (id: KnowledgeId, role: SemanticOutcomeRoleCode, value: KnowledgeId, source: EvidenceSource) => KnowledgeId;
    readonly match: (subject: KnowledgeId, candidate: KnowledgeId, mode: SemanticMatchModeCode, source: EvidenceSource, slot: string) => KnowledgeId;
    readonly visit: (block: PhpBlock, scopeHint: string, availability?: SemanticPresence<KnowledgeId>) => KnowledgeId;
    readonly assignmentTarget: (target: import('../phpAstTypes').PhpAssignmentTarget, hint: string, source: EvidenceSource) => KnowledgeId;
    readonly knowledgeIdKey: (id: KnowledgeId) => string;
    readonly castKnowledge: readonly EvidenceCast[];
}
const relationCase = <T, R>(value: T, key: (value: T) => string, cases: Readonly<Record<string, (value: T) => R>>, fallback: (value: T) => R): R => relationOptionFold(relationFirstOption(Object.entries(cases), entry => relationEqual(entry[0], key(value))), () => fallback(value), entry => entry[1](value));
export const createPhpAstExpressionProjector = (context: PhpAstExpressionEvidenceContext): ((value: PhpAstValue, hint: string) => KnowledgeId) => {
    const { evidenceSourceOf, add, relate, semanticVariable, semanticValueKind, semanticAccessMode, semanticOperator, semanticAssignmentOperator, semanticAssignmentReference, semanticIdentifier, semanticOperation, semanticPresent, semanticAbsent, literalValue, predicate, outcome, match, visit, assignmentTarget, knowledgeIdKey, castKnowledge } = context;
    const expression: (value: PhpAstValue, hint: string) => KnowledgeId = (value, hint) => {
        const source = evidenceSourceOf(value);
        const baseSource = evidenceSourceOf(value);
        const base = knowledgeId(baseSource, 'value', 'self');
        const expressionArgument = (argument: {
            readonly value: PhpAstValue;
        }, argumentHint: string): KnowledgeId => expression(argument.value, argumentHint);
        const expressionHandlers: PhpAstValueVisitor<KnowledgeId> = Object.freeze({
            'literal': (value: Extract<PhpAstValue, {
                readonly kind: 'literal';
            }>) => {
                return add({ kind: 'value', value: { id: base, kind: semanticValueKind('literal'), name: semanticAbsent('not_applicable'), value: literalValue(value), source } });
            },
            'variableReference': (value: Extract<PhpAstValue, {
                readonly kind: 'variable_reference';
            }>) => {
                {
                    const variableId = semanticVariable(value.name, source);
                    const variable = add({ kind: 'value', value: { id: base, kind: semanticValueKind('variable'), name: semanticPresent(semanticIdentifier(value.name)), value: semanticAbsent('not_applicable'), source } });
                    const referenceId = add({ kind: 'reference', value: { id: knowledgeId(source, 'reference', 'self'), variable: variableId, availability: semanticAbsent('not_applicable'), source } });
                    relate(variable, variableId, 'depends_on', 'value');
                    relate(referenceId, variableId, 'depends_on', 'value');
                    return variable;
                }
            },
            'magicConstant': (value: Extract<PhpAstValue, {
                readonly kind: 'magic_constant';
            }>) => {
                return add({ kind: 'magic-constant', value: { id: base, name: semanticText(value.value.kind), source } });
            },
            'constantReference': (value: Extract<PhpAstValue, {
                readonly kind: 'constant_reference';
            }>) => {
                return add({ kind: 'value', value: { id: base, kind: semanticValueKind('constant'), name: semanticPresent(semanticIdentifier(value.name)), value: semanticAbsent('not_applicable'), source } });
            },
            'propertyAccess': (value: Extract<PhpAstValue, {
                readonly kind: 'property_access';
            }>) => {
                {
                    const receiver = expression(value.receiver, `${base}:receiver`);
                    const id = add({ kind: 'access', value: { id: base, receiver, member: semanticIdentifier(value.property), mode: semanticAccessMode(value.access.kind), source } });
                    relate(id, receiver, 'depends_on', 'receiver');
                    return id;
                }
            },
            'arrayAccess': (value: Extract<PhpAstValue, {
                readonly kind: 'array_access';
            }>) => {
                {
                    const receiver = expression(value.target, `${base}:target`);
                    const index = expression(value.index, `${base}:index`);
                    const id = add({ kind: 'access', value: { id: base, receiver, member: index, mode: semanticAccessMode('direct'), source } });
                    relate(id, receiver, 'depends_on', 'receiver');
                    relate(id, index, 'depends_on', 'index');
                    return id;
                }
            },
            'interpolatedString': (value: Extract<PhpAstValue, {
                readonly kind: 'interpolated_string';
            }>) => {
                {
                    const parts = projectRelation(value.parts, (part, index) => relationCase(part, current => current.kind, {
                        expression: current => expression(relationVariantValue(current, 'expression').value, `${base}:part:${index}`),
                        text: current => add({ kind: 'value', value: { id: knowledgeId(source, 'value', `part:${index}`), kind: semanticValueKind('literal'), name: semanticAbsent('not_applicable'), value: semanticPresent({ kind: 'string', value: semanticText(relationVariantValue(current, 'text').value) }), source } }),
                    }, () => add({ kind: 'value', value: { id: knowledgeId(source, 'value', `part:${index}`), kind: semanticValueKind('literal'), name: semanticAbsent('not_applicable'), value: semanticPresent({ kind: 'string', value: semanticText(String(relationVariantValue(part, 'text').value)) }), source } })));
                    const id = add({ kind: 'interpolated-string', value: { id: base, parts, source } });
                    projectRelation(parts, part => { relate(id, part, 'depends_on', 'part'); return part; });
                    return id;
                }
            },
            'resourceSingle': (value: Extract<PhpAstValue, {
                readonly kind: 'resource_single';
            }>) => {
                {
                    const argument = expression(value.argument, `${base}:argument`);
                    const id = add({ kind: 'resource-access', value: { id: base, resource: semanticIdentifier(value.resourceName), argument, source } });
                    relate(id, argument, 'depends_on', 'argument');
                    return id;
                }
            },
            'resourceCollection': (value: Extract<PhpAstValue, {
                readonly kind: 'resource_collection';
            }>) => {
                {
                    const argument = expression(value.argument, `${base}:argument`);
                    const id = add({ kind: 'resource-access', value: { id: base, resource: semanticIdentifier(value.resourceName), argument, source } });
                    relate(id, argument, 'depends_on', 'argument');
                    return id;
                }
            },
            'castExpression': (value: Extract<PhpAstValue, {
                readonly kind: 'cast_expression';
            }>) => {
                {
                    const operand = expression(value.operand, `${base}:operand`);
                    const definition = relationFirstOption(castKnowledge, item => relationEqual(item.code, value.castType.kind));
                    return relationOptionFold(definition,
                        () => add({ kind: 'unsupported-expression', value: { id: base, reason: semanticText('unsupported-cast-type'), source } }),
                        current => {
                            const id = add({ kind: 'cast', value: { id: base, definition: current as EvidenceCast, operand, source } });
                            relate(id, operand, 'depends_on', 'operand');
                            return id;
                        },
                    );
                }
            },
            'nestedArray': (value: Extract<PhpAstValue, {
                readonly kind: 'nested_array';
            }>) => {
                {
                    const entries = projectRelation(value.entries, (entry, index) => {
                        const entryValue = expression(entry.value, `${base}:entry:${index}:value`);
                        const key: SemanticPresence<KnowledgeId> = relationCase(entry, current => current.kind, {
                            keyed: current => relationCase(relationVariantValue(current, 'keyed').key, keyValue => keyValue.kind, {
                                expression: keyValue => semanticPresent(expression(relationVariantValue(keyValue, 'expression').value, `${base}:entry:${index}:key`)),
                                string: keyValue => semanticPresent(add({ kind: 'value', value: { id: knowledgeId(source, 'value', `entry:${index}:key`), kind: semanticValueKind('literal'), name: semanticAbsent('not_applicable'), value: semanticPresent({ kind: 'string', value: semanticText(relationVariantValue(keyValue, 'string').value) }), source } })),
                                number: keyValue => semanticPresent(add({ kind: 'value', value: { id: knowledgeId(source, 'value', `entry:${index}:key`), kind: semanticValueKind('literal'), name: semanticAbsent('not_applicable'), value: semanticPresent({ kind: 'number', value: semanticNumber(relationVariantValue(keyValue, 'integer').value) }), source } })),
                            }, () => semanticAbsent('not_applicable')),
                        }, () => semanticAbsent('not_applicable'));
                        return { key, value: entryValue };
                    });
                    const id = add({ kind: 'array', value: { id: base, entries, source } });
                    projectRelation(entries, entry => { relate(id, entry.value, 'depends_on', 'array_value'); relationCase(entry.key, value => value.kind, { present: current => { relate(id, relationVariantValue(current, 'present').value, 'depends_on', 'array_key'); return entry; } }, () => entry); return entry; });
                    return id;
                }
            },
            'staticCall': (value: Extract<PhpAstValue, {
                readonly kind: 'static_call';
            }>) => {
                {
                    const args = projectRelation(value.arguments, (argument, index) => expressionArgument(argument, `${base}:arg:${index}`));
                    const id = add({ kind: 'static-invocation', value: { id: base, className: semanticIdentifier(value.className), operation: semanticOperation(value.method), arguments: args, source } });
                    projectRelation(args, argument => { relate(id, argument, 'depends_on', 'argument'); return argument; });
                    return id;
                }
            },
            'construct': (value: Extract<PhpAstValue, {
                readonly kind: 'construct';
            }>) => {
                {
                    const args = projectRelation(value.arguments, (argument, index) => expressionArgument(argument, `${base}:arg:${index}`));
                    const id = add({ kind: 'construction', value: { id: base, className: semanticPresent(semanticIdentifier(value.className)), classExpression: semanticAbsent('not_applicable'), arguments: args, source } });
                    projectRelation(args, argument => { relate(id, argument, 'depends_on', 'argument'); return argument; });
                    return id;
                }
            },
            'dynamicConstruct': (value: Extract<PhpAstValue, {
                readonly kind: 'dynamic_construct';
            }>) => {
                {
                    const classExpression = expression(value.classExpression, `${base}:class`);
                    const args = projectRelation(value.arguments, (argument, index) => expressionArgument(argument, `${base}:arg:${index}`));
                    const id = add({ kind: 'construction', value: { id: base, className: semanticAbsent('not_applicable'), classExpression: semanticPresent(classExpression), arguments: args, source } });
                    relate(id, classExpression, 'depends_on', 'class_expression');
                    projectRelation(args, argument => { relate(id, argument, 'depends_on', 'argument'); return argument; });
                    return id;
                }
            },
            'instanceOf': (value: Extract<PhpAstValue, {
                readonly kind: 'instance_of';
            }>) => {
                {
                    const expressionId = expression(value.expression, `${base}:expression`);
                    const id = add({ kind: 'type-check', value: { id: base, expression: expressionId, className: semanticIdentifier(value.className), source } });
                    relate(id, expressionId, 'depends_on', 'value');
                    return id;
                }
            },
            'classReference': (value: Extract<PhpAstValue, {
                readonly kind: 'class_reference';
            }>) => {
                {
                    return add({ kind: 'class-reference', value: { id: base, className: semanticIdentifier(value.className), source } });
                }
            },
            'classConstant': (value: Extract<PhpAstValue, {
                readonly kind: 'class_constant';
            }>) => {
                {
                    return add({ kind: 'class-constant', value: { id: base, owner: semanticIdentifier(value.owner), name: semanticIdentifier(value.name), source } });
                }
            },
            'methodChain': (value: Extract<PhpAstValue, {
                readonly kind: 'method_chain';
            }>) => {
                {
                    const receiver = expression(value.receiver, `${base}:receiver`);
                    const args = projectRelation(value.arguments, (argument, index) => expressionArgument(argument, `${base}:arg:${index}`));
                    const id = add({ kind: 'invocation', value: { id: base, receiver: semanticPresent(receiver), operation: semanticOperation(value.property), arguments: args, source } });
                    relate(id, receiver, 'depends_on', 'receiver');
                    projectRelation(args, argument => { relate(id, argument, 'depends_on', 'argument'); return argument; });
                    return id;
                }
            },
            'functionCall': (value: Extract<PhpAstValue, {
                readonly kind: 'function_call';
            }>) => {
                {
                    const args = projectRelation(value.arguments, (argument, index) => expressionArgument(argument, `${base}:arg:${index}`));
                    const id = add({ kind: 'invocation', value: { id: base, receiver: semanticAbsent('not_applicable'), operation: semanticOperation(value.functionName), arguments: args, source } });
                    projectRelation(args, argument => { relate(id, argument, 'depends_on', 'argument'); return argument; });
                    return id;
                }
            },
            'callableCall': (value: Extract<PhpAstValue, {
                readonly kind: 'callable_call';
            }>) => {
                {
                    const callable = expression(value.callable, `${base}:callable`);
                    const args = projectRelation(value.arguments, (argument, index) => expressionArgument(argument, `${base}:arg:${index}`));
                    const id = add({ kind: 'invocation', value: { id: base, receiver: semanticPresent(callable), operation: semanticOperation('callable'), arguments: args, source } });
                    relate(id, callable, 'depends_on', 'callable');
                    projectRelation(args, argument => { relate(id, argument, 'depends_on', 'argument'); return argument; });
                    return id;
                }
            },
            'binaryExpression': (value: Extract<PhpAstValue, {
                readonly kind: 'binary_expression';
            }>) => {
                {
                    const left = expression(value.left, `${base}:left`);
                    const right = expression(value.right, `${base}:right`);
                    const operator = semanticOperator(value.operator.kind);
                    return relationOptionFold(operator, () => add({ kind: 'unsupported-expression', value: { id: base, reason: semanticText('unsupported-binary-operator'), source } }), definition => {
                        const operatorId = add({ kind: 'operator', value: { id: knowledgeId(source, 'operator', 'operator'), definition, source } });
                        const operationId = relationCase(definition, current => current.factKind, {
                            comparison: () => add({ kind: 'comparison', value: { id: base, operator: operatorId, left, right, source } }),
                        }, () => add({ kind: 'binary-operation', value: { id: base, operator: operatorId, left, right, source } }));
                        relate(operationId, operatorId, 'depends_on', 'operator');
                        relate(operationId, left, 'depends_on', 'operand_left');
                        relate(operationId, right, 'depends_on', 'operand_right');
                        return operationId;
                    });
                }
            },
            'unaryExpression': (value: Extract<PhpAstValue, {
                readonly kind: 'unary_expression';
            }>) => {
                {
                    const operand = expression(value.operand, `${base}:operand`);
                    const operator = semanticOperator(value.operator.kind);
                    return relationOptionFold(operator, () => add({ kind: 'unsupported-expression', value: { id: base, reason: semanticText('unsupported-unary-operator'), source } }), definition => {
                        const operatorId = add({ kind: 'operator', value: { id: knowledgeId(source, 'operator', 'operator'), definition, source } });
                        const id = add({ kind: 'unary-operation', value: { id: base, operator: operatorId, operand, source } });
                        relate(id, operatorId, 'depends_on', 'operator');
                        relate(id, operand, 'depends_on', 'operand');
                        return id;
                    });
                }
            },
            'assignmentExpression': (value: Extract<PhpAstValue, {
                readonly kind: 'assignment_expression';
            }>) => {
                {
                    const valueId = expression(value.value, `${base}:value`);
                    const target = assignmentTarget(value.target, `${base}:target`, source);
                    const id = add({ kind: 'assignment', value: { id: base, target, value: valueId, operator: semanticAssignmentOperator(value.operator.kind), reference: semanticAssignmentReference(value.reference.kind), source } });
                    relate(id, valueId, 'depends_on', 'value');
                    relate(id, target, 'depends_on', 'target');
                    relate(valueId, target, 'flows_to', 'target');
                    return id;
                }
            },
            'ternaryExpression': (value: Extract<PhpAstValue, {
                readonly kind: 'ternary_expression';
            }>) => {
                {
                    const predicateExpression = expression(value.condition, `${base}:predicate`);
                    const predicateId = predicate(predicateExpression, evidenceSourceOf(value));
                    const whenTrue = expression(value.trueBranch, `${base}:true`);
                    const whenFalse = expression(value.falseBranch, `${base}:false`);
                    const trueOutcome = outcome(knowledgeId(evidenceSourceOf(value), 'outcome', 'true'), 'satisfied', whenTrue, evidenceSourceOf(value));
                    const falseOutcome = outcome(knowledgeId(evidenceSourceOf(value), 'outcome', 'false'), 'unsatisfied', whenFalse, evidenceSourceOf(value));
                    const id = add({ kind: 'region', value: { id: base, source: evidenceSourceOf(value) } });
                    relate(id, predicateId, 'depends_on', 'predicate');
                    relate(id, trueOutcome, 'depends_on', 'candidate');
                    relate(id, falseOutcome, 'depends_on', 'candidate');
                    relate(trueOutcome, whenTrue, 'depends_on', 'value', semanticPresent({ predicate: predicateId, polarity: 'satisfied' }));
                    relate(falseOutcome, whenFalse, 'depends_on', 'value', semanticPresent({ predicate: predicateId, polarity: 'unsatisfied' }));
                    return id;
                }
            },
            'shortTernary': (value: Extract<PhpAstValue, {
                readonly kind: 'short_ternary';
            }>) => {
                {
                    const predicateExpression = expression(value.condition, `${base}:predicate`);
                    const predicateId = predicate(predicateExpression, evidenceSourceOf(value));
                    const whenFalse = expression(value.falseBranch, `${base}:false`);
                    const falseOutcome = outcome(knowledgeId(evidenceSourceOf(value), 'outcome', 'false'), 'unsatisfied', whenFalse, evidenceSourceOf(value));
                    const id = add({ kind: 'region', value: { id: base, source: evidenceSourceOf(value) } });
                    relate(id, predicateId, 'depends_on', 'predicate');
                    relate(id, falseOutcome, 'depends_on', 'candidate');
                    relate(falseOutcome, whenFalse, 'depends_on', 'value', semanticPresent({ predicate: predicateId, polarity: 'unsatisfied' }));
                    return id;
                }
            },
            'nullCoalesce': (value: Extract<PhpAstValue, {
                readonly kind: 'null_coalesce';
            }>) => {
                {
                    const left = expression(value.left, `${base}:left`);
                    const right = expression(value.right, `${base}:right`);
                    const nullishPredicate = predicate(left, evidenceSourceOf(value), 'nullish_evaluation');
                    const primary = outcome(knowledgeId(evidenceSourceOf(value), 'outcome', 'primary'), 'unsatisfied', left, evidenceSourceOf(value));
                    const fallback = outcome(knowledgeId(evidenceSourceOf(value), 'outcome', 'fallback'), 'satisfied', right, evidenceSourceOf(value));
                    const id = add({ kind: 'region', value: { id: base, source: evidenceSourceOf(value) } });
                    relate(id, nullishPredicate, 'depends_on', 'predicate');
                    relate(id, primary, 'depends_on', 'candidate');
                    relate(id, fallback, 'depends_on', 'candidate');
                    relate(primary, left, 'depends_on', 'value', semanticPresent({ predicate: nullishPredicate, polarity: 'unsatisfied' as const }));
                    relate(fallback, right, 'depends_on', 'value', semanticPresent({ predicate: nullishPredicate, polarity: 'satisfied' as const }));
                    return id;
                }
            },
            'closure': (value: Extract<PhpAstValue, {
                readonly kind: 'closure';
            }>) => {
                {
                    const body = visit(value.body, `${base}:body`);
                    const parameters = projectRelation(value.parameters, parameter => semanticIdentifier(parameter.variable));
                    const captures = projectRelation(value.captures, capture => semanticIdentifier(capture.variable));
                    const returnType: SemanticPresence<import('./semanticKnowledgeDataFlowRelations').SemanticText> = relationResolve(relationEqual(value.returnType.kind, 'declared'), () => semanticPresent(semanticText(String(JSON.stringify(relationVariantValue(value.returnType, 'declared').type)))), () => semanticAbsent('not_provided'));
                    const id = add({ kind: 'closure', value: { id: base, parameters, captures, returnType, body, source } });
                    relate(id, body, 'depends_on', 'body');
                    return id;
                }
            },
            'arrowFunction': (value: Extract<PhpAstValue, {
                readonly kind: 'arrow_function';
            }>) => {
                {
                    const body = expression(value.body, `${base}:body`);
                    const parameters = projectRelation(value.parameters, parameter => semanticIdentifier(parameter.variable));
                    const id = add({ kind: 'arrow-function', value: { id: base, parameters, body, source } });
                    relate(id, body, 'depends_on', 'body');
                    return id;
                }
            },
            'anonymousClassConstruct': (value: Extract<PhpAstValue, {
                readonly kind: 'anonymous_class_construct';
            }>) => {
                {
                    const args = projectRelation(value.arguments, (argument, index) => expressionArgument(argument, `${base}:arg:${index}`));
                    const anonymousClass = add({ kind: 'anonymous-class', value: { id: knowledgeId(source, 'anonymous-class', 'class'), extendsClass: relationCase(value.class.extendsClass, current => typeof current, { string: current => semanticPresent(semanticIdentifier(current as AstIdentifier)), object: () => semanticAbsent('not_provided') }, () => semanticAbsent('not_provided')), source } });
                    const id = add({ kind: 'construction', value: { id: base, className: semanticAbsent('not_applicable'), classExpression: semanticPresent(anonymousClass), arguments: args, source } });
                    relate(id, anonymousClass, 'depends_on', 'class_expression');
                    projectRelation(args, argument => { relate(id, argument, 'depends_on', 'argument'); return argument; });
                    return id;
                }
            },
            'unsupported': (value: Extract<PhpAstValue, {
                readonly kind: 'unsupported';
            }>) => {
                return add({ kind: 'unsupported-expression', value: { id: base, reason: semanticText(value.reason), source } });
            },
            'matchExpression': (value: Extract<PhpAstValue, {
                readonly kind: 'match_expression';
            }>) => {
                {
                    const subject = expression(value.subject, `${base}:subject`);
                    const id = add({ kind: 'region', value: { id: base, source: evidenceSourceOf(value) } });
                    projectRelation(value.arms, (arm, index) => {
                        const armValue = expression(arm.value, `${base}:arm:${index}:value`);
                        const armOutcome = outcome(knowledgeId(evidenceSourceOf(value), 'outcome', `arm:${index}`), relationCase(arm, current => current.kind, { conditional: () => 'matched', default: () => 'default' }, () => 'default'), armValue, evidenceSourceOf(value));
                        relate(id, armOutcome, 'depends_on', 'candidate');
                        relationCase(arm, current => current.kind, {
                            conditional: current => { projectRelation(relationVariantValue(current, 'conditional').conditions, (condition: PhpAstValue, conditionIndex: number) => {
                                const candidate = expression(condition, `${base}:arm:${index}:${conditionIndex}:candidate`);
                                const matchId = match(subject, candidate, 'strict', evidenceSourceOf(value), `arm:${index}:${conditionIndex}`);
                                const predicateId = predicate(matchId, evidenceSourceOf(value), 'match', `arm:${index}:${conditionIndex}`);
                                relate(id, predicateId, 'depends_on', 'predicate');
                                relate(armOutcome, armValue, 'depends_on', 'value', semanticPresent({ predicate: predicateId, polarity: 'satisfied' as const }));
                                return predicateId;
                            }); return armOutcome; },
                        }, () => armOutcome);
                        return armOutcome;
                    });
                    return id;
                }
            },
            __default__: (_value: PhpAstValue) => {
                {
                    const id = add({ kind: 'unsupported-expression', value: { id: base, reason: semanticText('unsupported-expression'), source } });
                    return id;
                }
            },
        });
        const dispatchExpression = (node: PhpAstValue): KnowledgeId => matchPhpAstValue(node, expressionHandlers);
        return dispatchExpression(value);
    };
    return expression;
};

/** Closed source-language spelling vocabulary; these are evidence, not host control flow. */
export const PHP_SYNTAX_OPERATOR_SPELLINGS = Object.freeze({
  nullCoalesce: '??',
  nullCoalesceAssign: '??=',
  identical: '===',
  notIdentical: '!==',
});
