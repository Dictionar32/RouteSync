import { scannerExpressionStructurePriority, type ScannerExpressionStructureCandidateId } from '../../../types/upstream/scannerExpressionCandidateAlgebra';
import { expressionStructureJudgmentAuthority, type ExpressionStructure, type ExpressionStructureJudgment, type ExpressionStructureTerminalEvidence } from '../../../types/upstream/scannerExpressionStructure';
import { scannerExpressionFormAlgebra, type PrefixExpressionRule } from '../../../types/upstream/scannerExpressionFormAlgebra';
import { scannerTokenStructureInterface, type DelimitedTokenJudgment, type TokenEvidenceLocation } from '../../../types/upstream/scannerTokenStructureAlgebra';
import { resolvePhpExpressionRootOperator } from './phpExpressionOperatorContract';
import { tokenValueOr, tokenKindOr } from './tokenEvidence';
import type { TokenDescriptor, PhpBinaryOperator } from './PhpAst';
import { relationEqual, relationAny, relationAll, relationNotEqual } from '../../../semantic/relations/semanticRelations';
import { relationGate, relationOptionFold, relationAdvanceIndex, relationSlice, relationCount, relationSome, relationNone, type RelationOption } from '../../../semantic/relations/relationalSequence';

export type PhpExpressionDelimiterEvidence = DelimitedTokenJudgment<TokenDescriptor>;

export type PhpExpressionStructureEvidenceServices = Readonly<{
    findOuterArrayAccess: (tokens: readonly TokenDescriptor[]) => PhpExpressionDelimiterEvidence;
    matchingClose: (tokens: readonly TokenDescriptor[]) => PhpExpressionDelimiterEvidence;
}>;

const tokenLocation = (tokens: readonly TokenDescriptor[], index: number): TokenEvidenceLocation<TokenDescriptor> => {
    const evidence = tokens[index];
    return evidence === undefined ? { kind: 'end_of_source' } : { kind: 'token', evidence };
};

