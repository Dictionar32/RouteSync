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
    type RelationOption,
} from '../../../semantic/kernel/relationalSequence';
import type { PhpArrayEntry, PhpArrayKey } from './PhpAst';

export function parseControllerBody(
    source: string,
    tokens: readonly TokenDescriptor[],
    parameters: readonly AstIdentifier[],
    parameterSemantics: readonly (readonly [AstIdentifier, ControllerVariableSemantic])[] = [],
    filePath = '<php-source>'
): ControllerBodyAst {
    const state = relationFold(
        tokens,
        { validations: [] as InlineValidationAst[], errors: [] as ControllerErrorAst[] },
        (current, token, index) => {
            const validation = relationOptionFold(
                parseValidation(tokens, source, index),
                () => ({ kind: 'none' as const }),
                parsed => ({ kind: 'validation' as const, parsed }),
            );
            const next = relationOptionFold(
                relationGate(relationEqual(validation.kind, 'validation'),
                    () => ({ kind: 'none' as const }),
                    () => parseErrorStatus(tokens, index)),
                () => current,
                status => ({
                    validations: current.validations,
                    errors: [...current.errors, { status: createHttpErrorStatus(status), source: token }],
                }),
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
    return relationOptionFold(token, () => ({ kind: 'none' }), current =>
        relationOptionFold(open, () => ({ kind: 'none' }), next =>
            relationGate(relationAll([relationEqual(current.value, 'validate'), relationEqual(next.value, '(')]), () => {
                const parsed = parsePhpArray(source, tokens, index + 1);
                return { kind: 'some', value: { entries: parsed.entries, endIndex: parsed.endIndex } };
            }, () => ({ kind: 'none' }))));
}

function toValidations(entries: readonly PhpArrayEntry[], source: TokenDescriptor): readonly InlineValidationAst[] {
    return relationProject(entries, entry => {
        const keyed = requireStringArrayKey(entry.key);
        return relationOptionFold(
            keyed,
            () => { throw Error('Validation rules require keyed PHP array entries'); },
            field => {
                const raw = relationOptionFold(
                    relationGate(relationAll([relationEqual(entry.value.kind, 'literal'), relationEqual(entry.value.literalType, 'string')]),
                        () => ({ kind: 'some' as const, value: entry.value.value }),
                        () => ({ kind: 'none' as const })),
                    () => '',
                    value => value,
                );
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
    const abort = relationOptionFold(token, () => ({ kind: 'none' }), current =>
        relationOptionFold(next, () => ({ kind: 'none' }), open =>
            relationGate(relationAll([relationEqual(current.value, 'abort'), relationEqual(open.value, '(')]), () =>
                relationOptionFold(statusToken, () => ({ kind: 'none' }), status => numericStatus(status.value)),
                () => ({ kind: 'none' }))));
    return relationOptionFold(abort, () => parseJsonStatus(tokens, index), value => ({ kind: 'some', value }));
}

function parseJsonStatus(tokens: readonly TokenDescriptor[], index: number): RelationOption<number> {
    const previous = tokenAt(tokens, index - 1);
    const token = tokenAt(tokens, index);
    const open = tokenAt(tokens, index + 1);
    return relationOptionFold(previous, () => ({ kind: 'none' }), previousToken =>
        relationOptionFold(token, () => ({ kind: 'none' }), current =>
            relationOptionFold(open, () => ({ kind: 'none' }), openToken =>
                relationGate(relationAll([relationEqual(previousToken.value, '->'), relationEqual(current.value, 'json'), relationEqual(openToken.value, '(')]), () =>
                    scanJsonStatus(tokens, index + 2, 1),
                    () => ({ kind: 'none' })))));
}

function scanJsonStatus(tokens: readonly TokenDescriptor[], cursor: number, depth: number): RelationOption<number> {
    const current = tokenAt(tokens, cursor);
    return relationOptionFold(current, () => ({ kind: 'none' }), token => {
        const nextDepth = relationGate(relationAny([relationEqual(token.value, '('), relationEqual(token.value, '[')]), () => depth + 1,
            () => relationGate(relationAny([relationEqual(token.value, ')'), relationEqual(token.value, ']')]), () => depth - 1, () => depth));
        const candidate = relationGate(relationAll([relationEqual(depth, 1), relationEqual(token.value, ',')]), () =>
            relationOptionFold(tokenAt(tokens, cursor + 1), () => ({ kind: 'none' }), status => numericStatus(status.value)),
            () => ({ kind: 'none' }));
        return relationOptionFold(candidate,
            () => relationGate(relationAny([relationEqual(token.value, ';'), relationEqual(nextDepth, 0)]),
                () => ({ kind: 'none' }),
                () => scanJsonStatus(tokens, cursor + 1, nextDepth)),
            value => ({ kind: 'some', value }));
    });
}

function numericStatus(value: string): RelationOption<number> {
    return relationGate(/^\d+$/.test(value), () => {
        const status = Number(value);
        return relationGate(relationAll([status >= 400, status < 600]), () => ({ kind: 'some', value: status }), () => ({ kind: 'none' }));
    }, () => ({ kind: 'none' }));
}

function tokenAt(tokens: readonly TokenDescriptor[], index: number): RelationOption<TokenDescriptor> {
    return relationGate(relationAll([index >= 0, index < tokens.length]),
        () => ({ kind: 'some', value: tokens[index] }),
        () => ({ kind: 'none' }));
}

function requireStringArrayKey(key: PhpArrayKey): RelationOption<string> {
    return relationGate(relationEqual(key.kind, 'string'), () => ({ kind: 'some', value: key.value }), () => ({ kind: 'none' }));
}