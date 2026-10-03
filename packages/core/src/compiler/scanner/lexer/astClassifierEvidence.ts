import { relationNotEqual } from '../../../semantic/kernel/semanticRelations';
import { PHP_STATEMENT_KINDS } from './phpAstStatementKinds';
/** Converts tokenized PHP expressions into structured Laravel scanner AST. */
import { PhpAstFactory } from './PhpAst';
import type { AstIdentifier, PhpArgument, PhpAstValue, PhpAstValueNode, PhpPropertyPath, TokenDescriptor, PhpBlock, PhpParameter, PhpClosureCapture, PhpStatement, PhpAccessMode, PhpBinaryOperator } from './PhpAst';
import { createAstIdentifier, createSourceOffset } from './phpAstTypes';
import { tokenizePhpSource } from './tokenizer';
import { parsePhpMethodOrThrow } from './phpMethodParser';
import { relationEqual, relationAny, relationAll } from '../../../semantic/kernel/semanticRelations';
import { relationGate, relationFirst, relationSelect, relationProject, relationFold, relationIndexOf, relationLastIndexOf, relationEvery, relationMapValueOr, relationOptionFold, relationAdvanceIndex, relationLookup, relationSlice, relationTextSlice, relationSome, relationNone, relationIsNone, relationIsPresent, RELATION_NONE, type RelationOption, type RelationNone, type RelationMaybe } from '../../../semantic/kernel/relationalSequence';
import { solveCandidate, solveOptionalCandidate, requirement, type OptionalSemanticCandidate } from '../../../semantic/kernel/requirementSolver';
import { phpControlEvidence, type PhpControlEvidence } from './phpControlEvidence';
export function classifyPhpBlock(tokens: readonly TokenDescriptor[]): PhpBlock {
    return parseBlock(tokens);
}
export function classifyAstValue(raw: string): PhpAstValue {
    const tokens = relationSelect(tokenizePhpSource(raw), token => relationNotEqual(token.type, 'EOF'));
    return classifyAstTokens(tokens);
}
interface AstClassificationRule {
    readonly id: string;
    readonly resolve: (tokens: readonly TokenDescriptor[]) => RelationOption<PhpAstValueNode>;
}
const resolveClassification = (resolve: (tokens: readonly TokenDescriptor[]) => PhpAstValueNode | RelationNone): ((tokens: readonly TokenDescriptor[]) => RelationOption<PhpAstValueNode>) => tokens => {
    const value = resolve(tokens);
    return relationGate(relationIsNone(value), () => relationNone(), () => relationSome(value));
};
const astClassificationRules: readonly AstClassificationRule[] = Object.freeze([
    { id: 'match', resolve: classifyMatch },
    { id: 'closure', resolve: resolveClassification(classifyClosure) },
    { id: 'arrow', resolve: resolveClassification(classifyArrowFunction) },
    { id: 'instanceof', resolve: classifyInstanceOf },
    { id: 'cast', resolve: classifyCast },
    { id: 'parenthesized', resolve: classifyParenthesized },
    { id: 'assignment', resolve: classifyAssignmentExpression },
    { id: 'single', resolve: tokens => relationGate(relationEqual(tokens.length, 1), () => relationSome(classifySingle(tokens[0] as TokenDescriptor)), () => relationNone()) },
    { id: 'compound', resolve: classifyCompoundExpression },
    { id: 'inline-array', resolve: tokens => relationGate(relationAll([relationEqual(tokens[0]?.value, '['), relationEqual(tokens[tokens.length - 1]?.value, ']')]), () => relationSome(classifyInlineArray(tokens)), () => relationNone()) },
    { id: 'class-constant', resolve: classifyClassConstant },
    { id: 'class-reference', resolve: classifyClassReference },
    { id: 'new', resolve: classifyNewExpression },
    { id: 'static-call', resolve: resolveClassification(classifyStaticCall) },
    { id: 'member', resolve: resolveClassification(classifyMember) },
    { id: 'ternary', resolve: resolveClassification(classifyTernary) },
]);
export function classifyAstTokens(tokens: readonly TokenDescriptor[]): PhpAstValue {
    const candidates = relationProject(astClassificationRules, rule => ({ rule, result: rule.resolve(tokens) }));
    const candidate = relationFirst(candidates, item => relationOptionFold(item.result, () => false, () => true));
    return relationOptionFold(candidate, () => locateAstValue(PhpAstFactory.unsupported(tokens), tokens), item => relationOptionFold(item.result, () => locateAstValue(PhpAstFactory.unsupported(tokens), tokens), value => locateAstValue(value, tokens)));
}
function classifyNewExpression(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValueNode> {
    return relationGate(relationEqual(tokens[0]?.value, 'new'), () => {
        const anonymous = relationGate(relationEqual(tokens[1]?.value, 'class'), () => classifyAnonymousClass(tokens), () => relationNone());
        return relationOptionFold(anonymous, () => {
            return relationGate(relationEqual(tokens[1]?.value, 'class'), () => relationNone(), () => {
            const open = indexOf(tokens, '(', 2);
            const close = lastIndexOf(tokens, ')');
            const hasArguments = relationAll([open >= 0, close > open]);
            const classTokens = relationGate(hasArguments, () => relationSlice(tokens, 1, open), () => relationSlice(tokens, 1));
            const args = relationGate(hasArguments, () => parseArguments(relationSlice(tokens, relationAdvanceIndex(open, 1), close)), () => []);
            return relationGate(relationAll([relationEqual(classTokens[0]?.type, 'IDENTIFIER'), relationEqual(classTokens.length, 1)]), () => relationSome(PhpAstFactory.construct(createAstIdentifier(classTokens[0].value), args)), () => relationGate(classTokens.length > 0, () => relationSome(PhpAstFactory.dynamicConstruct(classifyAstTokens(classTokens), args)), () => relationNone()));
        });
        }, () => relationNone());
    }, () => relationNone());
}
function classifyAnonymousClass(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValueNode> {
    const open = indexOf(tokens, '{', 2);
    return relationGate(relationAny([
        open < 0, relationNotEqual(tokens[tokens.length - 1]?.value, '}')
    ]), () => relationNone(), () => {
        const close = matchingClose(tokens, open);
        return relationGate(relationNotEqual(close, tokens.length - 1), () => relationNone(), () => {
            const extendsIndex = relationIndexOf(tokens, (token, index) => relationAll([index >= 2, index < open, relationEqual(token.value, 'extends')]));
            const extendsToken = relationOptionFold(relationLookup(relationProject(tokens, (token, index) => [index, token] as const), relationAdvanceIndex(extendsIndex, 1)), () => relationNone<TokenDescriptor>(), token => relationSome(token));
            const validExtends = relationAny([
                extendsIndex < 0, relationOptionFold(extendsToken, () => false, token => relationEqual(token.type, 'IDENTIFIER'))
            ]);
            return relationGate(validExtends, () => {
                const extendsClass = relationGate(extendsIndex < 0, () => ({ kind: 'absent' as const }), () => relationOptionFold(extendsToken, () => ({ kind: 'absent' as const }), token => ({ kind: 'present' as const, value: createAstIdentifier(token.value) })));
                const body = relationSlice(tokens, relationAdvanceIndex(open, 1), close);
                const state = relationFold(body, { depth: 0, members: [] as import('./phpAstExpressionTypes').PhpAnonymousClassMember[] }, (current, token, index) => {
                    return relationGate(relationEqual(token.value, '{'), () => ({ ...current, depth: current.depth + 1 }), () => relationGate(relationEqual(token.value, '}'), () => ({ ...current, depth: current.depth - 1 }), () => relationGate(relationAll([relationEqual(current.depth, 0), relationEqual(token.value, 'function')]), () => {
                        const method = parsePhpMethodOrThrow('', body, index);
                        return { ...current, members: [...current.members, { kind: 'method', value: method }] };
                    }, () => current)));
                });
                return relationSome(PhpAstFactory.anonymousClassConstruct({ kind: 'anonymous_class', extendsClass, members: Object.freeze(state.members) }, []));
            }, () => relationNone());
        });
    });
}

function locateAstValue(value: PhpAstValueNode, tokens: readonly TokenDescriptor[]): PhpAstValue {
    const first = tokens[0];
    const last = tokens[tokens.length - 1];
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
function classifyInlineArray(tokens: readonly TokenDescriptor[]): PhpAstValue {
    const parts = splitTopLevel(relationSlice(tokens, 1, relationAdvanceIndex(tokens.length, -1)), ',');
    const state = relationFold(parts, { valid: true, entries: [] as import('./phpAstTypes').PhpArrayEntry[] }, (current, part) => relationGate(relationAny([
        !current.valid,
        relationEqual(part.length, 0)
    ]), () => current, () => {
        const unpacked = relationEqual(part[0]?.type, 'ELLIPSIS');
        return relationGate(unpacked, () => ({
            valid: true,
            entries: [...current.entries, { kind: 'unpacked', value: classifyAstTokens(relationSlice(part, 1)), source: { startOffset: createSourceOffset(part[0].startOffset), endOffset: createSourceOffset(part[part.length - 1].endOffset) } }],
        }), () => {
            const arrow = findTopLevelOperator(part, '=>');
            return relationGate(arrow > 0, () => {
                const keyTokens = relationSlice(part, 0, arrow);
                const valueTokens = relationSlice(part, relationAdvanceIndex(arrow, 1));
                const key = relationFirst(keyTokens, item => relationAny([
                    relationEqual(item.type, 'STRING'),
                    relationEqual(item.type, 'IDENTIFIER'),
                    relationEqual(item.type, 'NUMBER')
                ]));
                return relationGate(relationAll([relationEqual(key.kind, 'some'), valueTokens.length > 0]), () => ({
                    valid: true,
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
                            source: { startOffset: createSourceOffset(part[0].startOffset), endOffset: createSourceOffset(part[part.length - 1].endOffset) },
                        }],
                }), () => ({ valid: false, entries: current.entries }));
            }, () => ({ valid: true, entries: [...current.entries, { kind: 'positional', value: classifyAstTokens(part), source: { startOffset: createSourceOffset(part[0].startOffset), endOffset: createSourceOffset(part[part.length - 1].endOffset) } }] }));
        });
    }));
    return relationGate(state.valid, () => PhpAstFactory.nestedArray(state.entries), () => PhpAstFactory.unsupported(tokens));
}
function classifyMatch(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValueNode> {
    return relationGate(relationEqual(tokens[0]?.value, 'match'), () => {
        const openParen = indexOf(tokens, '(', 1);
        return relationGate(openParen < 0, () => relationNone(), () => {
            const closeParen = matchingClose(tokens, openParen);
            const openBrace = indexOf(tokens, '{', relationAdvanceIndex(closeParen, 1));
            return relationGate(relationAny([
                openBrace < 0, relationNotEqual(tokens[tokens.length - 1]?.value, '}')
            ]), () => relationNone(), () => {
                const subject = classifyAstTokens(relationSlice(tokens, openParen + 1, closeParen));
                const arms = parseMatchArms(relationSlice(tokens, openBrace + 1, -1));
                return relationSome(PhpAstFactory.matchExpression(subject, arms));
            });
        });
    }, () => relationNone());
}
function parseMatchArms(tokens: readonly TokenDescriptor[]): readonly import('./phpAstTypes').PhpMatchArm[] {
    const parts = relationSelect(splitTopLevel(tokens, ','), part => part.length > 0);
    return Object.freeze(relationProject(parts, part => {
        const arrow = findTopLevelOperator(part, '=>');
        return relationGate(arrow < 0, () => PhpAstFactory.matchConditional([], PhpAstFactory.unsupported(part)), () => {
            const left = relationSlice(part, 0, arrow);
            const value = classifyAstTokens(relationSlice(part, relationAdvanceIndex(arrow, 1)));
            return relationGate(relationAll([relationEqual(left.length, 1), relationEqual(left[0].value, 'default')]), () => PhpAstFactory.matchDefault(value), () => PhpAstFactory.matchConditional(relationProject(splitTopLevel(left, ','), classifyAstTokens), value));
        });
    }));
}
function splitTopLevel(tokens: readonly TokenDescriptor[], separator: string): readonly (readonly TokenDescriptor[])[] {
    const step = (index: number, start: number, depth: number, parts: readonly (readonly TokenDescriptor[])[]): readonly (readonly TokenDescriptor[])[] => relationGate(index <= tokens.length, () => {
        const token = tokens[index];
        const nextDepth = relationGate(relationAny([
            relationEqual(token?.value, '('),
            relationEqual(token?.value, '['),
            relationEqual(token?.value, '{')
        ]), () => depth + 1, () => relationGate(relationAny([
            relationEqual(token?.value, ')'),
            relationEqual(token?.value, ']'),
            relationEqual(token?.value, '}')
        ]), () => depth - 1, () => depth));
        return relationGate(relationAny([
            relationEqual(index, tokens.length),
            relationAll([relationEqual(depth, 0), relationEqual(token?.value, separator)])
        ]), () => step(relationAdvanceIndex(index, 1), relationAdvanceIndex(index, 1), nextDepth, [...parts, relationSlice(tokens, start, index)]), () => step(relationAdvanceIndex(index, 1), start, nextDepth, parts));
    }, () => parts);
    return Object.freeze(step(0, 0, 0, []));
}
function classifyParenthesized(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValue> {
    return relationGate(relationAny([
        relationNotEqual(tokens[0]?.value, '('), relationNotEqual(tokens[tokens.length - 1]?.value, ')')
    ]), () => relationNone(), () => relationGate(
        relationEqual(matchingClose(tokens, 0), tokens.length - 1),
        () => relationSome(classifyAstTokens(relationSlice(tokens, 1, relationAdvanceIndex(tokens.length, -1)))),
        () => relationNone(),
    ));
}
function classifyCast(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValue> {
    const type = tokens[1]?.value;
    const shape = relationAll([relationEqual(tokens[0]?.value, '('), relationEqual(tokens[2]?.value, ')'), relationEqual(tokens[1]?.type, 'IDENTIFIER')]);
    const candidates = [
        { id: 'int', value: PhpAstFactory.castExpression({ kind: 'int' }, classifyAstTokens(relationSlice(tokens, 3))), requirements: [requirement('cast-shape', shape), requirement('cast-type', relationEqual(type, 'int'))] },
        { id: 'float', value: PhpAstFactory.castExpression({ kind: 'float' }, classifyAstTokens(relationSlice(tokens, 3))), requirements: [requirement('cast-shape', shape), requirement('cast-type', relationEqual(type, 'float'))] },
        { id: 'string', value: PhpAstFactory.castExpression({ kind: 'string' }, classifyAstTokens(relationSlice(tokens, 3))), requirements: [requirement('cast-shape', shape), requirement('cast-type', relationEqual(type, 'string'))] },
        { id: 'bool', value: PhpAstFactory.castExpression({ kind: 'bool' }, classifyAstTokens(relationSlice(tokens, 3))), requirements: [requirement('cast-shape', shape), requirement('cast-type', relationEqual(type, 'bool'))] },
        { id: 'array', value: PhpAstFactory.castExpression({ kind: 'array' }, classifyAstTokens(relationSlice(tokens, 3))), requirements: [requirement('cast-shape', shape), requirement('cast-type', relationEqual(type, 'array'))] },
        { id: 'object', value: PhpAstFactory.castExpression({ kind: 'object' }, classifyAstTokens(relationSlice(tokens, 3))), requirements: [requirement('cast-shape', shape), requirement('cast-type', relationEqual(type, 'object'))] },
    ];
    return solveCandidate(candidates);
}
function classifyCompoundExpression(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValue> {
    const coalesce = findTopLevelOperator(tokens, '??');
    const short = findTopLevelOperator(tokens, '?:');
    const ternary = classifyTernary(tokens);
    const access = classifyArrayAccess(tokens);
    const call = classifyFunctionCall(tokens);
    const binary = findBinaryOperator(tokens);
    const unary = classifyUnary(tokens);
    const candidates: readonly OptionalSemanticCandidate<PhpAstValue>[] = [
        { id: 'coalesce', value: relationGate(coalesce >= 0, () => relationSome(PhpAstFactory.nullCoalesce(classifyAstTokens(relationSlice(tokens, 0, coalesce)), classifyAstTokens(relationSlice(tokens, relationAdvanceIndex(coalesce, 1))))), () => relationNone()), requirements: [requirement('operator', coalesce >= 0)] },
        { id: 'short-ternary', value: relationGate(short >= 0, () => relationSome(PhpAstFactory.shortTernary(classifyAstTokens(relationSlice(tokens, 0, short)), classifyAstTokens(relationSlice(tokens, relationAdvanceIndex(short, 1))))), () => relationNone()), requirements: [requirement('operator', short >= 0)] },
        { id: 'ternary', value: ternary, requirements: [requirement('resolved', relationEqual(ternary.kind, 'some'))] },
        { id: 'array-access', value: access, requirements: [requirement('resolved', relationEqual(access.kind, 'some'))] },
        { id: 'call', value: call, requirements: [requirement('resolved', relationEqual(call.kind, 'some'))] },
        {
            id: 'binary',
            value: relationOptionFold(
                binary,
                () => relationNone(),
                value => relationSome(PhpAstFactory.binaryExpression(
                    value.operator,
                    classifyAstTokens(relationSlice(tokens, 0, value.index)),
                    classifyAstTokens(relationSlice(tokens, relationAdvanceIndex(value.index, 1))),
                )),
            ),
            requirements: [requirement('resolved', relationEqual(binary.kind, 'some'))],
        },
        { id: 'unary', value: unary, requirements: [requirement('resolved', relationEqual(unary.kind, 'some'))] },
    ];
    return solveOptionalCandidate(candidates);
}
function classifyInstanceOf(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValue> {
    const index = findTopLevelOperator(tokens, 'instanceof');
    return relationGate(relationAny([index <= 0, index >= tokens.length - 1]), () => relationNone(), () => {
        const classToken = tokens[relationAdvanceIndex(index, 1)];
        return relationGate(relationAny([!classToken, relationNotEqual(classToken?.type, 'IDENTIFIER')]), () => relationNone(), () => relationSome(PhpAstFactory.instanceOf(classifyAstTokens(relationSlice(tokens, 0, index)), createAstIdentifier(classToken.value))));
    });
}
function classifyArrayAccess(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValue> {
    const open = findOuterArrayAccess(tokens);
    return relationGate(relationAny([open <= 0, relationNotEqual(tokens[tokens.length - 1]?.value, ']')]), () => relationNone(), () => relationSome(PhpAstFactory.arrayAccess(classifyAstTokens(relationSlice(tokens, 0, open)), classifyAstTokens(relationSlice(tokens, relationAdvanceIndex(open, 1), relationAdvanceIndex(tokens.length, -1))))));
}
function findOuterArrayAccess(tokens: readonly TokenDescriptor[], index = tokens.length - 1, depth = 0): number {
    return relationGate(index >= 0, () => {
        const value = tokens[index].value;
        const nextDepth = relationGate(relationEqual(value, ']'), () => depth + 1, () => relationGate(relationEqual(value, '['), () => depth - 1, () => depth));
        return relationGate(relationAll([relationEqual(value, '['), relationEqual(nextDepth, 0)]), () => index, () => findOuterArrayAccess(tokens, relationAdvanceIndex(index, -1), nextDepth));
    }, () => -1);
}
function classifyFunctionCall(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValue> {
    const shape = relationAll([relationEqual(tokens[1]?.value, '('), relationEqual(tokens[tokens.length - 1]?.value, ')'), relationEqual(matchingClose(tokens, 1), tokens.length - 1)]);
    const args = parseArguments(relationSlice(tokens, 2, relationAdvanceIndex(tokens.length, -1)));
    return solveCandidate([
        { id: 'function', value: PhpAstFactory.functionCall(createAstIdentifier(relationGate(tokens.length > 0, () => tokens[0].value, () => '')), args), requirements: [requirement('call-shape', shape), requirement('identifier', relationEqual(tokens[0]?.type, 'IDENTIFIER'))] },
        { id: 'callable', value: PhpAstFactory.callableCall(classifyAstTokens(relationSlice(tokens, 0, 1)), args), requirements: [requirement('call-shape', shape), requirement('variable', relationEqual(tokens[0]?.type, 'VARIABLE'))] },
    ]);
}
function classifyUnary(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValue> {
    const operator = tokens[0]?.value;
    return solveCandidate([
        { id: 'not', value: PhpAstFactory.unaryExpression({ kind: 'not' }, classifyAstTokens(relationSlice(tokens, 1))), requirements: [requirement('operator', relationEqual(operator, '!'))] },
        { id: 'negative', value: PhpAstFactory.unaryExpression({ kind: 'negative' }, classifyAstTokens(relationSlice(tokens, 1))), requirements: [requirement('operator', relationEqual(operator, '-'))] },
        { id: 'positive', value: PhpAstFactory.unaryExpression({ kind: 'positive' }, classifyAstTokens(relationSlice(tokens, 1))), requirements: [requirement('operator', relationEqual(operator, '+'))] },
        { id: 'bitwise-not', value: PhpAstFactory.unaryExpression({ kind: 'bitwise_not' }, classifyAstTokens(relationSlice(tokens, 1))), requirements: [requirement('operator', relationEqual(operator, '~'))] },
    ]);
}
function findTopLevelOperator(tokens: readonly TokenDescriptor[], value: string, index = 0, depth = 0): number {
    return relationGate(index < tokens.length, () => {
        const token = tokens[index];
        const nextDepth = relationGate(relationAny([
            relationEqual(token.value, '('),
            relationEqual(token.value, '['),
            relationEqual(token.value, '{')
        ]), () => depth + 1, () => relationGate(relationAny([
            relationEqual(token.value, ')'),
            relationEqual(token.value, ']'),
            relationEqual(token.value, '}')
        ]), () => depth - 1, () => depth));
        return relationGate(relationAll([relationEqual(depth, 0), relationEqual(token.value, value)]), () => index, () => findTopLevelOperator(tokens, value, relationAdvanceIndex(index, 1), nextDepth));
    }, () => -1);
}
function findBinaryOperator(tokens: readonly TokenDescriptor[]): import('../../../semantic/kernel/relationalSequence').RelationOption<{ readonly operator: PhpBinaryOperator; readonly index: number }> {
    const operators: readonly {
        readonly token: string;
        readonly operator: PhpBinaryOperator;
    }[] = [
        { token: '===', operator: { kind: 'identical' } }, { token: '!==', operator: { kind: 'not_identical' } },
        { token: '>=', operator: { kind: 'greater_or_equal' } }, { token: '<=', operator: { kind: 'less_or_equal' } },
        { token: '==', operator: { kind: 'equal' } }, { token: '!=', operator: { kind: 'not_equal' } },
        { token: '>', operator: { kind: 'greater_than' } }, { token: '<', operator: { kind: 'less_than' } },
        { token: '+', operator: { kind: 'addition' } }, { token: '-', operator: { kind: 'subtraction' } },
        { token: '*', operator: { kind: 'multiplication' } }, { token: '/', operator: { kind: 'division' } },
        { token: '%', operator: { kind: 'modulo' } }, { token: '&&', operator: { kind: 'logical_and' } },
        { token: '||', operator: { kind: 'logical_or' } }, { token: '.', operator: { kind: 'concat' } }
    ];
    return relationOptionFold(
        relationFirst(operators, entry => findTopLevelOperator(tokens, entry.token) > 0),
        () => ({ kind: 'none' as const }),
        candidate => ({ kind: 'some' as const, value: { operator: candidate.operator, index: findTopLevelOperator(tokens, candidate.token) } }),
    );
}

function classifyInterpolatedString(raw: string): RelationOption<PhpAstValueNode> {
    const pattern = /\$[A-Za-z_][A-Za-z0-9_]*(?:->\$?[A-Za-z_][A-Za-z0-9_]*)?|\{\$[A-Za-z_][A-Za-z0-9_]*(?:->\$?[A-Za-z_][A-Za-z0-9_]*)?\}/g;
    const matches = [...raw.matchAll(pattern)];
    const state = relationFold(matches, { cursor: 0, parts: [] as import('./phpAstExpressionTypes').PhpInterpolatedStringPart[] }, (current, match) => {
        const index = relationGate(relationEqual(typeof match.index, 'number'), () => match.index!, () => 0);
        const fragment = match[0];
        const expressionSource = relationGate(fragment.startsWith('{'), () => relationTextSlice(fragment, 1, relationAdvanceIndex(fragment.length, -1)), () => fragment);
        const prefix = relationGate(index > current.cursor, () => [{ kind: 'text' as const, value: relationTextSlice(raw, current.cursor, index) }], () => []);
        return { cursor: relationAdvanceIndex(index, fragment.length), parts: [...current.parts, ...prefix, { kind: 'expression', value: classifyAstValue(expressionSource) }] };
    });
    return relationGate(relationEqual(state.cursor, 0), () => relationNone(), () => relationSome(PhpAstFactory.interpolatedString([...state.parts, ...relationGate(state.cursor < raw.length, () => [{ kind: 'text' as const, value: relationTextSlice(raw, state.cursor) }], () => [])])));
}
const singleTokenCatalog: readonly (readonly [TokenDescriptor['type'], (token: TokenDescriptor) => PhpAstValueNode])[] = Object.freeze([
    ['STRING', (token) => relationOptionFold(classifyInterpolatedString(token.value), () => PhpAstFactory.stringLiteral(token.value), value => value)],
    ['NUMBER', (token) => PhpAstFactory.numberLiteral(token.value)],
    ['TRUE', () => PhpAstFactory.booleanLiteral(true)],
    ['FALSE', () => PhpAstFactory.booleanLiteral(false)],
    ['NULL', () => PhpAstFactory.nullLiteral()],
    ['VARIABLE', (token) => PhpAstFactory.variableReference(createAstIdentifier(relationTextSlice(token.value, 1)))],
    ['IDENTIFIER', (token) => relationGate(relationEqual(token.value, '__DIR__'), () => PhpAstFactory.magicConstant({ kind: 'dir' }), () => relationGate(relationEqual(token.value, '__FILE__'), () => PhpAstFactory.magicConstant({ kind: 'file' }), () => relationGate(/^[A-Z][A-Z0-9_]*$/.test(token.value), () => PhpAstFactory.constantReference(createAstIdentifier(token.value)), () => PhpAstFactory.unsupported([token]))))],
]);
function classifySingle(token: TokenDescriptor): PhpAstValueNode {
    return relationOptionFold(
        relationLookup(singleTokenCatalog, token.type),
        () => PhpAstFactory.unsupported([token]),
        resolve => resolve(token),
    );
}
function classifyStaticCall(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValue> {
    return relationGate(relationAny([
        tokens.length < 4, relationNotEqual(tokens[0].type, 'IDENTIFIER'),
        relationNotEqual(tokens[1].value, '::')
    ]), () => {
        return relationNone();
    }, () => {
        const method = tokens[2];
        return relationGate(relationAny([
            !method, relationNotEqual(method.type, 'IDENTIFIER'),
            relationNotEqual(tokens[3]?.value, '(')
        ]), () => {
            return relationNone();
        }, () => {
            const close = matchingClose(tokens, 3);
            const args = relationGate(close > 3, () => parseArguments(relationSlice(tokens, 4, close)), () => []);
            return relationGate(relationEqual(method.value, 'collection'), () => {
                return relationOptionFold(relationFirst(args, () => true), () => relationSome(PhpAstFactory.unsupported(tokens)), arg => relationSome(PhpAstFactory.resourceCollection(createAstIdentifier(tokens[0].value), arg.value)));
            }, () => {
                return relationGate(relationEqual(method.value, 'make'), () => {
                    return relationOptionFold(relationFirst(args, () => true), () => relationSome(PhpAstFactory.unsupported(tokens)), arg => relationSome(PhpAstFactory.resourceSingle(createAstIdentifier(tokens[0].value), arg.value)));
                }, () => {
                    return relationSome(PhpAstFactory.staticCall(createAstIdentifier(tokens[0].value), createAstIdentifier(method.value), args));
                });
            });
        });
    });
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
        return relationGate(relationEqual(tokens[relationAdvanceIndex(operatorIndex, 2)]?.value, '('), () => {
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
    return relationGate(start >= tokens.length, () => {
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
    return relationGate(relationEqual(receiver.kind, 'variable_reference'), () => {
        return PhpAstFactory.propertyPath(receiver.name, []);
    }, () => {
        return relationGate(relationAny([
            relationEqual(receiver.kind, 'property_access'),
            relationEqual(receiver.kind, 'method_chain')
        ]), () => {
            return PhpAstFactory.propertyPath(receiver.target.root, [...receiver.target.steps, receiver.property]);
        }, () => {
            return PhpAstFactory.propertyPath(createAstIdentifier(property), []);
        });
    });
}
function classifyClosure(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValue> {
    return relationGate(relationNotEqual(tokens[0]?.value, 'function'), () => {
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
                return relationSome(PhpAstFactory.unsupported(tokens));
            }, () => {
                const bodyClose = matchingBrace(tokens, bodyOpen);
                return relationSome(PhpAstFactory.closure(params, captures, parseBlock(relationSlice(tokens, relationAdvanceIndex(bodyOpen, 1), bodyClose))));
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
            open < 1, relationNotEqual(tokens[open - 1]?.value, 'fn')
        ]), () => {
            return relationNone();
        }, () => {
            const close = matchingClose(tokens, open);
            return relationGate(close >= arrow, () => {
                return relationNone();
            }, () => {
                return relationSome(PhpAstFactory.arrowFunction(parseParameters(relationSlice(tokens, relationAdvanceIndex(open, 1), close)), classifyAstTokens(relationSlice(tokens, relationAdvanceIndex(arrow, 1)))));
            });
        });
    });
}
function parseParameters(tokens: readonly TokenDescriptor[]): readonly PhpParameter[] {
    return relationProject(relationSelect(tokens, token => relationEqual(token.type, 'VARIABLE')), token => ({ variable: createAstIdentifier(relationTextSlice(token.value, 1)) }));
}
function parseCaptures(tokens: readonly TokenDescriptor[], useIndex: number): readonly PhpClosureCapture[] {
    const open = indexOf(tokens, '(', useIndex + 1);
    return relationGate(open < 0, () => [], () => {
        const close = matchingClose(tokens, open);
        const state = relationFold(relationSlice(tokens, relationAdvanceIndex(open, 1), close), { byReference: false, result: [] as PhpClosureCapture[] }, (current, token) => relationGate(relationEqual(token.value, '&'), () => ({ ...current, byReference: true }), () => relationGate(relationEqual(token.type, 'VARIABLE'), () => ({
            byReference: false,
            result: [...current.result, {
                    kind: relationGate(current.byReference, () => 'by_reference' as const, () => 'by_value' as const),
                    variable: createAstIdentifier(relationTextSlice(token.value, 1)),
                }],
        }), () => current)));
        return state.result;
    });
}
function parseBlock(tokens: readonly TokenDescriptor[]): PhpBlock {
    return Object.freeze({ kind: 'block', statements: Object.freeze(parseStatements(tokens)) });
}
function parseStatements(tokens: readonly TokenDescriptor[], index = 0, result: readonly PhpStatement[] = []): PhpStatement[] {
    return relationGate(index < tokens.length, () => {
        const token = tokens[index];
        return relationGate(relationAny([
            relationEqual(token.type, 'EOF'),
            relationEqual(token.value, ';')
        ]), () => parseStatements(tokens, relationAdvanceIndex(index, 1), result), () => {
            const parsed = parseStructuredStatement(tokens, index);
            return relationGate(relationIsPresent(parsed), () => parseStatements(tokens, parsed.nextIndex, [...result, parsed.statement]), () => {
                const end = findStatementEnd(tokens, index);
                const part = relationSlice(tokens, index, end);
                const next = relationGate(end < tokens.length, () => relationAdvanceIndex(end, 1), () => end);
                return relationGate(part.length > 0, () => parseStatements(tokens, next, [...result, parseSimpleStatement(part)]), () => parseStatements(tokens, next, result));
            });
        });
    }, () => [...result]);
}
function parseStructuredStatement(tokens: readonly TokenDescriptor[], start: number): {
    readonly statement: PhpStatement;
    readonly nextIndex: number;
} | RelationNone {
    const control = phpControlEvidence(tokens[start]!);
    const end = findStatementEnd(tokens, start);
    const nextIndex = relationGate(end < tokens.length, () => relationAdvanceIndex(end, 1), () => end);
    const parsed = (kind: PhpControlEvidence): {
        readonly statement: PhpStatement;
        readonly nextIndex: number;
    } | RelationNone => {
        const admissible = relationOptionFold(control, () => false, value => relationEqual(value, kind));
        const selected = solveCandidate<() => {
            readonly statement: PhpStatement;
            readonly nextIndex: number;
        }>([
            { id: 'conditional', value: () => parseConditionalStatement(tokens, start) as {
                    readonly statement: PhpStatement;
                    readonly nextIndex: number;
                }, requirements: [requirement('control', admissible)] },
            { id: 'collection-iteration', value: () => parseCollectionIterationStatement(tokens, start) as {
                    readonly statement: PhpStatement;
                    readonly nextIndex: number;
                }, requirements: [requirement('control', admissible)] },
            { id: 'counted-iteration', value: () => parseCountedIterationStatement(tokens, start) as {
                    readonly statement: PhpStatement;
                    readonly nextIndex: number;
                }, requirements: [requirement('control', admissible)] },
            { id: 'pretest-iteration', value: () => parsePretestIterationStatement(tokens, start) as {
                    readonly statement: PhpStatement;
                    readonly nextIndex: number;
                }, requirements: [requirement('control', admissible)] },
            { id: 'selection-dispatch', value: () => parseSelectionDispatchStatement(tokens, start) as {
                    readonly statement: PhpStatement;
                    readonly nextIndex: number;
                }, requirements: [requirement('control', admissible)] },
            { id: 'exception-guard', value: () => parseTryStatement(tokens, start) as {
                    readonly statement: PhpStatement;
                    readonly nextIndex: number;
                }, requirements: [requirement('control', admissible)] },
            { id: 'exception-raise', value: () => ({ statement: PhpAstFactory.throwStatement(classifyAstTokens(relationSlice(tokens, relationAdvanceIndex(start, 1), end)), tokens[start]), nextIndex }), requirements: [requirement('control', admissible)] },
        ]);
        return relationOptionFold(selected, () => RELATION_NONE, evaluate => evaluate());
    };
    return relationOptionFold(control, () => RELATION_NONE, value => parsed(value));
}
function parseSimpleStatement(part: readonly TokenDescriptor[]): PhpStatement {
    const first = part[0];
    const assignment = classifyAssignment(part);
    return solveOptionalCandidate([
        { id: 'return-void', value: relationSome({ kind: 'return_void', source: first! }), requirements: [requirement('return', relationEqual(first?.value, 'return')), requirement('empty-return', relationEqual(part.length, 1))] },
        { id: 'return-value', value: relationSome({ kind: 'return_with_value', expression: classifyAstTokens(relationSlice(part, 1)), source: first! }), requirements: [requirement('return', relationEqual(first?.value, 'return')), requirement('return-value-present', part.length > 1)] },
        { id: 'assignment', value: assignment, requirements: [requirement('assignment', relationEqual(assignment.kind, 'some'))] },
        { id: 'expression', value: relationSome({ kind: 'expression_statement', expression: classifyAstTokens(part), source: first! }), requirements: [requirement('expression', relationEqual(part.length > 0, true))] },
    ]) as PhpStatement;
}
function findStatementEnd(tokens: readonly TokenDescriptor[], start: number, index = start, paren = 0, bracket = 0, brace = 0): number {
    return relationGate(index < tokens.length, () => {
        const value = tokens[index].value;
        const nextParen = relationGate(relationEqual(value, '('), () => paren + 1, () => relationGate(relationEqual(value, ')'), () => paren - 1, () => paren));
        const nextBracket = relationGate(relationEqual(value, '['), () => bracket + 1, () => relationGate(relationEqual(value, ']'), () => bracket - 1, () => bracket));
        const nextBrace = relationGate(relationEqual(value, '{'), () => brace + 1, () => relationGate(relationEqual(value, '}'), () => brace - 1, () => brace));
        return relationGate(relationAll([relationEqual(value, ';'), relationEqual(paren, 0), relationEqual(bracket, 0), relationEqual(brace, 0)]), () => index, () => findStatementEnd(tokens, start, relationAdvanceIndex(index, 1), nextParen, nextBracket, nextBrace));
    }, () => tokens.length);
}
function parseConditionalStatement(tokens: readonly TokenDescriptor[], start: number): {
    readonly statement: PhpStatement;
    readonly nextIndex: number;
} | RelationNone {
    const open = indexOf(tokens, '(', relationAdvanceIndex(start, 1));
    return relationGate(open < 0, () => {
        return RELATION_NONE;
    }, () => {
        const close = matchingClose(tokens, open);
        const bodyOpen = indexOf(tokens, '{', relationAdvanceIndex(close, 1));
        return relationGate(bodyOpen < 0, () => {
            return RELATION_NONE;
        }, () => {
            const bodyClose = matchingBrace(tokens, bodyOpen);
            return relationGate(bodyClose >= tokens.length, () => {
                return RELATION_NONE;
            }, () => {
                const condition = classifyAstTokens(relationSlice(tokens, relationAdvanceIndex(open, 1), close));
                const thenBlock = parseBlock(relationSlice(tokens, relationAdvanceIndex(bodyOpen, 1), bodyClose));
                let next = relationAdvanceIndex(bodyClose, 1);
                return relationGate(relationNotEqual(tokens[next]?.value, 'else'), () => {
                    return { statement: PhpAstFactory.ifStatement(condition, thenBlock, { kind: 'none' }, tokens[start]), nextIndex: next };
                }, () => {
                    return relationGate(relationEqual(tokens[relationAdvanceIndex(next, 1)]?.value, 'if'), () => {
                        const nested = parseConditionalStatement(tokens, relationAdvanceIndex(next, 1));
                        return relationGate(nested, () => {
                            return { statement: PhpAstFactory.ifStatement(condition, thenBlock, { kind: 'else_if', statement: nested.statement as Extract<PhpStatement, {
                                        kind: PHP_STATEMENT_KINDS.conditional;
                                    }> }, tokens[start]), nextIndex: nested.nextIndex };
                        }, () => RELATION_NONE);
                    }, () => {
                        const elseOpen = relationGate(relationEqual(tokens[relationAdvanceIndex(next, 1)]?.value, '{'), () => relationAdvanceIndex(next, 1), () => -1);
                        return relationGate(elseOpen < 0, () => {
                            return RELATION_NONE;
                        }, () => {
                            const elseClose = matchingBrace(tokens, elseOpen);
                            return { statement: PhpAstFactory.ifStatement(condition, thenBlock, { kind: 'else_block', block: parseBlock(relationSlice(tokens, elseOpen + 1, elseClose)) }, tokens[start]), nextIndex: relationAdvanceIndex(elseClose, 1) };
                        });
                    });
                });
            });
        });
    });
}
function parseCollectionIterationStatement(tokens: readonly TokenDescriptor[], start: number): {
    readonly statement: PhpStatement;
    readonly nextIndex: number;
} | RelationNone {
    const open = indexOf(tokens, '(', relationAdvanceIndex(start, 1));
    return relationGate(open < 0, () => {
        return RELATION_NONE;
    }, () => {
        const close = matchingClose(tokens, open);
        const asIndex = findTopLevelOperator(relationSlice(tokens, relationAdvanceIndex(open, 1), close), 'as');
        return relationGate(asIndex < 0, () => {
            return RELATION_NONE;
        }, () => {
            const inner = relationSlice(tokens, relationAdvanceIndex(open, 1), close);
            const iterable = classifyAstTokens(relationSlice(inner, 0, asIndex));
            const targetTokens = relationSlice(inner, asIndex + 1);
            const arrow = relationIndexOf(targetTokens, token => relationEqual(token.type, 'ARROW'));
            const variableTokens = relationGate(arrow >= 0, () => relationSlice(targetTokens, relationAdvanceIndex(arrow, 1)), () => targetTokens);
            const variables = relationSelect(variableTokens, token => relationEqual(token.type, 'VARIABLE'));
            return relationGate(relationEqual(variables.length, 0), () => {
                return RELATION_NONE;
            }, () => {
                const target = relationGate(
                    relationAll([arrow >= 0, variables.length >= 2]),
                    () => ({ kind: 'key_value' as const, key: createAstIdentifier(relationTextSlice(variables[0].value, 1)), value: createAstIdentifier(relationTextSlice(variables[1].value, 1)) }),
                    () => ({ kind: 'value' as const, variable: createAstIdentifier(relationTextSlice(variables[0].value, 1)) }),
                );
                const bodyOpen = indexOf(tokens, '{', relationAdvanceIndex(close, 1));
                return relationGate(bodyOpen < 0, () => {
                    return RELATION_NONE;
                }, () => {
                    const bodyClose = matchingBrace(tokens, bodyOpen);
                    return { statement: PhpAstFactory.foreachStatement(iterable, target, parseBlock(relationSlice(tokens, relationAdvanceIndex(bodyOpen, 1), bodyClose)), tokens[start]), nextIndex: relationAdvanceIndex(bodyClose, 1) };
                });
            });
        });
    });
}
function parsePretestIterationStatement(tokens: readonly TokenDescriptor[], start: number): {
    readonly statement: PhpStatement;
    readonly nextIndex: number;
} | RelationNone {
    const open = indexOf(tokens, '(', relationAdvanceIndex(start, 1));
    return relationGate(open < 0, () => {
        return RELATION_NONE;
    }, () => {
        const close = matchingClose(tokens, open);
        const bodyOpen = indexOf(tokens, '{', relationAdvanceIndex(close, 1));
        return relationGate(bodyOpen < 0, () => {
            return RELATION_NONE;
        }, () => {
            const bodyClose = matchingBrace(tokens, bodyOpen);
            return relationGate(bodyClose >= tokens.length, () => {
                return RELATION_NONE;
            }, () => {
                return {
                    statement: PhpAstFactory.whileStatement(classifyAstTokens(relationSlice(tokens, relationAdvanceIndex(open, 1), close)), parseBlock(relationSlice(tokens, relationAdvanceIndex(bodyOpen, 1), bodyClose)), tokens[start]),
                    nextIndex: relationAdvanceIndex(bodyClose, 1),
                };
            });
        });
    });
}
function parseSwitchCases(inner: readonly TokenDescriptor[], tokens: readonly TokenDescriptor[], start: number, cursor = 0, activeKind: 'case' | 'default' | RelationNone = RELATION_NONE, activeLabels: readonly import('./phpAstTypes').PhpAstValue[] = [], activeStart = 0, cases: readonly import('./phpAstTypes').PhpSwitchCase[] = []): RelationMaybe<readonly import('./phpAstTypes').PhpSwitchCase[]> {
    const flush = (end: number, currentCases: readonly import('./phpAstTypes').PhpSwitchCase[]) => relationGate(relationIsNone(activeKind), () => currentCases, () => {
        const bodyTokens = relationSlice(inner, activeStart, end);
        const body = parseBlock(bodyTokens);
        const hasBreak = bodyTokens.some(token => relationEqual(token.value, 'break'));
        const source = relationGate(relationAll([activeStart >= 0, activeStart < inner.length]), () => inner[activeStart], () => tokens[start]);
        const nextCase = relationGate(relationEqual(activeKind, 'default'), () => ({ kind: 'default' as const, body, fallThrough: !hasBreak, source }), () => ({ kind: 'case' as const, labels: Object.freeze([...activeLabels]), body, fallThrough: !hasBreak, source }));
        return [...currentCases, nextCase];
    });
    return relationGate(cursor < inner.length, () => {
        const value = inner[cursor]?.value;
        return relationGate(relationAny([
            relationEqual(value, 'case'),
            relationEqual(value, 'default')
        ]), () => {
            const flushed = flush(cursor, cases);
            const nextKind = relationGate(relationEqual(value, 'default'), () => 'default' as const, () => 'case' as const);
            return relationGate(relationEqual(nextKind, 'default'), () => parseSwitchCases(inner, tokens, start, cursor + 1, nextKind, [], cursor + 1, flushed), () => {
                const colon = relationIndexOf(inner, token => relationEqual(token.value, ':'), cursor + 1);
                return relationGate(colon < 0, () => RELATION_NONE, () => parseSwitchCases(inner, tokens, start, relationAdvanceIndex(colon, 1), nextKind, [classifyAstTokens(relationSlice(inner, cursor + 1, colon))], relationAdvanceIndex(colon, 1), flushed));
            });
        }, () => parseSwitchCases(inner, tokens, start, cursor + 1, activeKind, activeLabels, activeStart, cases));
    }, () => flush(inner.length, cases));
}
function parseSelectionDispatchStatement(tokens: readonly TokenDescriptor[], start: number): {
    readonly statement: PhpStatement;
    readonly nextIndex: number;
} | RelationNone {
    const open = indexOf(tokens, '(', relationAdvanceIndex(start, 1));
    return relationGate(open < 0, () => RELATION_NONE, () => {
        const close = matchingClose(tokens, open);
        const bodyOpen = indexOf(tokens, '{', relationAdvanceIndex(close, 1));
        return relationGate(bodyOpen < 0, () => RELATION_NONE, () => {
            const bodyClose = matchingBrace(tokens, bodyOpen);
            return relationGate(bodyClose >= tokens.length, () => RELATION_NONE, () => {
                const cases = parseSwitchCases(relationSlice(tokens, relationAdvanceIndex(bodyOpen, 1), bodyClose), tokens, start);
                return relationGate(relationIsNone(cases), () => RELATION_NONE, () => ({
                    statement: PhpAstFactory.switchStatement(classifyAstTokens(relationSlice(tokens, relationAdvanceIndex(open, 1), close)), cases, tokens[start]),
                    nextIndex: relationAdvanceIndex(bodyClose, 1),
                }));
            });
        });
    });
}
function parseCountedIterationStatement(tokens: readonly TokenDescriptor[], start: number): {
    readonly statement: PhpStatement;
    readonly nextIndex: number;
} | RelationNone {
    const open = indexOf(tokens, '(', relationAdvanceIndex(start, 1));
    return relationGate(open < 0, () => {
        return RELATION_NONE;
    }, () => {
        const close = matchingClose(tokens, open);
        const clauses = splitTopLevel(relationSlice(tokens, relationAdvanceIndex(open, 1), close), ';');
        return relationGate(relationNotEqual(clauses.length, 3), () => {
            return RELATION_NONE;
        }, () => {
            const bodyOpen = indexOf(tokens, '{', relationAdvanceIndex(close, 1));
            return relationGate(bodyOpen < 0, () => {
                return RELATION_NONE;
            }, () => {
                const bodyClose = matchingBrace(tokens, bodyOpen);
                return { statement: PhpAstFactory.forStatement(toForClause(clauses[0]), toForClause(clauses[1]), toForClause(clauses[2]), parseBlock(relationSlice(tokens, relationAdvanceIndex(bodyOpen, 1), bodyClose)), tokens[start]), nextIndex: relationAdvanceIndex(bodyClose, 1) };
            });
        });
    });
}
function toForClause(tokens: readonly TokenDescriptor[]): import('./phpAstTypes').PhpForClause {
    return relationGate(relationEqual(tokens.length, 0), () => {
        return { kind: 'empty' };
    }, () => {
        const assignment = classifyAssignment(tokens);
        return relationOptionFold(assignment, () => ({ kind: 'expression', value: classifyAstTokens(tokens) }), value => ({ kind: 'assignment', target: value.target, operator: value.operator, reference: value.reference, value: value.value, source: { startOffset: tokens[0].startOffset, endOffset: tokens[tokens.length - 1].endOffset } }));
    });
}
function parseTryCatches(tokens: readonly TokenDescriptor[], index: number, catches: readonly import('./phpAstTypes').PhpCatchClause[] = []): {
    readonly index: number;
    readonly catches: readonly import('./phpAstTypes').PhpCatchClause[];
} | RelationNone {
    return relationGate(relationEqual(tokens[index]?.value, 'catch'), () => {
        const open = indexOf(tokens, '(', relationAdvanceIndex(index, 1));
        return relationGate(open < 0, () => RELATION_NONE, () => {
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
            ]), () => RELATION_NONE, () => {
                const catchClose = matchingBrace(tokens, catchOpen);
                return parseTryCatches(tokens, catchClose + 1, [...catches, {
                        exceptionType: relationOptionFold(exceptionType, () => { throw Error('catch exception type witness missing'); }, value => createAstIdentifier(value.value)),
                        variable: relationOptionFold(variable, () => { throw Error('catch variable witness missing'); }, value => createAstIdentifier(relationTextSlice(value.value, 1))),
                        body: parseBlock(relationSlice(tokens, catchOpen + 1, catchClose)),
                        source: tokens[index],
                    }]);
            });
        });
    }, () => ({ index, catches }));
}
function parseTryStatement(tokens: readonly TokenDescriptor[], start: number): {
    readonly statement: PhpStatement;
    readonly nextIndex: number;
} | RelationNone {
    const bodyOpen = indexOf(tokens, '{', relationAdvanceIndex(start, 1));
    return relationGate(bodyOpen < 0, () => RELATION_NONE, () => {
        const bodyClose = matchingBrace(tokens, bodyOpen);
        const parsedCatches = parseTryCatches(tokens, relationAdvanceIndex(bodyClose, 1));
        return relationGate(relationIsNone(parsedCatches), () => RELATION_NONE, () => {
            const finallyIndex = parsedCatches!.index;
            return relationGate(relationEqual(tokens[finallyIndex]?.value, 'finally'), () => {
                const open = indexOf(tokens, '{', relationAdvanceIndex(finallyIndex, 1));
                return relationGate(open < 0, () => RELATION_NONE, () => {
                    const close = matchingBrace(tokens, open);
                    return {
                        statement: PhpAstFactory.tryStatement(parseBlock(relationSlice(tokens, relationAdvanceIndex(bodyOpen, 1), bodyClose)), parsedCatches!.catches, { kind: 'present', block: parseBlock(relationSlice(tokens, relationAdvanceIndex(open, 1), close)) }, tokens[start]),
                        nextIndex: relationAdvanceIndex(close, 1),
                    };
                });
            }, () => ({
                statement: PhpAstFactory.tryStatement(parseBlock(relationSlice(tokens, relationAdvanceIndex(bodyOpen, 1), bodyClose)), parsedCatches!.catches, { kind: 'absent' }, tokens[start]),
                nextIndex: finallyIndex,
            }));
        });
    });
}
function classifyAssignmentExpression(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValueNode> {
    return relationOptionFold(parseAssignmentParts(tokens), () => relationNone(), parsed =>
        relationSome(PhpAstFactory.assignmentExpression(parsed.target, parsed.operator, parsed.reference, parsed.value)),
    );
}
function parseAssignmentParts(tokens: readonly TokenDescriptor[]): RelationOption<{
    readonly target: import('./phpAstStatementTypes').PhpAssignmentTarget;
    readonly operator: import('./phpAstStatementTypes').PhpAssignmentOperator;
    readonly reference: import('./phpAstStatementTypes').PhpAssignmentReference;
    readonly value: PhpAstValue;
}> {
    const operators: readonly {
        readonly token: string;
        readonly kind: import('./phpAstStatementTypes').PhpAssignmentOperator['kind'];
    }[] = [
        { token: '??=', kind: 'null_coalesce' },
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
    const candidate = relationFirst(operators, operator => {
        const index = findTopLevelOperator(tokens, operator.token);
        const target = relationGate(relationAll([index > 0, index < tokens.length - 1]), () => classifyAssignmentTarget(relationSlice(tokens, 0, index)), () => relationNone());
        const rawValue = relationGate(index > 0, () => relationSlice(tokens, relationAdvanceIndex(index, 1)), () => []);
        const valueTokens = relationGate(relationEqual(rawValue[0]?.value, '&'), () => relationSlice(rawValue, 1), () => rawValue);
        return relationAll([relationEqual(target.kind, 'some'), valueTokens.length > 0]);
    });
    return relationOptionFold(candidate, () => relationNone(), selected => {
        const index = findTopLevelOperator(tokens, selected.token);
        const target = classifyAssignmentTarget(relationSlice(tokens, 0, index));
        return relationOptionFold(target, () => relationNone(), resolvedTarget => {
            const rawValue = relationSlice(tokens, relationAdvanceIndex(index, 1));
            const reference = relationGate(relationEqual(rawValue[0]?.value, '&'), () => ({ kind: 'by_reference' as const }), () => ({ kind: 'by_value' as const }));
            const valueTokens = relationGate(relationEqual(reference.kind, 'by_reference'), () => relationSlice(rawValue, 1), () => rawValue);
            return relationSome({ target: resolvedTarget, operator: { kind: selected.kind }, reference, value: classifyAstTokens(valueTokens) });
        });
    });
}
function classifyAssignment(tokens: readonly TokenDescriptor[]): RelationOption<PhpStatement> {
    return relationOptionFold(parseAssignmentParts(tokens), () => relationNone(), parsed =>
        relationSome(PhpAstFactory.assignment(parsed.target, parsed.operator, parsed.reference, parsed.value, tokens[0])),
    );
}
function classifyAssignmentTarget(tokens: readonly TokenDescriptor[]): RelationOption<import('./phpAstTypes').PhpAssignmentTarget> {
    return relationGate(relationAll([relationEqual(tokens[0]?.value, '['), relationEqual(tokens[tokens.length - 1]?.value, ']')]), () =>
        classifyDestructuringTarget(tokens),
        () => relationGate(relationAll([relationEqual(tokens[tokens.length - 1]?.value, ']'), relationEqual(tokens[tokens.length - 2]?.value, '[')]), () => {
            const receiverTokens = relationSlice(tokens, 0, -2);
            return relationGate(relationEqual(receiverTokens.length, 0), () => relationNone(), () => relationSome({ kind: 'append', target: classifyAstTokens(receiverTokens) }));
        }, () => {
            const access = classifyArrayAccess(tokens);
            return relationGate(relationEqual(access?.kind, 'array_access'), () => relationSome({ kind: 'array_element', target: access.target, index: access.index }), () => {
                const member = classifyMember(tokens);
                return relationGate(relationEqual(member?.kind, 'property_access'), () => relationSome({ kind: 'property', receiver: member.receiver, property: member.property }), () =>
                    classifyStaticPropertyTarget(tokens),
                );
            });
        }),
    );
}
function classifyDestructuringTarget(tokens: readonly TokenDescriptor[]): RelationOption<import('./phpAstTypes').PhpAssignmentTarget> {
    return relationGate(tokens.length < 2, () => {
        return relationNone();
    }, () => {
        const entries = relationProject(splitTopLevel(relationSlice(tokens, 1, relationAdvanceIndex(tokens.length, -1)), ','), classifyDestructuringEntry);
        return relationGate(relationEqual(entries.length, 0), () => relationNone(), () => relationSome({ kind: 'destructuring', pattern: { kind: 'list', entries: Object.freeze(entries) } }));
    });
}
function classifyDestructuringEntry(tokens: readonly TokenDescriptor[]): import('./phpAstStatementTypes').PhpAssignmentDestructuringEntry {
    return relationGate(relationEqual(tokens.length, 0), () => {
        return { kind: 'skipped' };
    }, () => {
        const arrow = findTopLevelOperator(tokens, '=>');
        return relationGate(arrow > 0, () => {
            return { kind: 'keyed', key: classifyAstTokens(relationSlice(tokens, 0, arrow)), target: classifyDestructuringEntry(relationSlice(tokens, relationAdvanceIndex(arrow, 1))) };
        }, () => {
            return relationGate(relationAll([relationEqual(tokens[0]?.value, '['), relationEqual(tokens[tokens.length - 1]?.value, ']')]), () => {
                const nested = classifyDestructuringTarget(tokens);
                return relationGate(relationAny([
                    !nested, relationNotEqual(nested.kind, 'destructuring')
                ]), () => ({ kind: 'skipped' }), () => ({ kind: 'nested', pattern: nested.pattern }));
            }, () => {
                return relationGate(relationAll([relationEqual(tokens[0]?.value, '&'), relationEqual(tokens[1]?.type, 'VARIABLE'), relationEqual(tokens.length, 2)]), () => {
                    return { kind: 'reference_variable', name: createAstIdentifier(relationTextSlice(tokens[1].value, 1)) };
                }, () => {
                    return relationGate(relationAll([relationEqual(tokens.length, 1), relationEqual(tokens[0]?.type, 'VARIABLE')]), () => {
                        return { kind: 'variable', name: createAstIdentifier(relationTextSlice(tokens[0].value, 1)) };
                    }, () => {
                        return { kind: 'skipped' };
                    });
                });
            });
        });
    });
}
function classifyStaticPropertyTarget(tokens: readonly TokenDescriptor[]): RelationOption<import('./phpAstTypes').PhpAssignmentTarget> {
    return relationGate(relationNotEqual(tokens.length, 3), () => {
        return relationNone();
    }, () => {
        return relationGate(relationAny([
            relationNotEqual(tokens[1]?.value, '::'), relationNotEqual(tokens[2]?.type, 'VARIABLE')
        ]), () => {
            return relationNone();
        }, () => {
            const ownerToken = tokens[0];
            const owner = solveCandidate([
                { id: 'self', value: { kind: 'self' }, requirements: [requirement('owner', relationEqual(ownerToken?.value, 'self'))] },
                { id: 'static', value: { kind: 'static' }, requirements: [requirement('owner', relationEqual(ownerToken?.value, 'static'))] },
                { id: 'parent', value: { kind: 'parent' }, requirements: [requirement('owner', relationEqual(ownerToken?.value, 'parent'))] },
                { id: 'named', value: { kind: 'named_class', name: createAstIdentifier(relationAny([
                            ownerToken?.value, ''
                        ])) }, requirements: [requirement('owner', relationEqual(ownerToken?.type, 'IDENTIFIER'))] },
            ]);
            return relationOptionFold(owner, () => relationNone(), resolvedOwner => relationSome({ kind: 'static_property', owner: resolvedOwner, property: createAstIdentifier(relationTextSlice(tokens[2].value, 1)) }));
        });
    });
}
function parseArguments(tokens: readonly TokenDescriptor[], index = 0, start = 0, depth = 0, result: readonly PhpArgument[] = []): readonly PhpArgument[] {
    return relationGate(index <= tokens.length, () => {
        const token = tokens[index];
        const nextDepth = relationGate(relationAll([Boolean(token), relationAny([
            relationEqual(token.value, '('),
            relationEqual(token.value, '['),
            relationEqual(token.value, '{')
        ])]), () => depth + 1, () => relationGate(relationAll([Boolean(token), relationAny([
            relationEqual(token.value, ')'),
            relationEqual(token.value, ']'),
            relationEqual(token.value, '}')
        ])]), () => depth - 1, () => depth));
        const split = relationAny([
            relationEqual(index, tokens.length),
            (relationAll([relationEqual(token?.value, ','), relationEqual(depth, 0)]))
        ]);
        return relationGate(split, () => {
            const part = relationSlice(tokens, start, index);
            return parseArguments(tokens, relationAdvanceIndex(index, 1), relationAdvanceIndex(index, 1), nextDepth, relationGate(part.length > 0, () => [...result, parseArgument(part)], () => result));
        }, () => parseArguments(tokens, relationAdvanceIndex(index, 1), start, nextDepth, result));
    }, () => Object.freeze(result));
}
function parseArgument(tokens: readonly TokenDescriptor[]): PhpArgument {
    return relationGate(relationEqual(tokens[0]?.type, 'ELLIPSIS'), () => {
        return { kind: 'unpacked', value: classifyAstTokens(relationSlice(tokens, 1)) };
    }, () => {
        const colon = relationIndexOf(tokens, token => relationEqual(token.type, 'COLON'));
        return relationGate(relationAll([colon > 0, relationEqual(tokens[0].type, 'IDENTIFIER')]), () => {
            return { kind: 'named', name: createAstIdentifier(tokens[0].value), value: classifyAstTokens(relationSlice(tokens, relationAdvanceIndex(colon, 1))) };
        }, () => {
            return { kind: 'positional', value: classifyAstTokens(tokens) };
        });
    });
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
    return relationGate(relationAll([relationEqual(tokens.length, 3), relationEqual(tokens[1].value, '::'), relationEqual(tokens[2].type, 'IDENTIFIER'), relationEqual(relationNotEqual(tokens[2].value, 'class'), true)]), () => relationGate(relationAny([
        relationEqual(tokens[0].type, 'IDENTIFIER'),
        relationEqual(tokens[0].value, 'self'),
        relationEqual(tokens[0].value, 'static'),
        relationEqual(tokens[0].value, 'parent')
    ]), () => relationSome(PhpAstFactory.classConstant(createAstIdentifier(tokens[0].value), createAstIdentifier(tokens[2].value))), () => relationNone()), () => relationNone());
}
function classifyClassReference(tokens: readonly TokenDescriptor[]): RelationOption<PhpAstValueNode> {
    return relationGate(relationAll([relationEqual(tokens.length, 3), relationEqual(tokens[0].type, 'IDENTIFIER'), relationEqual(tokens[1].value, '::'), relationEqual(tokens[2].value, 'class')]), () => relationSome(PhpAstFactory.classReference(createAstIdentifier(tokens[0].value))), () => relationNone());
}
function matchingClose(tokens: readonly TokenDescriptor[], openIndex: number, index = openIndex, depth = 0): number {
    return relationGate(index < tokens.length, () => {
        const value = tokens[index].value;
        const nextDepth = relationGate(relationEqual(value, '('), () => depth + 1, () => relationGate(relationEqual(value, ')'), () => depth - 1, () => depth));
        return relationGate(relationAll([relationEqual(value, ')'), relationEqual(nextDepth, 0)]), () => index, () => matchingClose(tokens, openIndex, relationAdvanceIndex(index, 1), nextDepth));
    }, () => tokens.length);
}
function matchingBrace(tokens: readonly TokenDescriptor[], openIndex: number, index = openIndex, depth = 0): number {
    return relationGate(index < tokens.length, () => {
        const value = tokens[index].value;
        const nextDepth = relationGate(relationEqual(value, '{'), () => depth + 1, () => relationGate(relationEqual(value, '}'), () => depth - 1, () => depth));
        return relationGate(relationAll([relationEqual(value, '}'), relationEqual(nextDepth, 0)]), () => index, () => matchingBrace(tokens, openIndex, relationAdvanceIndex(index, 1), nextDepth));
    }, () => tokens.length);
}
function indexOf(tokens: readonly TokenDescriptor[], value: string, start: number, index = start): number {
    return relationGate(index < tokens.length, () => relationGate(relationEqual(tokens[index].value, value), () => index, () => indexOf(tokens, value, start, relationAdvanceIndex(index, 1))), () => -1);
}
function lastIndexOf(tokens: readonly TokenDescriptor[], value: string, index = tokens.length - 1): number {
    return relationGate(index >= 0, () => relationGate(relationEqual(tokens[index].value, value), () => index, () => lastIndexOf(tokens, value, relationAdvanceIndex(index, -1))), () => -1);
}
