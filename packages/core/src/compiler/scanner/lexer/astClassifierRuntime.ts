import { PHP_SYNTAX_OPERATOR_SPELLINGS } from './routeAst/phpAstExpressionSyntaxEvidenceRegistry';
import { astClassificationRuleAlgebra, type AstClassificationJudgment, type AstClassificationResolverContract, type AstClassificationRule, type AstRuleApplicability, type AstRuleResolution } from '../../../types/upstream/astClassifierRuleAlgebra';
import { scannerTokenStructureInterface, type TokenEvidenceLocation, type TokenOccurrenceEvidence } from '../../../types/upstream/scannerTokenStructureAlgebra';
import type { DelimitedTokenJudgment } from '../../../types/upstream/scannerTokenStructureInterface';
import { scannerAstOperatorEvidenceAlgebra } from '../../../types/upstream/scannerAstOperatorEvidenceAlgebra';
import { SCANNER_AST_OPERATOR, SCANNER_AST_OPERATOR_EVIDENCE_FOUND, SCANNER_AST_OPERATOR_EVIDENCE_MALFORMED, SCANNER_AST_OPERATOR_EVIDENCE_NOT_FOUND } from '../../../types/upstream/scannerAstOperatorEvidenceInterface';
import { scannerStatementBoundaryContractAlgebra } from '../../../types/upstream/scannerStatementBoundaryAlgebra';
import { scannerStatementControlContractAlgebra } from '../../../types/upstream/scannerStatementControlAlgebra';
import { scannerConditionalStatementContractAlgebra } from '../../../types/upstream/scannerConditionalStatementAlgebra';
import { scannerLoopStatementContractAlgebra } from '../../../types/upstream/scannerLoopStatementAlgebra';
import { scannerSwitchStatementContractAlgebra } from '../../../types/upstream/scannerSwitchStatementAlgebra';
import type { ScannerConditionalStatementEvidence } from '../../../types/upstream/scannerConditionalStatementInterface';
import type { ScannerLoopStatementEvidence } from '../../../types/upstream/scannerLoopStatementInterface';
import type { ScannerMatchExpressionJudgment } from '../../../types/upstream/scannerMatchExpressionInterface';
import type { ScannerCastExpressionJudgment } from '../../../types/upstream/scannerCastExpressionInterface';
import { scannerCastExpressionContractAlgebra } from '../../../types/upstream/scannerCastExpressionAlgebra';
import { scannerAstExpressionCandidateContractAlgebra } from '../../../types/upstream/scannerAstExpressionCandidateAlgebra';
import { SCANNER_AST_EXPRESSION_PRECEDENCE, SCANNER_EXPRESSION_CANDIDATE as EXPRESSION_CANDIDATE, type ScannerExpressionCandidateEvidence, type ScannerExpressionCandidateId } from '../../../types/upstream/scannerAstExpressionCandidateInterface';
import type { ScannerStatementControlKind } from '../../../types/upstream/scannerStatementControlInterface';
import { scannerStatementSequenceAlgebra } from '../../../types/upstream/scannerStatementSequenceAlgebra';
import type { ScannerAstSourceFailureInterface, ScannerAstSourceFailureJudgment } from '../../../types/upstream/scannerAstSourceFailureInterface';
import type { StructuredStatementJudgment } from '../../../types/upstream/scannerStatementSequenceInterface';
import { scannerAssignmentPartsAlgebra, type AssignmentOperatorRule } from '../../../types/upstream/scannerAssignmentPartsAlgebra';
import type { AssignmentPartsJudgment } from '../../../types/upstream/scannerAssignmentPartsInterface';
import { scannerAssignmentTargetContractAlgebra } from '../../../types/upstream/scannerAssignmentTargetAlgebra';
import type { AssignmentTargetArrayAccessEvidence, AssignmentTargetEvidenceJudgment, AssignmentTargetMemberEvidence } from '../../../types/upstream/scannerAssignmentTargetInterface';
import { scannerCallableListContractAlgebra } from '../../../types/upstream/scannerCallableListAlgebra';
import type { CallableParameterTypeEvidence } from '../../../types/upstream/scannerCallableListInterface';
import type { PhpParameterTypeAst } from './phpMethodAstTypes';
import { scannerMatchExpressionAlgebra } from '../../../types/upstream/scannerMatchExpressionAlgebra';
import { SCANNER_MATCH_ARM_DEFAULT, SCANNER_MATCH_ARM_CONDITIONAL, SCANNER_MATCH_CONTRACT_VIOLATION, SCANNER_MATCH_MALFORMED, SCANNER_MATCH_NOT_APPLICABLE, SCANNER_MATCH_RESOLVED } from '../../../types/upstream/scannerMatchExpressionInterface';
import { resolvePhpExpressionRootOperator } from './phpExpressionOperatorContract';
import { projectPhpExpressionStructure } from './phpExpressionStructureProjector';
import { providePhpExpressionStructureJudgment, type PhpExpressionDelimiterEvidence } from './phpExpressionStructureEvidenceProvider';

import { relationNotEqual } from '../../../semantic/relations/semanticRelations';
import { PHP_STATEMENT_KINDS } from './phpAstStatementKinds';
import { tokenAt, tokenValueOr, tokenKindOr } from './tokenEvidence';
/** Converts tokenized PHP expressions into structured Laravel scanner AST. */
import { PhpAstFactory } from './PhpAst';
import type { AstIdentifier, PhpArgument, PhpAstValue, PhpAstValueNode, PhpPropertyPath, TokenDescriptor, PhpBlock, PhpParameter, PhpClosureCapture, PhpStatement, PhpAccessMode, PhpBinaryOperator } from './PhpAst';
import { createAstIdentifier, createSourceOffset } from './phpAstTypes';
import type { PhpAssignmentTarget, PhpAssignmentDestructuringEntry, PhpAssignmentDestructuringPattern } from './phpAstStatementTypes';
import { phpSourceTokenizer } from './tokenizer';
import { parsePhpMethod } from './phpMethodParser';
import { relationEqual, relationAny, relationAll } from '../../../semantic/relations/semanticRelations';
import { relationGate, relationFirst, relationSelect, relationProject, relationFold, relationOptionMap, relationIndexOf, relationLastIndexOf, relationEvery, relationMapValueOr, relationOptionFold, relationAdvanceIndex, relationLookup, relationSlice, relationCount, relationTextLength, relationTextIsUpperIdentifier, relationTextSlice, relationSome, relationNone, relationIsNone, relationIsPresent, relationVariantValue, relationVariant, relationVariantFold, relationOptionalFold, type RelationOption, type RelationNone, type RelationMaybe } from '../../../semantic/relations/relationalSequence';
import { solveCandidate, requirement } from '../../../semantic/kernel/semanticDecisionRewriteEngine';

export function classifyPhpBlock(tokens: readonly TokenDescriptor[]): PhpBlock {
    return parseBlock(tokens);
}
export function classifyAstValue(raw: string): PhpAstValue {
    const tokens = relationSelect(phpSourceTokenizer.tokenize(raw), token => relationNotEqual(token.type, 'EOF'));
    return classifyAstTokens(tokens);
}
const nodeClassification = (resolve: (tokens: readonly TokenDescriptor[]) => RelationOption<PhpAstValue>): ((tokens: readonly TokenDescriptor[]) => RelationOption<PhpAstValueNode>) => tokens => relationOptionMap(resolve(tokens), value => value);

const alwaysApplicable = (): AstRuleApplicability => Object.freeze({ kind: 'applicable' });
const notApplicable = (): AstRuleApplicability => Object.freeze({ kind: 'not_applicable' });
type AstClassificationSourceFailure =
    | Readonly<{ readonly kind: 'malformed_match_expression'; readonly judgment: Extract<ScannerMatchExpressionJudgment<TokenDescriptor>, { readonly kind: typeof SCANNER_MATCH_MALFORMED }> }>
    | Readonly<{ readonly kind: 'match_expression_contract_violation'; readonly judgment: Extract<ScannerMatchExpressionJudgment<TokenDescriptor>, { readonly kind: typeof SCANNER_MATCH_CONTRACT_VIOLATION }> }>
    | Readonly<{ readonly kind: 'malformed_cast_expression'; readonly judgment: Extract<ScannerCastExpressionJudgment<TokenDescriptor>, { readonly kind: 'malformed' }> }>
    | Readonly<{ readonly kind: 'malformed_expression_structure'; readonly judgment: Extract<ReturnType<typeof providePhpExpressionStructureJudgment>, { readonly kind: 'malformed_source' }> }>
    | Readonly<{ readonly kind: 'expression_structure_contract_violation'; readonly judgment: Extract<ReturnType<typeof providePhpExpressionStructureJudgment>, { readonly kind: 'contract_violation' }> }>
    | Readonly<{ readonly kind: 'malformed_assignment_parts'; readonly judgment: Extract<AssignmentPartsJudgment<PhpAssignmentTarget, PhpAstValue, import('./phpAstStatementTypes').PhpAssignmentOperator['kind'], TokenDescriptor>, { readonly kind: 'malformed' }> }>
    | Readonly<{ readonly kind: 'malformed_parenthesized_expression'; readonly judgment: Extract<DelimitedTokenJudgment<TokenDescriptor>, { readonly kind: 'malformed' }> }>
    | Readonly<{ readonly kind: 'assignment_parts_contract_violation'; readonly judgment: Extract<AssignmentPartsJudgment<PhpAssignmentTarget, PhpAstValue, import('./phpAstStatementTypes').PhpAssignmentOperator['kind'], TokenDescriptor>, { readonly kind: 'contract_violation' }> }>;

export class AstClassificationFailureError extends Error {
    readonly judgment: Extract<AstClassificationJudgment<PhpAstValueNode, ScannerExpressionCandidateId, AstClassificationSourceFailure>, { readonly kind: 'malformed' | 'rule_contract_violation' }>;
    constructor(judgment: Extract<AstClassificationJudgment<PhpAstValueNode, ScannerExpressionCandidateId, AstClassificationSourceFailure>, { readonly kind: 'malformed' | 'rule_contract_violation' }>) {
        super(judgment.kind === 'malformed' ? `Malformed PHP expression: ${judgment.failure.kind}` : `PHP expression rule contract violation: ${judgment.failure.kind}`);
        this.name = 'AstClassificationFailureError';
        this.judgment = judgment;
    }
}

const resolveFromRelation = <Output>(result: RelationOption<Output>): AstRuleResolution<Output> => relationOptionFold(
    result,
    () => Object.freeze({ kind: 'not_resolved' as const }),
    value => Object.freeze({ kind: 'resolved' as const, value }),
);

type AstClassificationInput = Readonly<{
    readonly tokens: readonly TokenDescriptor[];
    readonly candidates: readonly ScannerExpressionCandidateEvidence<TokenDescriptor>[];
}>;