export function providePhpExpressionStructureJudgment(
    tokens: readonly TokenDescriptor[],
    services: PhpExpressionStructureEvidenceServices,
): ExpressionStructureJudgment<TokenDescriptor, PhpBinaryOperator | Readonly<{ readonly kind: 'null_coalesce' }>, import('./phpAstExpressionTypes').PhpUnaryOperator> {
    type BinaryOperator = PhpBinaryOperator | Readonly<{ readonly kind: 'null_coalesce' }>;
    type UnaryOperator = import('./phpAstExpressionTypes').PhpUnaryOperator;
    type Structure = ExpressionStructure<TokenDescriptor, BinaryOperator, UnaryOperator>;
    const { findOuterArrayAccess, matchingClose } = services;
    type TerminalEvidence =
        | Readonly<{ readonly kind: 'malformed_source'; readonly location: TokenEvidenceLocation<TokenDescriptor>; readonly expected?: string; readonly actual: string }>
        | Readonly<{ readonly kind: 'terminal_contract_violation'; readonly reason: 'empty_operator_token' | 'duplicate_operator_token' | 'missing_operand' }>;
    type CandidateValue = RelationOption<Structure> | TerminalEvidence;
    const structure = (value: Structure): RelationOption<Structure> => relationSome(value);
    const noStructure = (): RelationOption<Structure> => relationNone();
    const judgment = expressionStructureJudgmentAuthority.resolve<TokenDescriptor, BinaryOperator, UnaryOperator, ScannerExpressionStructureCandidateId, CandidateValue>({
        contract: { candidates: [
            { id: 'short-ternary', priority: scannerExpressionStructurePriority('short-ternary'), resolve: () => {
                const operator = scannerTokenStructureInterface.locateTopLevel({ tokens, target: '?:', tokenValue: token => token.value });
                switch (operator.kind) {
                    case 'not_found': return noStructure();
                    case 'malformed': return { kind: 'malformed_source' as const, location: operator.location, expected: operator.expected, actual: operator.actual };
                    case 'found': return structure({
                        kind: 'short_ternary',
                        condition: operator.occurrence.before,
                        fallback: operator.occurrence.after,
                    });
                }
            } },
            { id: 'ternary', priority: scannerExpressionStructurePriority('ternary'), resolve: () => {
                const conditional = scannerExpressionFormAlgebra.resolveConditional({
                    tokens,
                    tokenValue: token => token?.value ?? '',
                    collectTopLevelCandidates: (source, targets) => scannerTokenStructureInterface.locateTopLevelCandidates({
                        tokens: source,
                        targets,
                        tokenValue: token => token.value,
                    }),
                });
                switch (conditional.kind) {
                    case 'not_found': return noStructure();
                    case 'malformed': return { kind: 'malformed_source' as const, location: conditional.location, expected: conditional.expected, actual: conditional.actual };
                    case 'resolved': return structure({
                        kind: 'ternary',
                        condition: conditional.condition,
                        consequent: conditional.consequent,
                        alternative: conditional.alternative,
                    });
                }
            } },
            { id: 'array-access', priority: scannerExpressionStructurePriority('array-access'), resolve: () => {
                const evidence = findOuterArrayAccess(tokens);
                switch (evidence.kind) {
                    case 'malformed': return { kind: 'malformed_source' as const, location: evidence.location, expected: evidence.expected, actual: evidence.actual };
                    case 'not_found': return noStructure();
                    case 'matched': return relationGate(relationAny([
                        evidence.evidence.prefix.length === 0,
                        relationNotEqual(evidence.evidence.opening.value, '['),
                        relationNotEqual(evidence.evidence.closing.value, ']'),
                    ]), noStructure, () => structure({
                        kind: 'array_access',
                        base: evidence.evidence.prefix,
                        index: evidence.evidence.contents,
                    }));
                }
            } },
            { id: 'call', priority: scannerExpressionStructurePriority('call'), resolve: () => {
                const close = matchingClose(relationSlice(tokens, 1));
                if (close.kind === 'malformed') return { kind: 'malformed_source' as const, location: close.location, expected: close.expected, actual: close.actual };
                if (close.kind === 'not_found') return noStructure();
                const shape = relationAll([
                    relationEqual(tokenValueOr(tokens, 1), '('),
                    relationEqual(tokenValueOr(tokens, relationCount(tokens) - 1), ')'),
                    close.evidence.suffix.length === 0,
                ]);
                return relationGate(relationAll([shape, relationCount(tokens) >= 3]), () => relationGate(
                    relationEqual(tokenKindOr(tokens, 0, 'EOF'), 'IDENTIFIER'),
                    () => structure({
                        kind: 'call',
                        calleeKind: 'identifier',
                        callee: relationSlice(tokens, 0, 1),
                        arguments: close.evidence.contents,
                    }),
                    () => relationGate(
                        relationEqual(tokenKindOr(tokens, 0, 'EOF'), 'VARIABLE'),
                        () => structure({
                            kind: 'call',
                            calleeKind: 'callable',
                            callee: relationSlice(tokens, 0, 1),
                            arguments: close.evidence.contents,
                        }),
                        noStructure,
                    ),
                ), noStructure);
            } },
            { id: 'root-operator', priority: scannerExpressionStructurePriority('root-operator'), resolve: () => relationOptionFold(
                resolvePhpExpressionRootOperator(tokens),
                noStructure,
                value => structure({
                    kind: 'binary',
                    operator: value.operator,
                    left: value.before,
                    right: value.after,
                }),
            ) },
            { id: 'unary', priority: scannerExpressionStructurePriority('unary'), resolve: () => {
                const rules: readonly PrefixExpressionRule<UnaryOperator>[] = [
                    { token: '!', operator: { kind: 'not' } },
                    { token: '-', operator: { kind: 'negative' } },
                    { token: '+', operator: { kind: 'positive' } },
                    { token: '~', operator: { kind: 'bitwise_not' } },
                ];
                const prefix = scannerExpressionFormAlgebra.resolvePrefix({ tokens, rules, tokenValue: token => token?.value ?? '' });
                switch (prefix.kind) {
                    case 'not_found': return noStructure();
                    case 'malformed': return { kind: 'malformed_source' as const, location: tokenLocation(tokens, prefix.index), expected: prefix.expected, actual: prefix.actual };
                    case 'contract_violation': return { kind: 'terminal_contract_violation' as const, reason: prefix.reason };
                    case 'resolved': return structure({ kind: 'unary', operator: prefix.operator, operand: relationSlice(tokens, relationAdvanceIndex(prefix.index, 1)) });
                }
            } },
        ] as const,
        isResolved: (value: CandidateValue) => relationEqual(value.kind, 'some'),
        isTerminal: (value: CandidateValue) => relationAny([relationEqual(value.kind, 'malformed_source'), relationEqual(value.kind, 'terminal_contract_violation')]),
        },
        sourceEvidence: tokens,
        selectStructure: (value: CandidateValue) => value.kind === 'some' ? value.value : undefined,
        selectTerminal: (value: CandidateValue): ExpressionStructureTerminalEvidence<TokenDescriptor> | undefined => {
            if (value.kind === 'malformed_source') {
                return { kind: 'malformed_source', location: value.location, expected: value.expected, actual: value.actual };
            }
            if (value.kind === 'terminal_contract_violation') {
                return { kind: 'contract_violation', reason: value.reason };
            }
            return undefined;
        },
    });
    return judgment;
}

