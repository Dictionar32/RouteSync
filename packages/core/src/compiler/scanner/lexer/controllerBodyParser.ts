/** Parses controller-body syntax facts into a typed body AST. */
import type { TokenDescriptor, PhpAstValue, PhpStatement, PhpBlock, AstIdentifier } from './phpAstTypes';
import { createAstIdentifier } from './phpAstTypes';
import { parsePhpArray } from './arrayParser';
import type { ControllerBodyAst, InlineValidationAst, ControllerErrorAst, ControllerDataflowAst } from './controllerBodyAstTypes';
import type { ControllerVariableSemantic } from '../../../types/upstream/controller';
import { createHttpErrorStatus, createValidationRuleLiteral } from './controllerBodyAstTypes';
import { classifyPhpBlock } from './astClassifier';
import { analyzeControllerDataflow } from './controllerDataflowAnalyzer';
import {
    relationFold,
    relationGate,
    relationSelect,
    relationOptionFold,
    relationProject,
    relationEqual,
    relationAll,
    relationAny,
    relationRefine,
    relationSome,
    relationNone,
    type RelationOption,
} from '../../../semantic/kernel/relationalSequence';
import type { PhpArrayEntry, PhpArrayKey } from './PhpAst';
import type { RelationVariant } from '../../../semantic/kernel/relationalSequence';

type ControllerParseState = Readonly<{
    readonly validations: readonly InlineValidationAst[];
    readonly errors: readonly ControllerErrorAst[];
}>;

const emptyControllerParseState = (): ControllerParseState => Object.freeze({
    validations: Object.freeze([]),
    errors: Object.freeze([]),
});

export function parseControllerBody(
    source: string,
    tokens: readonly TokenDescriptor[],
    parameters: readonly AstIdentifier[],
    parameterSemantics: readonly (readonly [AstIdentifier, ControllerVariableSemantic])[] = [],
    filePath = '<php-source>'
): ControllerBodyAst {
    const state = relationFold(
        tokens,
        emptyControllerParseState(),
        (current, token, index) => {
            const validation = parseValidation(tokens, source, index);
            const next = relationOptionFold(
                validation,
                () => relationOptionFold(
                    parseErrorStatus(tokens, index),
                    () => current,
                    status => ({
                        validations: current.validations,
                        errors: [...current.errors, { status: createHttpErrorStatus(status), source: token }],
                    }),
                ),
                () => current,
            );
            return relationOptionFold(
                validation,
                () => next,
                parsed => ({
                    validations: [...current.validations, ...toValidations(parsed.entries, token)],
                    errors: current.errors,
                }),
            );
        },
    );

    const parsedBlock = classifyPhpBlock(tokens);
    const dataflow = buildDataflow(parsedBlock, parameters, parameterSemantics, filePath);
    return Object.freeze({
        statements: parsedBlock.statements,
        validations: Object.freeze(state.validations),
        errors: Object.freeze(state.errors),
        dataflow,
    });
}

function buildDataflow(
    block: PhpBlock,
    parameters: readonly AstIdentifier[],
    parameterSemantics: readonly (readonly [AstIdentifier, ControllerVariableSemantic])[],
    filePath: string
): ControllerDataflowAst {
    return analyzeControllerDataflow(block, parameters, parameterSemantics, filePath);
}

function parseValidation(
    tokens: readonly TokenDescriptor[],
    source: string,
    index: number,
): RelationOption<{ readonly entries: readonly PhpArrayEntry[]; readonly endIndex: number }> {
    const token = tokenAt(tokens, index);
    const open = tokenAt(tokens, index + 1);
    return relationOptionFold(token, relationNone, current =>
        relationOptionFold(open, relationNone, next =>
            relationGate(
                relationAll([relationEqual(current.value, 'validate'), relationEqual(next.value, '(')]),
                () => {
                    const parsed = parsePhpArray(source, tokens, index + 1);
                    return relationSome({ entries: parsed.entries, endIndex: parsed.endIndex });
                },
                relationNone,
            ),
        ),
    );
}