type AstExpressionResolver = AstClassificationResolverContract<
    AstClassificationInput,
    PhpAstValueNode,
    readonly TokenDescriptor[],
    RelationOption<PhpAstValueNode>,
    AstClassificationSourceFailure
>;

const expressionRule = (
    id: ScannerExpressionCandidateId,
    resolver: AstExpressionResolver,
): AstClassificationRule<AstClassificationInput, PhpAstValueNode, ScannerExpressionCandidateId, AstClassificationSourceFailure> => Object.freeze({
    id,
    applies: (input): AstRuleApplicability => input.candidates.some(candidate => candidate.id === id) ? alwaysApplicable() : notApplicable(),
    resolve: input => {
        switch (resolver.kind) {
            case 'judgment': return resolver.resolve(input);
            case 'legacy_adapter':
                switch (resolver.input) {
                    case 'context': return resolveFromRelation(resolver.deriveLegacy(input));
                    case 'tokens': return resolveFromRelation(resolver.resolveLegacy(input.tokens));
                }
        }
    },
});

/**
 * Canonical ordered expression policy. Candidate identities and precedence are
 * defined upstream; this runtime supplies syntax capabilities only. Arbitration
 * returns the existing rule-algebra's closed judgment rather than a relation.
 * Parser-specific helpers still have a legacy RelationOption adapter, which is
 * an explicit migration boundary rather than the policy/judgment representation.
 */