function toValidations(entries: readonly PhpArrayEntry[], source: TokenDescriptor): readonly InlineValidationAst[] {
    return relationProject(entries, entry => {
        const keyed = relationRefine(
            entry,
            (candidate): candidate is RelationVariant<PhpArrayEntry, 'keyed'> => relationEqual(candidate.kind, 'keyed'),
        );
        return relationOptionFold(
            keyed,
            () => { throw Error('Validation rules require keyed PHP array entries'); },
            current => {
                const field = relationOptionFold(
                    requireStringArrayKey(current.value),
                    () => { throw Error('Validation rule keys require string keys'); },
                    value => value,
                );
                const literal = relationRefine(
                    current.value,
                    (candidate): candidate is Extract<typeof candidate, { readonly kind: 'literal'; readonly literalType: 'string' }> =>
                        relationAll([relationEqual(candidate.kind, 'literal'), relationEqual(candidate.literalType, 'string')]),
                );
                const raw = relationOptionFold(literal, () => '', value => value.value);
                const rules = relationSelect(raw.split('|'), rule => rule.length > 0);
                return Object.freeze({
                    field: createAstIdentifier(field),
                    rules: Object.freeze(relationProject(rules, createValidationRuleLiteral)),
                    source,
                });
            },
        );
    });
}

function parseErrorStatus(tokens: readonly TokenDescriptor[], index: number): RelationOption<number> {
    const token = tokenAt(tokens, index);
    const next = tokenAt(tokens, index + 1);
    const statusToken = tokenAt(tokens, index + 2);
    const abort = relationOptionFold(token, () => (relationNone()), current =>
        relationOptionFold(next, () => (relationNone()), open =>
            relationGate(relationAll([relationEqual(current.value, 'abort'), relationEqual(open.value, '(')]), () =>
                relationOptionFold(statusToken, () => (relationNone()), status => numericStatus(status.value)),
                () => (relationNone()))));
    return relationOptionFold(abort, () => parseJsonStatus(tokens, index), value => (relationSome(value)));
}

function parseJsonStatus(tokens: readonly TokenDescriptor[], index: number): RelationOption<number> {
    const previous = tokenAt(tokens, index - 1);
    const token = tokenAt(tokens, index);
    const open = tokenAt(tokens, index + 1);
    return relationOptionFold(previous, () => (relationNone()), previousToken =>
        relationOptionFold(token, () => (relationNone()), current =>
            relationOptionFold(open, () => (relationNone()), openToken =>
                relationGate(relationAll([relationEqual(previousToken.value, '->'), relationEqual(current.value, 'json'), relationEqual(openToken.value, '(')]), () =>
                    scanJsonStatus(tokens, index + 2, 1),
                    () => (relationNone())))));
}

function scanJsonStatus(tokens: readonly TokenDescriptor[], cursor: number, depth: number): RelationOption<number> {
    const current = tokenAt(tokens, cursor);
    return relationOptionFold(current, () => (relationNone()), token => {
        const nextDepth = relationGate(relationAny([relationEqual(token.value, '('), relationEqual(token.value, '[')]), () => depth + 1,
            () => relationGate(relationAny([relationEqual(token.value, ')'), relationEqual(token.value, ']')]), () => depth - 1, () => depth));
        const candidate = relationGate(relationAll([relationEqual(depth, 1), relationEqual(token.value, ',')]), () =>
            relationOptionFold(tokenAt(tokens, cursor + 1), () => (relationNone()), status => numericStatus(status.value)),
            () => (relationNone()));
        return relationOptionFold(candidate,
            () => relationGate(relationAny([relationEqual(token.value, ';'), relationEqual(nextDepth, 0)]),
                () => (relationNone()),
                () => scanJsonStatus(tokens, cursor + 1, nextDepth)),
            value => (relationSome(value)));
    });
}

function numericStatus(value: string): RelationOption<number> {
    return relationGate(/^\d+$/.test(value), () => {
        const status = Number(value);
        return relationGate(relationAll([status >= 400, status < 600]), () => (relationSome(status)), () => (relationNone()));
    }, () => (relationNone()));
}

function tokenAt(tokens: readonly TokenDescriptor[], index: number): RelationOption<TokenDescriptor> {
    return relationGate(relationAll([index >= 0, index < tokens.length]),
        () => (relationSome(tokens[index])),
        () => (relationNone()));
}

function requireStringArrayKey(key: PhpArrayKey): RelationOption<string> {
    const refined = relationRefine(
        key,
        (candidate): candidate is Extract<PhpArrayKey, { readonly kind: 'string' }> => relationEqual(candidate.kind, 'string'),
    );
    return relationOptionFold(refined, relationNone, value => relationSome(value.value));
}