const AST_CLASSIFICATION_RULES: readonly AstClassificationRule<AstClassificationInput, PhpAstValueNode, ScannerExpressionCandidateId, AstClassificationSourceFailure>[] = Object.freeze([
    expressionRule(EXPRESSION_CANDIDATE.match, { kind: 'judgment', resolve: input => classifyMatch(input.tokens) }),
    expressionRule(EXPRESSION_CANDIDATE.closure, { kind: 'legacy_adapter', input: 'tokens', resolveLegacy: nodeClassification(classifyClosure) }),
    expressionRule(EXPRESSION_CANDIDATE.arrow, { kind: 'legacy_adapter', input: 'tokens', resolveLegacy: nodeClassification(classifyArrowFunction) }),
    expressionRule(EXPRESSION_CANDIDATE.instanceof, { kind: 'legacy_adapter', input: 'context', deriveLegacy: context => {
        const candidate = context.candidates.find(entry => entry.id === EXPRESSION_CANDIDATE.instanceof);
        const occurrence = candidate?.operatorEvidence?.[0];
        return occurrence === undefined ? relationNone() : classifyInstanceOf(context.tokens, occurrence);
    } }),
    expressionRule(EXPRESSION_CANDIDATE.cast, { kind: 'judgment', resolve: input => classifyCast(input.tokens) }),
    expressionRule(EXPRESSION_CANDIDATE.parenthesized, { kind: 'judgment', resolve: input => classifyParenthesized(input.tokens) }),
    expressionRule(EXPRESSION_CANDIDATE.assignment, { kind: 'judgment', resolve: input => {
        const candidate = input.candidates.find(entry => entry.id === EXPRESSION_CANDIDATE.assignment);
        return classifyAssignmentExpression(input.tokens, candidate?.operatorEvidence);
    } }),
    expressionRule(EXPRESSION_CANDIDATE.single, { kind: 'judgment', resolve: input => input.tokens.length === 1 && input.tokens[0] !== undefined ? Object.freeze({ kind: 'resolved', value: classifySingle(input.tokens[0]) }) : Object.freeze({ kind: 'not_resolved' }) }),
    expressionRule(EXPRESSION_CANDIDATE.compound, { kind: 'judgment', resolve: input => classifyCompoundExpression(input.tokens) }),
    expressionRule(EXPRESSION_CANDIDATE.inlineArray, { kind: 'judgment', resolve: input => Object.freeze({ kind: 'resolved', value: classifyInlineArray(input.tokens) }) }),
    expressionRule(EXPRESSION_CANDIDATE.classConstant, { kind: 'legacy_adapter', input: 'tokens', resolveLegacy: classifyClassConstant }),
    expressionRule(EXPRESSION_CANDIDATE.classReference, { kind: 'legacy_adapter', input: 'tokens', resolveLegacy: classifyClassReference }),
    expressionRule(EXPRESSION_CANDIDATE.construct, { kind: 'legacy_adapter', input: 'tokens', resolveLegacy: classifyNewExpression }),
    expressionRule(EXPRESSION_CANDIDATE.staticCall, { kind: 'legacy_adapter', input: 'tokens', resolveLegacy: nodeClassification(classifyStaticCall) }),
    expressionRule(EXPRESSION_CANDIDATE.member, { kind: 'legacy_adapter', input: 'tokens', resolveLegacy: nodeClassification(classifyMember) }),
]);
export function classifyAstTokens(tokens: readonly TokenDescriptor[]): PhpAstValue {
    const candidateJudgment = scannerAstExpressionCandidateContractAlgebra.resolve({
        tokens,
        tokenValue: token => token.value,
        tokenKind: token => token.type,
    });
    switch (candidateJudgment.kind) {
        case 'not_applicable': return locateAstValue(PhpAstFactory.unsupported(tokens), tokens);
        case 'resolved': {
            const precedenceVerification = astClassificationRuleAlgebra.verifyPrecedence(AST_CLASSIFICATION_RULES, SCANNER_AST_EXPRESSION_PRECEDENCE);
            if (precedenceVerification.kind === 'invalid') {
                throw new Error(`AST classification precedence violation: ${precedenceVerification.reason}`);
            }
            const input: AstClassificationInput = Object.freeze({ tokens, candidates: candidateJudgment.candidates });
            const judgment = astClassificationRuleAlgebra.resolveFirst(AST_CLASSIFICATION_RULES, input);
            const judgmentVerification = astClassificationRuleAlgebra.verifyJudgment(AST_CLASSIFICATION_RULES, judgment);
            if (judgmentVerification.kind === 'invalid') {
                throw new Error(`AST classification judgment violation: ${judgmentVerification.reason}`);
            }
            switch (judgment.kind) {
                case 'resolved': return locateAstValue(judgment.value, tokens);
                case 'not_resolved': return locateAstValue(PhpAstFactory.unsupported(tokens), tokens);
                case 'malformed':
                case 'rule_contract_violation': throw new AstClassificationFailureError(judgment);
                case 'contract_violation': throw new Error(`AST classification contract violation: ${judgment.reason}`);
            }
        }
    }
}
function classifyNewExpression(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValueNode> {
    return relationGate(relationEqual(tokenValueOr(tokens, 0), 'new'), () => {
        const anonymous = relationGate(relationEqual(tokenValueOr(tokens, 1), 'class'), () => classifyAnonymousClass(tokens), () => relationNone());
        return relationOptionFold(anonymous, () => {
            return relationGate(relationEqual(tokenValueOr(tokens, 1), 'class'), () => relationNone(), () => {
            const open = indexOf(tokens, '(', 2);
            const close = lastIndexOf(tokens, ')');
            const hasArguments = relationAll([open >= 0, close > open]);
            const classTokens = relationGate(hasArguments, () => relationSlice(tokens, 1, open), () => relationSlice(tokens, 1));
            const args = relationGate(hasArguments, () => parseArguments(relationSlice(tokens, relationAdvanceIndex(open, 1), close)), () => []);
            return relationGate(relationAll([relationEqual(tokenKindOr(classTokens, 0, 'EOF'), 'IDENTIFIER'), relationEqual(relationCount(classTokens), 1)]), () => relationSome(PhpAstFactory.construct(createAstIdentifier(classTokens[0].value), args)), () => relationGate(relationCount(classTokens) > 0, () => relationSome(PhpAstFactory.dynamicConstruct(classifyAstTokens(classTokens), args)), () => relationNone()));
        });
        }, () => relationNone());
    }, () => relationNone());
}
function classifyAnonymousClass(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValueNode> {
    const open = indexOf(tokens, '{', 2);
    return relationGate(relationAny([
        open < 0, relationNotEqual(tokenValueOr(tokens, relationCount(tokens) - 1), '}')
    ]), () => relationNone(), () => {
        const close = matchingClose(tokens, open);
        return relationGate(relationNotEqual(close, relationCount(tokens) - 1), () => relationNone(), () => {
            const extendsIndex = relationIndexOf(tokens, (token, index) => relationAll([index >= 2, index < open, relationEqual(token.value, 'extends')]));
            const extendsToken = relationOptionFold(relationLookup(relationProject(tokens, (token, index) => [index, token] as const), relationAdvanceIndex(extendsIndex, 1)), () => relationNone<TokenDescriptor>(), token => relationSome(token));
            const validExtends = relationAny([
                extendsIndex < 0, relationOptionFold(extendsToken, () => false, token => relationEqual(token.type, 'IDENTIFIER'))
            ]);
            return relationGate(validExtends, () => {
                const extendsClass = relationGate(extendsIndex < 0, () => ({ kind: 'absent' as const }), () => relationOptionFold(extendsToken, () => ({ kind: 'absent' as const }), token => createAstIdentifier(token.value)));
                const body = relationSlice(tokens, relationAdvanceIndex(open, 1), close);
                const state = relationFold(body, { depth: 0, members: [] as import('./phpAstExpressionTypes').PhpAnonymousClassMember[] }, (current, token, index) => {
                    return relationGate(relationEqual(token.value, '{'), () => ({ ...current, depth: current.depth + 1 }), () => relationGate(relationEqual(token.value, '}'), () => ({ ...current, depth: current.depth - 1 }), () => relationGate(relationAll([relationEqual(current.depth, 0), relationEqual(token.value, 'function')]), () => {
                        return relationOptionFold(
                            parsePhpMethod('', body, index),
                            () => current,
                            method => {
                              const member: import('./phpAstExpressionTypes').PhpAnonymousClassMember = { kind: 'method', value: method };
                              return { ...current, members: [...current.members, member] };
                            },
                        );
                    }, () => current)));
                });
                return relationSome(PhpAstFactory.anonymousClassConstruct({ kind: 'anonymous_class', extendsClass, members: Object.freeze(state.members) }, []));
            }, () => relationNone());
        });
    });
}

function locateAstValue(value: PhpAstValueNode, tokens: readonly TokenDescriptor[]): PhpAstValue {
    const first = tokens[0];
    const last = tokens[relationCount(tokens) - 1];
    return relationGate(relationAny([
        !first, !last
    ]), () => {
        return Object.freeze({ ...value, source: { startOffset: createSourceOffset(0), endOffset: createSourceOffset(0) } });
    }, () => {
        return Object.freeze({
            ...value,
            source: {
                startOffset: createSourceOffset(first.startOffset),
                endOffset: createSourceOffset(last.endOffset),
            },
        });
    });
}
const locateAstOption = (value: RelationOption<PhpAstValueNode>, tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValue> =>
    relationOptionMap(value, node => locateAstValue(node, tokens));

function classifyInlineArray(tokens: readonly TokenDescriptor[]): PhpAstValueNode {
    const contents = relationSlice(tokens, 1, relationAdvanceIndex(relationCount(tokens), -1));
    const partition = scannerTokenStructureInterface.partitionTopLevel({
        tokens: contents,
        separator: ',',
        tokenValue: token => token.value,
    });
    if (partition.kind === 'malformed') return PhpAstFactory.unsupported(tokens);
    const parts = partition.parts;
    type InlineArrayState = { valid: boolean; entries: import('./phpAstTypes').PhpArrayEntry[] };
    const state: InlineArrayState = relationFold(parts, { valid: true as boolean, entries: [] as import('./phpAstTypes').PhpArrayEntry[] }, (current, part) => relationGate<InlineArrayState>(relationAny([
        !current.valid,
        relationEqual(relationCount(part), 0)
    ]), () => current, () => {
        const unpacked = relationEqual(tokenKindOr(part, 0, 'EOF'), 'ELLIPSIS');
        return relationGate<{ valid: boolean; entries: import('./phpAstTypes').PhpArrayEntry[] }>(unpacked, () => ({
            valid: true as boolean,
            entries: [...current.entries, { kind: 'unpacked' as const, value: classifyAstTokens(relationSlice(part, 1)), source: { startOffset: createSourceOffset(part[0].startOffset), endOffset: createSourceOffset(part[relationCount(part) - 1].endOffset) } }],
        }), () => {
            const arrow = resolveAstOperatorEvidence(part, SCANNER_AST_OPERATOR.fatArrow);
            return relationGate<{ valid: boolean; entries: import('./phpAstTypes').PhpArrayEntry[] }>(arrow !== undefined && arrow.before.length > 0, () => {
                const keyTokens = arrow?.before ?? [];
                const valueTokens = arrow?.after ?? [];
                const key = relationFirst(keyTokens, item => relationAny([
                    relationEqual(item.type, 'STRING'),
                    relationEqual(item.type, 'IDENTIFIER'),
                    relationEqual(item.type, 'NUMBER')
                ]));
                return relationGate<{ valid: boolean; entries: import('./phpAstTypes').PhpArrayEntry[] }>(relationAll([relationEqual(key.kind, 'some'), relationCount(valueTokens) > 0]), () => ({
                    valid: true as boolean,
                    entries: [...current.entries, {
                            kind: 'keyed',
                            key: relationOptionFold(key,
                                () => ({ kind: 'expression' as const, value: classifyAstTokens(keyTokens) }),
                                resolvedKey => relationGate(relationEqual(resolvedKey.type, 'STRING'),
                                    () => ({ kind: 'string' as const, value: resolvedKey.value }),
                                    () => relationGate(relationEqual(resolvedKey.type, 'NUMBER'),
                                        () => ({ kind: 'integer' as const, value: Number(resolvedKey.value) }),
                                        () => ({ kind: 'expression' as const, value: classifyAstTokens(keyTokens) })))),
                            value: classifyAstTokens(valueTokens),
                            source: { startOffset: createSourceOffset(part[0].startOffset), endOffset: createSourceOffset(part[relationCount(part) - 1].endOffset) },
                        }],
                }), () => ({ valid: false, entries: current.entries }));
            }, () => ({ valid: true as boolean, entries: [...current.entries, { kind: 'positional', value: classifyAstTokens(part), source: { startOffset: createSourceOffset(part[0].startOffset), endOffset: createSourceOffset(part[relationCount(part) - 1].endOffset) } }] }));
        });
    }));
    return relationGate(state.valid, () => PhpAstFactory.nestedArray(state.entries), () => PhpAstFactory.unsupported(tokens));
}
function classifyMatch(tokens: readonly TokenDescriptor[]): AstRuleResolution<PhpAstValueNode, AstClassificationSourceFailure> {
    const judgment = scannerMatchExpressionAlgebra.resolve({
        tokens,
        tokenValue: token => token.value,
        sameToken: (left, right) => left === right,
        structure: scannerTokenStructureInterface,
    });
    switch (judgment.kind) {
        case SCANNER_MATCH_NOT_APPLICABLE:
            return Object.freeze({ kind: 'not_resolved' });
        case SCANNER_MATCH_MALFORMED:
            return Object.freeze({ kind: 'malformed', failure: Object.freeze({ kind: 'malformed_match_expression', judgment }) });
        case SCANNER_MATCH_CONTRACT_VIOLATION:
            return Object.freeze({ kind: 'rule_contract_violation', failure: Object.freeze({ kind: 'match_expression_contract_violation', judgment }) });
        case SCANNER_MATCH_RESOLVED: {
            const subject = classifyAstTokens(judgment.evidence.subject);
            const arms = relationProject(judgment.evidence.arms, arm => {
                switch (arm.kind) {
                    case SCANNER_MATCH_ARM_DEFAULT:
                        return PhpAstFactory.matchDefault(classifyAstTokens(arm.value));
                    case SCANNER_MATCH_ARM_CONDITIONAL:
                        return PhpAstFactory.matchConditional(relationProject(arm.conditions, classifyAstTokens), classifyAstTokens(arm.value));
                }
            });
            return Object.freeze({ kind: 'resolved', value: PhpAstFactory.matchExpression(subject, arms) });
        }
    }
}
function classifyParenthesized(tokens: readonly TokenDescriptor[]): AstRuleResolution<PhpAstValueNode, AstClassificationSourceFailure> {
    const delimiters = scannerTokenStructureInterface.matchLeadingDelimiter({
        tokens,
        tokenValue: token => token.value,
    });
    switch (delimiters.kind) {
        case 'not_found': return Object.freeze({ kind: 'not_resolved' });
        case 'malformed': return Object.freeze({
            kind: 'malformed',
            failure: Object.freeze({ kind: 'malformed_parenthesized_expression', judgment: delimiters }),
        });
        case 'matched': {
            const evidence = delimiters.evidence;
            if (evidence.opening.value !== '(' || evidence.closing.value !== ')' || evidence.suffix.length !== 0) {
                return Object.freeze({ kind: 'not_resolved' });
            }
            return Object.freeze({ kind: 'resolved', value: classifyAstTokens(evidence.contents) });
        }
    }
}
function classifyCast(tokens: readonly TokenDescriptor[]): AstRuleResolution<PhpAstValueNode, AstClassificationSourceFailure> {
    const judgment = scannerCastExpressionContractAlgebra.resolve({
        tokens,
        tokenValue: token => token.value,
        tokenKind: token => token.type,
    });
    switch (judgment.kind) {
        case 'not_applicable':
            return Object.freeze({ kind: 'not_resolved' });
        case 'malformed':
            return Object.freeze({ kind: 'malformed', failure: Object.freeze({ kind: 'malformed_cast_expression', judgment }) });
        case 'resolved': {
            const operand = classifyAstTokens(judgment.evidence.operand);
            switch (judgment.evidence.castType) {
                case 'int': return Object.freeze({ kind: 'resolved', value: locateAstValue(PhpAstFactory.castExpression({ kind: 'int' }, operand), tokens) });
                case 'float': return Object.freeze({ kind: 'resolved', value: locateAstValue(PhpAstFactory.castExpression({ kind: 'float' }, operand), tokens) });
                case 'string': return Object.freeze({ kind: 'resolved', value: locateAstValue(PhpAstFactory.castExpression({ kind: 'string' }, operand), tokens) });
                case 'bool': return Object.freeze({ kind: 'resolved', value: locateAstValue(PhpAstFactory.castExpression({ kind: 'bool' }, operand), tokens) });
                case 'array': return Object.freeze({ kind: 'resolved', value: locateAstValue(PhpAstFactory.castExpression({ kind: 'array' }, operand), tokens) });
                case 'object': return Object.freeze({ kind: 'resolved', value: locateAstValue(PhpAstFactory.castExpression({ kind: 'object' }, operand), tokens) });
            }
        }
    }
}
function classifyCompoundExpression(tokens: readonly TokenDescriptor[]): AstRuleResolution<PhpAstValueNode, AstClassificationSourceFailure> {
    const judgment = providePhpExpressionStructureJudgment(tokens, {
        findOuterArrayAccess: findOuterArrayAccessEvidence,
        matchingClose: matchingCloseEvidence,
    });
    switch (judgment.kind) {
        case 'not_structured': return Object.freeze({ kind: 'not_resolved' });
        case 'malformed_source': return Object.freeze({
            kind: 'malformed',
            failure: Object.freeze({ kind: 'malformed_expression_structure', judgment }),
        });
        case 'contract_violation': return Object.freeze({
            kind: 'rule_contract_violation',
            failure: Object.freeze({ kind: 'expression_structure_contract_violation', judgment }),
        });
        case 'structured': return Object.freeze({ kind: 'resolved', value: projectPhpExpressionStructure(judgment.structure, tokens, {
            classify: classifyAstTokens,
            parseArguments,
            locate: locateAstValue,
        }) });
    }
}

function classifyInstanceOf(tokens: readonly TokenDescriptor[], occurrence: TokenOccurrenceEvidence<TokenDescriptor>): RelationOption<PhpAstValue> {
    return relationGate(relationAny([occurrence.before.length === 0, occurrence.after.length === 0]), () => relationNone(), () =>
        relationOptionFold(tokenAt(occurrence.after, 0), () => relationNone(), token =>
            relationGate(relationNotEqual(token.token.type, 'IDENTIFIER'), () => relationNone(), () => relationSome(locateAstValue(PhpAstFactory.instanceOf(classifyAstTokens(occurrence.before), createAstIdentifier(token.token.value)), tokens)))));
}

class AstSourceJudgmentFailureError<Token> extends Error implements ScannerAstSourceFailureInterface<Token> {
    readonly kind = 'scanner_ast_source_failure' as const;
    constructor(readonly failure: ScannerAstSourceFailureJudgment<Token>) {
        super(`AST source judgment failure: ${failure.kind}`);
        this.name = 'AstSourceJudgmentFailureError';
    }
}

function classifyArrayAccess(tokens: readonly TokenDescriptor[]): AssignmentTargetEvidenceJudgment<AssignmentTargetArrayAccessEvidence<PhpAstValue>, TokenDescriptor> {
    const judgment = findOuterArrayAccessEvidence(tokens);
    switch (judgment.kind) {
        case 'not_found': return Object.freeze({ kind: 'unresolved' });
        case 'malformed': return Object.freeze({ kind: 'malformed', location: judgment.location, expected: judgment.expected, actual: judgment.actual });
        case 'matched': {
            const evidence = judgment.evidence;
            if (evidence.prefix.length === 0 || evidence.opening.value !== '[' || evidence.closing.value !== ']') return Object.freeze({ kind: 'unresolved' });
            return Object.freeze({ kind: 'resolved', evidence: Object.freeze({
                target: classifyAstTokens(evidence.prefix),
                index: classifyAstTokens(evidence.contents),
            }) });
        }
    }
}

function findOuterArrayAccessEvidence(tokens: readonly TokenDescriptor[]): PhpExpressionDelimiterEvidence {
    return scannerTokenStructureInterface.matchTrailingDelimiter({ tokens, tokenValue: token => token.value });
}

function matchingCloseEvidence(tokens: readonly TokenDescriptor[]): PhpExpressionDelimiterEvidence {
    return scannerTokenStructureInterface.matchLeadingDelimiter({ tokens, tokenValue: token => token.value });
}

/** Runtime asks for a typed operator judgment; structural lookup and semantic identity binding stay upstream. */
function resolveAstOperatorEvidence(tokens: readonly TokenDescriptor[], operator: typeof SCANNER_AST_OPERATOR.fatArrow | typeof SCANNER_AST_OPERATOR.as): TokenOccurrenceEvidence<TokenDescriptor> | undefined {
    const judgment = scannerAstOperatorEvidenceAlgebra.resolve({ tokens, operator, tokenValue: token => token.value });
    switch (judgment.kind) {
        case SCANNER_AST_OPERATOR_EVIDENCE_NOT_FOUND: return undefined;
        case SCANNER_AST_OPERATOR_EVIDENCE_MALFORMED:
            throw new Error(`Malformed token structure while resolving a typed AST operator: expected ${judgment.expected ?? '<none>'}, received ${judgment.actual}`);
        case SCANNER_AST_OPERATOR_EVIDENCE_FOUND: return judgment.occurrence;
        default: throw new Error('AST operator evidence contract violation');
    }
}
type PhpInterpolationMatch = Readonly<{ readonly index: number; readonly fragment: string }>;
const isPhpIdentifierStart = (value: string): boolean => relationAny([
    relationAll([relationEqual(value >= 'A', true), relationEqual(value <= 'Z', true)]),
    relationAll([relationEqual(value >= 'a', true), relationEqual(value <= 'z', true)]),
    relationEqual(value, '_'),
]);
const isPhpIdentifierPart = (value: string): boolean => relationAny([isPhpIdentifierStart(value), relationAll([relationEqual(value >= '0', true), relationEqual(value <= '9', true)])]);
const phpIdentifierEnd = (source: string, index: number): number => relationGate(
    relationAll([relationEqual(index < relationTextLength(source), true), isPhpIdentifierPart(source.charAt(index))]),
    () => phpIdentifierEnd(source, relationAdvanceIndex(index, 1)),
    () => index,
);
const isPhpConstantIdentifier = (value: string): boolean => relationTextIsUpperIdentifier(value);
const findInterpolationStart = (raw: string, index = 0): number => relationGate(
    relationEqual(index >= relationTextLength(raw), true),
    () => -1,
    () => relationGate(
        relationAny([relationEqual(raw.charAt(index), '$'), relationAll([relationEqual(raw.charAt(index), '{'), relationEqual(raw.charAt(relationAdvanceIndex(index, 1)), '$')])]),
        () => index,
        () => findInterpolationStart(raw, relationAdvanceIndex(index, 1)),
    ),
);
const interpolationEnd = (raw: string, start: number): number => {
    const brace = relationEqual(raw.charAt(start), '{');
    const variableStart = relationGate(brace, () => relationAdvanceIndex(start, 2), () => relationAdvanceIndex(start, 1));
    const firstEnd = phpIdentifierEnd(raw, variableStart);
    const chainEnd = relationGate(
        relationAll([relationEqual(raw.charAt(firstEnd), '-'), relationEqual(raw.charAt(relationAdvanceIndex(firstEnd, 1)), '>')]),
        () => phpIdentifierEnd(raw, relationAdvanceIndex(firstEnd, 2) + relationGate(relationEqual(raw.charAt(relationAdvanceIndex(firstEnd, 2)), '$'), () => 1, () => 0)),
        () => firstEnd,
    );
    return relationGate(brace, () => relationGate(relationEqual(raw.charAt(chainEnd), '}'), () => relationAdvanceIndex(chainEnd, 1), () => chainEnd), () => chainEnd);
};
const interpolationMatches = (raw: string, index = 0, output: readonly PhpInterpolationMatch[] = []): readonly PhpInterpolationMatch[] => {
    const start = findInterpolationStart(raw, index);
    return relationGate(start < 0, () => output, () => {
        const end = interpolationEnd(raw, start);
        return interpolationMatches(raw, relationAdvanceIndex(end, 1), [...output, { index: start, fragment: relationTextSlice(raw, start, relationAdvanceIndex(end, 1)) }]);
    });
};
function classifyInterpolatedString(raw: string): RelationOption<PhpAstValueNode> {
    const matches = interpolationMatches(raw);
    const state: { cursor: number; parts: import('./phpAstExpressionTypes').PhpInterpolatedStringPart[] } = relationFold(matches, { cursor: 0, parts: [] as import('./phpAstExpressionTypes').PhpInterpolatedStringPart[] }, (current, match) => {
        const index = match.index;
        const fragment = match.fragment;
        const expressionSource = relationGate(relationEqual(relationTextSlice(fragment, 0, 1), '{'), () => relationTextSlice(fragment, 1, relationAdvanceIndex(relationTextLength(fragment), -1)), () => fragment);
        const prefix = relationGate(index > current.cursor, () => [{ kind: 'text' as const, value: relationTextSlice(raw, current.cursor, index) }], () => []);
        return { cursor: relationAdvanceIndex(index, relationTextLength(fragment)), parts: [...current.parts, ...prefix, { kind: 'expression', value: classifyAstValue(expressionSource) }] };
    });
    return relationGate(relationEqual(state.cursor, 0), () => relationNone(), () => relationSome(PhpAstFactory.interpolatedString([...state.parts, ...relationGate(state.cursor < relationTextLength(raw), () => [{ kind: 'text' as const, value: relationTextSlice(raw, state.cursor) }], () => [])])));
}

const singleTokenCatalog: readonly (readonly [TokenDescriptor['type'], (token: TokenDescriptor) => PhpAstValueNode])[] = Object.freeze([
    ['STRING', (token) => relationOptionFold(classifyInterpolatedString(token.value), () => PhpAstFactory.stringLiteral(token.value), value => value)],
    ['NUMBER', (token) => PhpAstFactory.numberLiteral(token.value)],
    ['TRUE', () => PhpAstFactory.booleanLiteral(true)],
    ['FALSE', () => PhpAstFactory.booleanLiteral(false)],
    ['NULL', () => PhpAstFactory.nullLiteral()],
    ['VARIABLE', (token) => PhpAstFactory.variableReference(createAstIdentifier(relationTextSlice(token.value, 1)))],
    ['IDENTIFIER', (token) => relationGate(relationEqual(token.value, '__DIR__'), () => PhpAstFactory.magicConstant({ kind: 'dir' }), () => relationGate(relationEqual(token.value, '__FILE__'), () => PhpAstFactory.magicConstant({ kind: 'file' }), () => relationGate(isPhpConstantIdentifier(token.value), () => PhpAstFactory.constantReference(createAstIdentifier(token.value)), () => PhpAstFactory.unsupported([token]))))],
]);
function classifySingle(token: TokenDescriptor): PhpAstValueNode {
    return relationOptionFold(
        relationLookup(singleTokenCatalog, token.type),
        () => PhpAstFactory.unsupported([token]),
        resolve => resolve(token),
    );
}
function classifyStaticCall(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValue> {
    const separatorIndex = relationIndexOf(tokens, token => relationEqual(token.value, '::'));
    return relationGate(separatorIndex < 1, () => relationNone(), () => {
        const classTokens = relationSlice(tokens, 0, separatorIndex);
        const method = tokens[relationAdvanceIndex(separatorIndex, 1)];
        const opening = relationAdvanceIndex(separatorIndex, 2);
        const classReferenceIsWellFormed = relationAll([
            relationCount(classTokens) > 0,
            relationAll(classTokens.map(token => relationAny([
                relationEqual(token.type, 'IDENTIFIER'),
                relationEqual(token.value, '\\'),
            ]))),
            relationGate(classTokens.length > 1, () => relationAll(classTokens.map((token, index) =>
                relationGate(relationEqual(token.value, '\\'), () => relationAll([
                    relationGate(index > 0, () => relationEqual(classTokens[index - 1]?.type ?? 'EOF', 'IDENTIFIER'), () => true),
                    relationGate(index + 1 < classTokens.length, () => relationEqual(classTokens[index + 1]?.type ?? 'EOF', 'IDENTIFIER'), () => false),
                ]), () => true))), () => true),
        ]);
        return relationGate(relationAny([
            !classReferenceIsWellFormed,
            !method,
            relationNotEqual(method?.type ?? 'EOF', 'IDENTIFIER'),
            relationNotEqual(tokenValueOr(tokens, opening), '('),
        ]), () => relationNone(), () => {
            const className = createAstIdentifier(classTokens.map(token => token.value).join(''));
            const terminalName = createAstIdentifier(className.split('\\').at(-1) ?? className);
            const classReference = relationGate(
                className.startsWith('\\'),
                () => ({ kind: 'qualified_name' as const, sourceName: className, terminalName, form: 'fully_qualified' as const }),
                () => relationGate(
                    className.startsWith('namespace\\'),
                    () => ({ kind: 'qualified_name' as const, sourceName: className, terminalName, form: 'namespace_relative' as const }),
                    () => relationGate(
                        className.includes('\\'),
                        () => ({ kind: 'qualified_name' as const, sourceName: className, terminalName, form: 'import_or_namespace_dependent' as const }),
                        () => ({ kind: 'simple_name' as const, sourceName: className, terminalName }),
                    ),
                ),
            );
            const resourceClassName = classReference.terminalName;
            const close = matchingClose(tokens, opening);
            const args = relationGate(close > opening, () => parseArguments(relationSlice(tokens, relationAdvanceIndex(opening, 1), close)), () => []);
            return relationGate(relationEqual(method.value, 'collection'), () => {
                return relationOptionFold(relationFirst(args, () => true), () => relationSome(locateAstValue(PhpAstFactory.unsupported(tokens), tokens)), arg => relationSome(locateAstValue(PhpAstFactory.resourceCollection(resourceClassName, arg.value), tokens)));
            }, () => {
                return relationGate(relationEqual(method.value, 'make'), () => {
                    return relationOptionFold(relationFirst(args, () => true), () => relationSome(locateAstValue(PhpAstFactory.unsupported(tokens), tokens)), arg => relationSome(locateAstValue(PhpAstFactory.resourceSingle(resourceClassName, arg.value), tokens)));
                }, () => relationSome(locateAstValue(PhpAstFactory.staticCall(classReference, createAstIdentifier(method.value), args), tokens)));
            });
        });
    });
}

function classifyMemberAssignmentEvidence(tokens: readonly TokenDescriptor[]): AssignmentTargetEvidenceJudgment<AssignmentTargetMemberEvidence<PhpAstValue, AstIdentifier>, TokenDescriptor> {
    const operatorIndex = relationIndexOf(tokens, token => relationAny([relationEqual(token.value, '->'), relationEqual(token.value, '?->')]));
    const propertyIndex = relationAdvanceIndex(operatorIndex, 1);
    const property = tokens[propertyIndex];
    const malformedLocation: TokenEvidenceLocation<TokenDescriptor> = property === undefined
        ? Object.freeze({ kind: 'end_of_source' })
        : Object.freeze({ kind: 'token', evidence: property });
    const malformed = operatorIndex >= 0 && (operatorIndex === 0 || !property || relationNotEqual(property.type, 'IDENTIFIER'));
    if (malformed) return Object.freeze({ kind: 'malformed', location: malformedLocation, expected: 'IDENTIFIER', actual: property?.value ?? '<end-of-source>' });
    return relationOptionFold(classifyMember(tokens), () => Object.freeze({ kind: 'unresolved' as const }), value => relationVariantFold(
        value,
        'property_access',
        () => relationVariantFold(value, 'method_chain', () => Object.freeze({ kind: 'unresolved' as const }), method => Object.freeze({ kind: 'resolved' as const, evidence: Object.freeze({ receiver: method.receiver, property: method.property }) })),
        propertyAccess => Object.freeze({ kind: 'resolved' as const, evidence: Object.freeze({ receiver: propertyAccess.receiver, property: propertyAccess.property }) }),
    ));
}

function classifyStaticPropertyAssignmentEvidence(tokens: readonly TokenDescriptor[]): AssignmentTargetEvidenceJudgment<PhpAssignmentTarget, TokenDescriptor> {
    const operatorIndex = relationIndexOf(tokens, token => relationEqual(token.value, '::'));
    const propertyIndex = relationAdvanceIndex(operatorIndex, 1);
    const property = tokens[propertyIndex];
    const owner = tokens[operatorIndex - 1];
    if (operatorIndex >= 0 && (owner === undefined || property === undefined)) {
        const location: TokenEvidenceLocation<TokenDescriptor> = property === undefined
            ? Object.freeze({ kind: 'end_of_source' })
            : Object.freeze({ kind: 'token', evidence: property });
        return Object.freeze({ kind: 'malformed', location, expected: 'VARIABLE', actual: property?.value ?? '<end-of-source>' });
    }
    if (operatorIndex >= 0 && property?.type === 'VARIABLE' && tokens.length !== propertyIndex + 1) {
        const trailing = tokens[propertyIndex + 1];
        const location: TokenEvidenceLocation<TokenDescriptor> = trailing === undefined
            ? Object.freeze({ kind: 'end_of_source' })
            : Object.freeze({ kind: 'token', evidence: trailing });
        return Object.freeze({ kind: 'malformed', location, expected: '<end-of-assignment-target>', actual: trailing?.value ?? '<end-of-source>' });
    }
    return relationOptionFold(classifyStaticPropertyTarget(tokens), () => Object.freeze({ kind: 'unresolved' as const }), evidence => Object.freeze({ kind: 'resolved' as const, evidence }));
}

function classifyMember(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValue> {
    const firstOperator = relationIndexOf(tokens, token => relationAny([
        relationEqual(token.value, '->'),
        relationEqual(token.value, '?->')
    ]));
    return relationGate(firstOperator <= 0, () => {
        return relationNone();
    }, () => {
        const receiver = classifyAstTokens(relationSlice(tokens, 0, firstOperator));
        return relationGate(relationEqual(receiver.kind, 'unsupported'), () => {
            return relationNone();
        }, () => {
            return parseMemberSuffix(receiver, tokens, firstOperator);
        });
    });
}
function parseMemberSuffix(receiver: PhpAstValue, tokens: readonly TokenDescriptor[], operatorIndex: number): RelationOption<PhpAstValue> {
    const operator = tokens[operatorIndex];
    const property = tokens[relationAdvanceIndex(operatorIndex, 1)];
    return relationGate(relationAny([
        !property, relationNotEqual(property.type, 'IDENTIFIER')
    ]), () => {
        return relationNone();
    }, () => {
        const nullsafe = relationEqual(operator.value, '?->');
        return relationGate(relationEqual(tokenValueOr(tokens, relationAdvanceIndex(operatorIndex, 2)), '('), () => {
            const open = relationAdvanceIndex(operatorIndex, 2);
            const close = matchingClose(tokens, open);
            const args = parseArguments(relationSlice(tokens, relationAdvanceIndex(open, 1), close));
            const current = locateAstValue(PhpAstFactory.methodChain(toPropertyPath(receiver, property.value), receiver, createAstIdentifier(property.value), args, relationGate(nullsafe, () => ({ kind: 'nullsafe' as const }), () => ({ kind: 'direct' as const }))), relationSlice(tokens, 0, relationAdvanceIndex(close, 1)));
            return parseNextMember(current, tokens, relationAdvanceIndex(close, 1));
        }, () => {
            const current = locateAstValue(PhpAstFactory.propertyAccess(toPropertyPath(receiver, property.value), receiver, createAstIdentifier(property.value), relationGate(nullsafe, () => ({ kind: 'nullsafe' as const }), () => ({ kind: 'direct' as const }))), relationSlice(tokens, 0, relationAdvanceIndex(operatorIndex, 2)));
            return parseNextMember(current, tokens, relationAdvanceIndex(operatorIndex, 2));
        });
    });
}
function parseNextMember(receiver: PhpAstValue, tokens: readonly TokenDescriptor[], start: number): RelationOption<PhpAstValue> {
    return relationGate(start >= relationCount(tokens), () => {
        return relationSome(receiver);
    }, () => {
        const operator = tokens[start];
        return relationGate(relationAll([relationNotEqual(operator.value, '->'), relationNotEqual(operator.value, '?->')]), () => {
            return relationNone();
        }, () => {
            return parseMemberSuffix(receiver, tokens, start);
        });
    });
}
function toPropertyPath(receiver: PhpAstValue, property: string): PhpPropertyPath {
    return relationVariantFold(receiver, 'variable_reference', () =>
        relationVariantFold(receiver, 'property_access', () =>
            relationVariantFold(receiver, 'method_chain', () => PhpAstFactory.propertyPath(createAstIdentifier(property), []), value => PhpAstFactory.propertyPath(value.target.root, [...value.target.steps, value.property])),
            value => PhpAstFactory.propertyPath(value.target.root, [...value.target.steps, value.property]),
        ),
        value => PhpAstFactory.propertyPath(value.name, []),
    );
}
function classifyClosure(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValue> {
    return relationGate(relationNotEqual(tokenValueOr(tokens, 0), 'function'), () => {
        return relationNone();
    }, () => {
        const open = indexOf(tokens, '(', 1);
        return relationGate(open < 0, () => {
            return relationNone();
        }, () => {
            const close = matchingClose(tokens, open);
            const useIndex = relationIndexOf(tokens, (token, index) => relationAll([relationGate(index > close, () => true, () => false), relationEqual(token.value, 'use')]));
            const bodyOpen = indexOf(tokens, '{', relationGate(useIndex >= 0, () => useIndex, () => relationAdvanceIndex(close, 1)));
            const params = parseParameters(relationSlice(tokens, relationAdvanceIndex(open, 1), close));
            const captures = relationGate(useIndex >= 0, () => parseCaptures(tokens, useIndex), () => []);
            return relationGate(bodyOpen < 0, () => {
                return relationSome(locateAstValue(PhpAstFactory.unsupported(tokens), tokens));
            }, () => {
                const bodyClose = matchingBrace(tokens, bodyOpen);
                return relationSome(locateAstValue(PhpAstFactory.closure(params, captures, { kind: 'absent' }, parseBlock(relationSlice(tokens, relationAdvanceIndex(bodyOpen, 1), bodyClose))), tokens));
            });
        });
    });
}
function classifyArrowFunction(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValue> {
    const arrow = relationIndexOf(tokens, token => relationEqual(token.type, 'ARROW'));
    return relationGate(arrow < 2, () => {
        return relationNone();
    }, () => {
        const open = relationIndexOf(tokens, (token, index) => relationAll([relationGate(index < arrow, () => true, () => false), relationEqual(token.value, '(')]));
        return relationGate(relationAny([
            open < 1, relationNotEqual(tokenValueOr(tokens, open - 1), 'fn')
        ]), () => {
            return relationNone();
        }, () => {
            const close = matchingClose(tokens, open);
            return relationGate(close >= arrow, () => {
                return relationNone();
            }, () => {
                return relationSome(locateAstValue(PhpAstFactory.arrowFunction(parseParameters(relationSlice(tokens, relationAdvanceIndex(open, 1), close)), classifyAstTokens(relationSlice(tokens, relationAdvanceIndex(arrow, 1)))), tokens));
            });
        });
    });
}
function projectCallableParameterType(evidence: CallableParameterTypeEvidence<TokenDescriptor>): PhpParameterTypeAst | { readonly kind: 'absent' } {
    switch (evidence.kind) {
        case 'absent': return { kind: 'absent' };
        case 'primitive': return { kind: 'primitive', name: evidence.name };
        case 'named': return { kind: 'named', name: createAstIdentifier(evidence.nameTokens.map(token => token.value).join('')) };
        case 'nullable': {
            const inner = evidence.inner;
            switch (inner.kind) {
                case 'primitive': return { kind: 'nullable', inner: { kind: 'primitive', name: inner.name } };
                case 'named': return { kind: 'nullable', inner: { kind: 'named', name: createAstIdentifier(inner.nameTokens.map(token => token.value).join('')) } };
            }
        }
    }
}
function parseParameters(tokens: readonly TokenDescriptor[]): readonly PhpParameter[] {
    const judgment = scannerCallableListContractAlgebra.resolveParameters({
        tokens,
        purpose: 'parameters',
        tokenValue: token => token.value,
        tokenKind: token => token.type,
        structure: scannerTokenStructureInterface,
    });
    switch (judgment.kind) {
        case 'resolved':
            return relationProject(judgment.evidence, parameter => ({
                variable: createAstIdentifier(relationTextSlice(parameter.variable.value, 1)),
                type: projectCallableParameterType(parameter.typeEvidence),
                defaultValue: parameter.defaultTokens === undefined
                    ? { kind: 'absent' as const }
                    : { kind: 'present' as const, value: classifyAstTokens(parameter.defaultTokens) },
                passing: parameter.byReference ? { kind: 'by_reference' as const } : { kind: 'by_value' as const },
                variadic: parameter.variadic ? { kind: 'variadic' as const } : { kind: 'fixed' as const },
            }));
        case 'malformed':
            throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'malformed_callable_parameter_list', judgment }));
        case 'contract_violation':
            throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'callable_parameter_contract_violation', judgment }));
    }
}
function parseCaptures(tokens: readonly TokenDescriptor[], useIndex: number): readonly PhpClosureCapture[] {
    const open = indexOf(tokens, '(', useIndex + 1);
    return relationGate(open < 0, () => [], () => {
        const delimiter = scannerTokenStructureInterface.matchLeadingDelimiter({
            tokens: relationSlice(tokens, open),
            tokenValue: token => token.value,
        });
        if (delimiter.kind !== 'matched' || delimiter.evidence.opening.value !== '(') {
            throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'malformed_callable_capture_delimiter', judgment: delimiter }));
        }
        const judgment = scannerCallableListContractAlgebra.resolveCaptures({
            tokens: delimiter.evidence.contents,
            purpose: 'captures',
            tokenValue: token => token.value,
            tokenKind: token => token.type,
            structure: scannerTokenStructureInterface,
        });
        switch (judgment.kind) {
            case 'resolved':
                return relationProject(judgment.evidence, capture => ({
                    kind: capture.byReference ? 'by_reference' as const : 'by_value' as const,
                    variable: createAstIdentifier(relationTextSlice(capture.token.value, 1)),
                }));
            case 'malformed':
                throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'malformed_callable_capture_list', judgment }));
            case 'contract_violation':
                throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'callable_capture_contract_violation', judgment }));
        }
    });
}
function parseBlock(tokens: readonly TokenDescriptor[]): PhpBlock {
    return Object.freeze({ kind: 'block', statements: Object.freeze(parseStatements(tokens)) });
}
type ParsedStatement = { readonly statement: PhpStatement; readonly nextIndex: number };
function parseStatements(tokens: readonly TokenDescriptor[]): PhpStatement[] {
    const resolution = scannerStatementSequenceAlgebra.parse({
        tokens,
        isIgnorable: token => relationAny([relationEqual(token.type, 'EOF'), relationEqual(token.value, ';')]),
        findBoundary: source => scannerStatementBoundaryContractAlgebra.resolve({ tokens: source, tokenValue: token => token.value }),
        resolveStructured: (source, start, end) => parseStructuredStatement(source, start, end),
        resolveSimple: statement => parseSimpleStatement(statement),
    });
    switch (resolution.kind) {
        case 'complete':
            return [...resolution.statements];
        case 'malformed':
            throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'malformed_statement_sequence', judgment: resolution }));
        case 'contract_violation':
            throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'statement_sequence_contract_violation', judgment: resolution }));
    }
}
type StructuredStatementInput = Readonly<{ tokens: readonly TokenDescriptor[]; start: number; control: ScannerStatementControlKind; end: number }>;
const structuredStatementRule = (
    id: string,
    control: ScannerStatementControlKind,
    resolve: (input: StructuredStatementInput) => RelationOption<ParsedStatement>,
): AstClassificationRule<StructuredStatementInput, ParsedStatement> => Object.freeze({
    id,
    applies: input => relationEqual(input.control, control) ? alwaysApplicable() : notApplicable(),
    resolve: input => resolveFromRelation(resolve(input)),
});
const structuredStatementRules: readonly AstClassificationRule<StructuredStatementInput, ParsedStatement>[] = Object.freeze([
    structuredStatementRule('conditional', 'conditional', input => parseConditionalStatement(input.tokens, input.start)),
    structuredStatementRule('collection-iteration', 'collection_iteration', input => parseCollectionIterationStatement(input.tokens, input.start)),
    structuredStatementRule('counted-iteration', 'counted_iteration', input => parseCountedIterationStatement(input.tokens, input.start)),
    structuredStatementRule('pretest-iteration', 'pretest_iteration', input => parsePretestIterationStatement(input.tokens, input.start)),
    structuredStatementRule('selection-dispatch', 'selection_dispatch', input => parseSelectionDispatchStatement(input.tokens, input.start)),
    structuredStatementRule('exception-guard', 'exception_guard', input => parseTryStatement(input.tokens, input.start)),
    structuredStatementRule('exception-raise', 'exception_raise', input => relationSome({
        statement: PhpAstFactory.throwStatement(classifyAstTokens(relationSlice(input.tokens, relationAdvanceIndex(input.start, 1), input.end)), input.tokens[input.start]),
        nextIndex: relationGate(input.end < relationCount(input.tokens), () => relationAdvanceIndex(input.end, 1), () => input.end),
    })),
]);
function parseStructuredStatement(tokens: readonly TokenDescriptor[], start: number, end: number): StructuredStatementJudgment<PhpStatement> {
    const judgment = scannerStatementControlContractAlgebra.resolve({
        tokens: relationSlice(tokens, start),
        tokenValue: token => token.value,
    });
    switch (judgment.kind) {
        case 'not_structured':
            return { kind: 'not_applicable' };
        case 'structured': {
            try {
                const result = astClassificationRuleAlgebra.resolveFirst(structuredStatementRules, {
                    tokens,
                    start,
                    control: judgment.control,
                    end,
                });
                switch (result.kind) {
                    case 'not_resolved':
                        return { kind: 'contract_violation', reason: 'structured_rule_unresolved' };
                    case 'contract_violation':
                        return { kind: 'contract_violation', reason: 'invalid_resolution' };
                    case 'resolved':
                        return result.value.nextIndex > start && result.value.nextIndex <= relationCount(tokens)
                            ? { kind: 'resolved', value: result.value }
                            : { kind: 'contract_violation', reason: 'invalid_resolution' };
                }
            } catch (error: unknown) {
                const diagnostic = error instanceof Error ? error.message : String(error);
                // Parser-owned malformed diagnostics cross the runtime boundary as data.
                // Unexpected exceptions remain contract violations rather than being
                // misreported as valid syntax or silently falling back to simple parsing.
                return diagnostic.startsWith('Malformed ')
                    ? { kind: 'malformed', diagnostic }
                    : { kind: 'contract_violation', reason: 'invalid_resolution' };
            }
        }
    }
}
type SimpleStatementInput = Readonly<{ part: readonly TokenDescriptor[]; first: TokenDescriptor }>;
const simpleStatementRule = (
    id: string,
    applies: (input: SimpleStatementInput) => AstRuleApplicability,
    resolve: (input: SimpleStatementInput) => RelationOption<PhpStatement>,
): AstClassificationRule<SimpleStatementInput, PhpStatement, string, AstClassificationSourceFailure> => Object.freeze({ id, applies, resolve: input => resolveFromRelation(resolve(input)) });
const simpleStatementRules: readonly AstClassificationRule<SimpleStatementInput, PhpStatement, string, AstClassificationSourceFailure>[] = Object.freeze([
    simpleStatementRule('return-void', input => relationAll([relationEqual(input.first.value, 'return'), relationEqual(relationCount(input.part), 1)]) ? alwaysApplicable() : notApplicable(), input => relationSome({ kind: 'return_void', source: input.first })),
    simpleStatementRule('return-value', input => relationAll([relationEqual(input.first.value, 'return'), relationCount(input.part) > 1]) ? alwaysApplicable() : notApplicable(), input => relationSome({ kind: 'return_with_value', expression: classifyAstTokens(relationSlice(input.part, 1)), source: input.first })),
    Object.freeze({ id: 'assignment', applies: alwaysApplicable, resolve: input => classifyAssignmentStatementJudgment(input.part) }),
    simpleStatementRule('expression', input => relationCount(input.part) > 0 ? alwaysApplicable() : notApplicable(), input => relationSome({ kind: 'expression_statement', expression: classifyAstTokens(input.part), source: input.first })),
]);
function parseSimpleStatement(part: readonly TokenDescriptor[]): PhpStatement {
    const first = relationOptionFold(tokenAt(part, 0), () => { throw Error('empty simple statement relation'); }, evidence => evidence.token);
    const judgment = astClassificationRuleAlgebra.resolveFirst(simpleStatementRules, { part, first });
    switch (judgment.kind) {
        case 'resolved':
            return judgment.value;
        case 'not_resolved':
            throw Error('Simple statement classification did not resolve.');
        case 'malformed':
        case 'rule_contract_violation':
            throw new AstSourceJudgmentFailureError(judgment.failure);
        case 'contract_violation':
            throw Error(`Simple statement classification contract violation: ${judgment.reason}`);
    }
}
function parseConditionalStatement(tokens: readonly TokenDescriptor[], start: number): RelationOption<ParsedStatement> {
    const judgment = scannerConditionalStatementContractAlgebra.resolve({
        tokens: relationSlice(tokens, start),
        tokenValue: token => token.value,
    });
    switch (judgment.kind) {
        case 'not_applicable':
            return relationNone();
        case 'malformed':
            throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'malformed_conditional_statement', judgment }));
        case 'resolved':
            return relationSome({
                statement: projectConditionalStatement(judgment.evidence),
                nextIndex: relationCount(tokens) - relationCount(judgment.evidence.remaining),
            });
    }
}
function projectConditionalStatement(evidence: ScannerConditionalStatementEvidence<TokenDescriptor>): PhpStatement {
    const alternative = (() => {
        switch (evidence.elseBranch.kind) {
            case 'none':
                return { kind: 'none' as const };
            case 'else_if':
                return {
                    kind: 'else_if' as const,
                    statement: relationVariantValue(projectConditionalStatement(evidence.elseBranch.statement), PHP_STATEMENT_KINDS.conditional),
                };
            case 'else_block':
                return { kind: 'else_block' as const, block: parseBlock(evidence.elseBranch.body) };
        }
    })();
    return PhpAstFactory.ifStatement(
        classifyAstTokens(evidence.condition),
        parseBlock(evidence.thenBody),
        alternative,
        evidence.keyword,
    );
}
function projectLoopStatement(tokens: readonly TokenDescriptor[], evidence: ScannerLoopStatementEvidence<TokenDescriptor>): ParsedStatement {
    const nextIndex = relationCount(tokens) - relationCount(evidence.remaining);
    switch (evidence.control) {
        case 'collection_iteration': {
            const target = evidence.target.kind === 'key_value'
                ? { kind: 'key_value' as const, key: createAstIdentifier(relationTextSlice(evidence.target.key.value, 1)), value: createAstIdentifier(relationTextSlice(evidence.target.value.value, 1)) }
                : { kind: 'value' as const, variable: createAstIdentifier(relationTextSlice(evidence.target.variable.value, 1)) };
            return { statement: PhpAstFactory.foreachStatement(classifyAstTokens(evidence.iterable), target, parseBlock(evidence.body), evidence.keyword), nextIndex };
        }
        case 'counted_iteration': {
            const [initialization, condition, increment] = evidence.clauses;
            return { statement: PhpAstFactory.forStatement(toForClause(initialization), toForClause(condition), toForClause(increment), parseBlock(evidence.body), evidence.keyword), nextIndex };
        }
        case 'pretest_iteration':
            return { statement: PhpAstFactory.whileStatement(classifyAstTokens(evidence.header), parseBlock(evidence.body), evidence.keyword), nextIndex };
    }
}
function parseCollectionIterationStatement(tokens: readonly TokenDescriptor[], start: number): RelationOption<ParsedStatement> {
    const judgment = scannerLoopStatementContractAlgebra.resolve({
        tokens: relationSlice(tokens, start, relationCount(tokens)),
        control: 'collection_iteration',
        tokenValue: token => token.value,
        tokenKind: token => token.type,
        structure: scannerTokenStructureInterface,
    });
    if (judgment.kind === 'malformed') throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'malformed_loop_statement', control: 'collection_iteration', judgment }));
    if (judgment.kind !== 'resolved') return relationNone();
    return relationSome(projectLoopStatement(tokens, judgment.evidence));
}
function parsePretestIterationStatement(tokens: readonly TokenDescriptor[], start: number): RelationOption<ParsedStatement> {
    const judgment = scannerLoopStatementContractAlgebra.resolve({
        tokens: relationSlice(tokens, start, relationCount(tokens)),
        control: 'pretest_iteration',
        tokenValue: token => token.value,
        tokenKind: token => token.type,
        structure: scannerTokenStructureInterface,
    });
    if (judgment.kind === 'malformed') throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'malformed_loop_statement', control: 'pretest_iteration', judgment }));
    if (judgment.kind !== 'resolved') return relationNone();
    return relationSome(projectLoopStatement(tokens, judgment.evidence));
}
function parseSelectionDispatchStatement(tokens: readonly TokenDescriptor[], start: number): RelationOption<ParsedStatement> {
    const judgment = scannerSwitchStatementContractAlgebra.resolve({
        tokens: relationSlice(tokens, start, relationCount(tokens)),
        tokenValue: token => token.value,
        structure: scannerTokenStructureInterface,
    });
    if (judgment.kind === 'malformed') throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'malformed_switch_statement', judgment }));
    if (judgment.kind !== 'resolved') return relationNone();
    const evidence = judgment.evidence;
    const cases: import('./phpAstTypes').PhpSwitchCase[] = evidence.cases.map(item => {
        const body = parseBlock(item.body);
        return item.kind === 'default'
            ? { kind: 'default', body, fallThrough: !item.hasBreak, source: item.marker }
            : { kind: 'case', labels: item.labels.map(label => classifyAstTokens(label)), body, fallThrough: !item.hasBreak, source: item.marker };
    });
    return relationSome({
        statement: PhpAstFactory.switchStatement(classifyAstTokens(evidence.subject), cases, evidence.keyword),
        nextIndex: relationCount(tokens) - relationCount(evidence.remaining),
    });
}
function parseCountedIterationStatement(tokens: readonly TokenDescriptor[], start: number): RelationOption<ParsedStatement> {
    const judgment = scannerLoopStatementContractAlgebra.resolve({
        tokens: relationSlice(tokens, start, relationCount(tokens)),
        control: 'counted_iteration',
        tokenValue: token => token.value,
        tokenKind: token => token.type,
        structure: scannerTokenStructureInterface,
    });
    if (judgment.kind === 'malformed') throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'malformed_loop_statement', control: 'counted_iteration', judgment }));
    if (judgment.kind !== 'resolved') return relationNone();
    return relationSome(projectLoopStatement(tokens, judgment.evidence));
}
function toForClause(tokens: readonly TokenDescriptor[]): import('./phpAstTypes').PhpForClause {
    const expressionClause: import('./phpAstTypes').PhpForClause = { kind: 'expression', value: classifyAstTokens(tokens) };
    return relationGate(relationEqual(relationCount(tokens), 0), (): import('./phpAstTypes').PhpForClause => ({ kind: 'empty' as const }), (): import('./phpAstTypes').PhpForClause => {
        const assignment = classifyAssignment(tokens);
        return relationOptionFold(assignment, () => expressionClause, value => {
            const assignmentOption = relationVariant(value, 'assignment');
            return relationOptionFold(assignmentOption, () => expressionClause, resolved => ({
                kind: 'assignment' as const,
                target: resolved.target,
                operator: resolved.operator,
                reference: resolved.reference,
                value: resolved.value,
                source: tokens[0],
            }));
        });
    });
}
type ParsedTryCatches = { readonly index: number; readonly catches: readonly import('./phpAstTypes').PhpCatchClause[] };
function parseTryCatches(tokens: readonly TokenDescriptor[], index: number, catches: readonly import('./phpAstTypes').PhpCatchClause[] = []): RelationOption<ParsedTryCatches> {
    return relationGate(relationEqual(tokenValueOr(tokens, index), 'catch'), () => {
        const open = indexOf(tokens, '(', relationAdvanceIndex(index, 1));
        return relationGate(open < 0, () => relationNone<ParsedTryCatches>(), () => {
            const close = matchingClose(tokens, open);
            const vars = relationSelect(relationSlice(tokens, relationAdvanceIndex(open, 1), close), token => relationAny([
                relationEqual(token.type, 'IDENTIFIER'),
                relationEqual(token.type, 'VARIABLE')
            ]));
            const exceptionType = relationFirst(vars, token => relationEqual(token.type, 'IDENTIFIER'));
            const variable = relationFirst(vars, token => relationEqual(token.type, 'VARIABLE'));
            const catchOpen = indexOf(tokens, '{', relationAdvanceIndex(close, 1));
            return relationGate(relationAny([
                relationEqual(exceptionType.kind, 'none'), relationEqual(variable.kind, 'none'),
                catchOpen < 0
            ]), () => relationNone<ParsedTryCatches>(), () => {
                const catchClose = matchingBrace(tokens, catchOpen);
                return parseTryCatches(tokens, catchClose + 1, [...catches, {
                        exceptionType: relationOptionFold(exceptionType, () => { throw Error('catch exception type witness missing'); }, value => createAstIdentifier(value.value)),
                        variable: relationOptionFold(variable, () => { throw Error('catch variable witness missing'); }, value => createAstIdentifier(relationTextSlice(value.value, 1))),
                        body: parseBlock(relationSlice(tokens, catchOpen + 1, catchClose)),
                        source: tokens[index],
                    }]);
            });
        });
    }, () => relationSome({ index, catches }));
}
function parseTryStatement(tokens: readonly TokenDescriptor[], start: number): RelationOption<ParsedStatement> {
    const bodyOpen = indexOf(tokens, '{', relationAdvanceIndex(start, 1));
    return relationGate(bodyOpen < 0, () => relationNone<ParsedStatement>(), () => {
        const bodyClose = matchingBrace(tokens, bodyOpen);
        const parsedCatches = parseTryCatches(tokens, relationAdvanceIndex(bodyClose, 1));
        return relationOptionFold(parsedCatches, () => relationNone<ParsedStatement>(), parsed => {
            const finallyIndex = parsed.index;
            return relationGate(relationEqual(tokenValueOr(tokens, finallyIndex), 'finally'), () => {
                const open = indexOf(tokens, '{', relationAdvanceIndex(finallyIndex, 1));
                return relationGate(open < 0, () => relationNone<ParsedStatement>(), () => {
                    const close = matchingBrace(tokens, open);
                    return relationSome({
                        statement: PhpAstFactory.tryStatement(parseBlock(relationSlice(tokens, relationAdvanceIndex(bodyOpen, 1), bodyClose)), parsed.catches, { kind: 'present', block: parseBlock(relationSlice(tokens, relationAdvanceIndex(open, 1), close)) }, tokens[start]),
                        nextIndex: relationAdvanceIndex(close, 1),
                    });
                });
            }, () => relationSome({
                statement: PhpAstFactory.tryStatement(parseBlock(relationSlice(tokens, relationAdvanceIndex(bodyOpen, 1), bodyClose)), parsed.catches, { kind: 'absent' }, tokens[start]),
                nextIndex: finallyIndex,
            }));
        });
    });
}
function classifyAssignmentExpression(tokens: readonly TokenDescriptor[], operatorEvidence?: readonly TokenOccurrenceEvidence<TokenDescriptor>[]): AstRuleResolution<PhpAstValueNode, AstClassificationSourceFailure> {
    const judgment = parseAssignmentParts(tokens, operatorEvidence);
    switch (judgment.kind) {
        case 'resolved': return Object.freeze({ kind: 'resolved', value: PhpAstFactory.assignmentExpression(judgment.value.target, judgment.value.operator, judgment.value.reference, judgment.value.value) });
        case 'unresolved': return Object.freeze({ kind: 'not_resolved' });
        case 'malformed': return Object.freeze({ kind: 'malformed', failure: Object.freeze({ kind: 'malformed_assignment_parts', judgment }) });
        case 'contract_violation': return Object.freeze({ kind: 'rule_contract_violation', failure: Object.freeze({ kind: 'assignment_parts_contract_violation', judgment }) });
    }
}
function parseAssignmentParts(tokens: readonly TokenDescriptor[], operatorEvidence?: readonly TokenOccurrenceEvidence<TokenDescriptor>[]): AssignmentPartsJudgment<import('./phpAstStatementTypes').PhpAssignmentTarget, PhpAstValue, import('./phpAstStatementTypes').PhpAssignmentOperator['kind'], TokenDescriptor> {
    const operators: readonly AssignmentOperatorRule<import('./phpAstStatementTypes').PhpAssignmentOperator['kind']>[] = [
        { token: PHP_SYNTAX_OPERATOR_SPELLINGS.nullCoalesceAssign, kind: 'null_coalesce' },
        { token: '<<=', kind: 'shift_left' },
        { token: '>>=', kind: 'shift_right' },
        { token: '**=', kind: 'power' },
        { token: '+=', kind: 'add' },
        { token: '-=', kind: 'subtract' },
        { token: '*=', kind: 'multiply' },
        { token: '/=', kind: 'divide' },
        { token: '%=', kind: 'modulo' },
        { token: '.=', kind: 'concatenate' },
        { token: '&=', kind: 'bitwise_and' },
        { token: '|=', kind: 'bitwise_or' },
        { token: '^=', kind: 'bitwise_xor' },
        { token: '=', kind: 'set' },
    ];
    return scannerAssignmentPartsAlgebra.resolve({
        tokens,
        operators,
        ...(operatorEvidence === undefined ? { locateOperator: (source: readonly TokenDescriptor[], target: string) => scannerTokenStructureInterface.locateTopLevel({ tokens: source, target, tokenValue: token => token.value }) } : { operatorEvidence, tokenValue: (token: TokenDescriptor) => token.value }),
        classifyTarget: source => relationOptionFold(classifyAssignmentTarget(source), () => ({ kind: 'unresolved' as const, reason: 'not_recognized' as const }), target => ({ kind: 'resolved' as const, value: target })),
        classifyValue: source => relationGate(relationCount(source) > 0, () => relationOptionFold(classifyAstTokens(source), () => ({ kind: 'unresolved' as const, reason: 'not_recognized' as const }), value => ({ kind: 'resolved' as const, value })), () => ({ kind: 'unresolved' as const, reason: 'not_recognized' as const })),
        isReferenceMarker: token => relationEqual(token?.value ?? '', '&'),
    });
}
function classifyAssignmentStatementJudgment(tokens: readonly TokenDescriptor[]): AstRuleResolution<PhpStatement, AstClassificationSourceFailure> {
    const judgment = parseAssignmentParts(tokens);
    switch (judgment.kind) {
        case 'resolved': return Object.freeze({ kind: 'resolved', value: PhpAstFactory.assignment(judgment.value.target, judgment.value.operator, judgment.value.reference, judgment.value.value, tokens[0]) });
        case 'unresolved': return Object.freeze({ kind: 'not_resolved' });
        case 'malformed': return Object.freeze({ kind: 'malformed', failure: Object.freeze({ kind: 'malformed_assignment_parts', judgment }) });
        case 'contract_violation': return Object.freeze({ kind: 'rule_contract_violation', failure: Object.freeze({ kind: 'assignment_parts_contract_violation', judgment }) });
    }
}
function classifyAssignment(tokens: readonly TokenDescriptor[]): RelationOption<PhpStatement> {
    const judgment = classifyAssignmentStatementJudgment(tokens);
    switch (judgment.kind) {
        case 'resolved': return relationSome(judgment.value);
        case 'not_resolved': return relationNone();
        case 'malformed':
        case 'rule_contract_violation': throw new AstSourceJudgmentFailureError(judgment.failure);
    }
}
function classifyAssignmentTarget(tokens: readonly TokenDescriptor[]): RelationOption<import('./phpAstTypes').PhpAssignmentTarget> {
    const resolution = scannerAssignmentTargetContractAlgebra.resolve<TokenDescriptor, PhpAstValue, AstIdentifier, PhpAssignmentTarget, PhpAssignmentDestructuringEntry, PhpAssignmentDestructuringPattern>({
        tokens,
        tokenValue: token => token?.value ?? '',
        isVariableToken: token => token?.type === 'VARIABLE',
        variableIdentifier: token => createAstIdentifier(relationTextSlice(token.value, 1)),
        locateTopLevel: (source, target) => scannerTokenStructureInterface.locateTopLevel({
            tokens: source,
            target,
            tokenValue: token => token.value,
        }),
        matchLeadingDelimiter: source => scannerTokenStructureInterface.matchLeadingDelimiter({
            tokens: source,
            tokenValue: token => token?.value ?? '',
        }),
        classifyExpression: classifyAstTokens,
        classifyArrayAccess: source => classifyArrayAccess(source),
        classifyMember: source => classifyMemberAssignmentEvidence(source),
        classifyStaticProperty: source => classifyStaticPropertyAssignmentEvidence(source),
        variableTarget: identifier => ({ kind: 'variable', name: identifier }),
        appendTarget: receiver => ({ kind: 'append', target: receiver }),
        arrayElementTarget: access => ({ kind: 'array_element', target: access.target, index: access.index }),
        propertyTarget: property => ({ kind: 'property', receiver: property.receiver, property: property.property }),
        destructuringTarget: pattern => ({ kind: 'destructuring', pattern }),
        listPattern: entries => ({ kind: 'list', entries: Object.freeze(entries) }),
        skippedEntry: () => ({ kind: 'skipped' }),
        keyedEntry: (key, target) => ({ kind: 'keyed', key, target }),
        nestedEntry: pattern => ({ kind: 'nested', pattern }),
        referenceVariableEntry: identifier => ({ kind: 'reference_variable', name: identifier }),
        variableEntry: identifier => ({ kind: 'variable', name: identifier }),
        patternOfTarget: target => relationVariantFold(target, 'destructuring', () => ({ kind: 'unresolved' as const }), destructuring => ({ kind: 'resolved' as const, evidence: destructuring.pattern })),
    });
    switch (resolution.kind) {
        case 'resolved':
            return relationSome(resolution.target);
        case 'unresolved':
            return relationNone();
        case 'malformed':
            throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'malformed_assignment_target', judgment: resolution }));
        case 'contract_violation':
            throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'assignment_target_contract_violation', judgment: resolution }));
    }
}
function classifyStaticPropertyTarget(tokens: readonly TokenDescriptor[]): RelationOption<import('./phpAstTypes').PhpAssignmentTarget> {
    return relationGate(relationNotEqual(relationCount(tokens), 3), () => {
        return relationNone();
    }, () => {
        return relationGate(relationAny([
            relationNotEqual(tokenValueOr(tokens, 1), '::'), relationNotEqual(tokenKindOr(tokens, 2, 'EOF'), 'VARIABLE')
        ]), () => {
            return relationNone();
        }, () => {
            const ownerToken = tokens[0];
            const owner = solveCandidate([
                { id: 'self', value: { kind: 'self' as const }, requirements: [requirement('owner', relationEqual(ownerToken.value, 'self'))] },
                { id: 'static', value: { kind: 'static' as const }, requirements: [requirement('owner', relationEqual(ownerToken.value, 'static'))] },
                { id: 'parent', value: { kind: 'parent' as const }, requirements: [requirement('owner', relationEqual(ownerToken.value, 'parent'))] },
                { id: 'named', value: { kind: 'named_class' as const, name: createAstIdentifier(ownerToken.value) }, requirements: [requirement('owner', relationEqual(ownerToken.type, 'IDENTIFIER'))] },
            ]);
            return relationOptionFold(owner, () => relationNone(), resolvedOwner => relationSome({ kind: 'static_property', owner: resolvedOwner, property: createAstIdentifier(relationTextSlice(tokens[2].value, 1)) }));
        });
    });
}
function parseArguments(tokens: readonly TokenDescriptor[]): readonly PhpArgument[] {
    const judgment = scannerCallableListContractAlgebra.resolveList({
        tokens,
        purpose: 'arguments',
        tokenValue: token => token.value,
        structure: scannerTokenStructureInterface,
    });
    switch (judgment.kind) {
        case 'resolved':
            return relationProject(judgment.evidence.parts, parseArgument);
        case 'not_applicable':
            return [];
        case 'malformed':
            throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'malformed_callable_argument_list', judgment }));
        case 'contract_violation':
            throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'callable_argument_list_contract_violation', judgment }));
    }
}
function parseArgument(tokens: readonly TokenDescriptor[]): PhpArgument {
    const judgment = scannerCallableListContractAlgebra.resolveArgument({
        tokens,
        tokenValue: token => token.value,
        tokenKind: token => token.type,
    });
    switch (judgment.kind) {
        case 'resolved':
            switch (judgment.evidence.kind) {
                case 'unpacked':
                    return { kind: 'unpacked', value: classifyAstTokens(judgment.evidence.valueTokens) };
                case 'named':
                    return { kind: 'named', name: createAstIdentifier(judgment.evidence.name.value), value: classifyAstTokens(judgment.evidence.valueTokens) };
                case 'positional':
                    return { kind: 'positional', value: classifyAstTokens(judgment.evidence.valueTokens) };
            }
        case 'malformed':
            throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'malformed_callable_argument', judgment }));
        case 'contract_violation':
            throw new AstSourceJudgmentFailureError(Object.freeze({ kind: 'callable_argument_contract_violation', judgment }));
    }
}
function parseMemberPath(tokens: readonly TokenDescriptor[]): PhpPropertyPath {
    const parts = relationProject(relationSelect(tokens, token => relationAny([
        relationEqual(token.type, 'VARIABLE'),
        (relationAll([relationEqual(token.type, 'IDENTIFIER'), relationNotEqual(token.value, 'this')]))
    ])), token => createAstIdentifier(relationGate(token.value.startsWith('$'), () => relationTextSlice(token.value, 1), () => token.value)));
    return relationOptionFold(
        relationFirst(parts, () => true),
        () => { throw Error('PHP member path root is missing'); },
        root => PhpAstFactory.propertyPath(root, relationSlice(parts, 1)),
    );
}
function classifyClassConstant(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValueNode> {
    return relationGate(relationAll([relationEqual(relationCount(tokens), 3), relationEqual(tokens[1].value, '::'), relationEqual(tokens[2].type, 'IDENTIFIER'), relationEqual(relationNotEqual(tokens[2].value, 'class'), true)]), () => relationGate(relationAny([
        relationEqual(tokens[0].type, 'IDENTIFIER'),
        relationEqual(tokens[0].value, 'self'),
        relationEqual(tokens[0].value, 'static'),
        relationEqual(tokens[0].value, 'parent')
    ]), () => relationSome(PhpAstFactory.classConstant(createAstIdentifier(tokens[0].value), createAstIdentifier(tokens[2].value))), () => relationNone()), () => relationNone());
}
function classifyClassReference(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValueNode> {
    return relationGate(relationAll([relationEqual(relationCount(tokens), 3), relationEqual(tokens[0].type, 'IDENTIFIER'), relationEqual(tokens[1].value, '::'), relationEqual(tokens[2].value, 'class')]), () => relationSome(PhpAstFactory.classReference(createAstIdentifier(tokens[0].value))), () => relationNone());
}
/** Runtime index projection over the canonical typed delimiter judgment. */
function matchingClose(tokens: readonly TokenDescriptor[], openIndex: number): number {
    const suffix = relationSlice(tokens, openIndex, relationCount(tokens));
    const judgment = scannerTokenStructureInterface.matchLeadingDelimiter({ tokens: suffix, tokenValue: token => token.value });
    if (judgment.kind !== 'matched' || judgment.evidence.opening.value !== '(') return relationCount(tokens);
    return openIndex + relationCount(suffix) - relationCount(judgment.evidence.suffix) - 1;
}
function matchingBrace(tokens: readonly TokenDescriptor[], openIndex: number): number {
    const suffix = relationSlice(tokens, openIndex, relationCount(tokens));
    const judgment = scannerTokenStructureInterface.matchLeadingDelimiter({ tokens: suffix, tokenValue: token => token.value });
    if (judgment.kind !== 'matched' || judgment.evidence.opening.value !== '{') return relationCount(tokens);
    return openIndex + relationCount(suffix) - relationCount(judgment.evidence.suffix) - 1;
}
function indexOf(tokens: readonly TokenDescriptor[], value: string, start: number, index = start): number {
    return relationGate(index < relationCount(tokens), () => relationGate(relationEqual(tokens[index].value, value), () => index, () => indexOf(tokens, value, start, relationAdvanceIndex(index, 1))), () => -1);
}
function lastIndexOf(tokens: readonly TokenDescriptor[], value: string, index = relationCount(tokens) - 1): number {
    return relationGate(index >= 0, () => relationGate(relationEqual(tokens[index].value, value), () => index, () => lastIndexOf(tokens, value, relationAdvanceIndex(index, -1))), () => -1);
}


