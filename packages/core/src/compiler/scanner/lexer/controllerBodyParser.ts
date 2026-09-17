/** Parses controller-body syntax facts into a typed body AST. */
import type { TokenDescriptor } from './phpAstTypes';
import { createAstIdentifier } from './phpAstTypes';
import { parsePhpArray } from './arrayParser';
import type { ControllerBodyAst, InlineValidationAst, ControllerErrorAst } from './controllerBodyAstTypes';
import { createHttpErrorStatus, createValidationRuleLiteral } from './controllerBodyAstTypes';

export function parseControllerBody(source: string, tokens: readonly TokenDescriptor[]): ControllerBodyAst {
    const validations: InlineValidationAst[] = [];
    const errors: ControllerErrorAst[] = [];

    for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index];
        if (token.value === 'validate' && tokens[index + 1]?.value === '(') {
            const parsed = parsePhpArray(source, tokens, index + 1);
            validations.push(...toValidations(parsed.entries, token));
            index = Math.max(index, parsed.endIndex - 1);
            continue;
        }
        const status = parseAbortStatus(tokens, index) ?? parseJsonStatus(tokens, index);
        if (status !== undefined) errors.push({ status: createHttpErrorStatus(status), source: token });
    }

    return Object.freeze({
        validations: Object.freeze(validations),
        errors: Object.freeze(errors),
    });
}

function toValidations(
    entries: readonly import('./PhpAst').PhpArrayEntry[],
    source: TokenDescriptor
): readonly InlineValidationAst[] {
    return entries.map(entry => {
        const raw = entry.value.kind === 'literal' && entry.value.literalType === 'string' ? entry.value.value : '';
        return Object.freeze({
            field: entry.key,
            rules: Object.freeze(raw.split('|').filter(rule => rule.length > 0).map(createValidationRuleLiteral)),
            source,
        });
    });
}

function parseAbortStatus(tokens: readonly TokenDescriptor[], index: number): number | undefined {
    if (tokens[index]?.value !== 'abort' || tokens[index + 1]?.value !== '(') return undefined;
    return numericStatus(tokens[index + 2]?.value);
}

function parseJsonStatus(tokens: readonly TokenDescriptor[], index: number): number | undefined {
    if (tokens[index]?.value !== 'json' || tokens[index - 1]?.value !== '->' || tokens[index + 1]?.value !== '(') return undefined;
    let depth = 1;
    for (let cursor = index + 2; cursor < tokens.length && depth > 0; cursor++) {
        const value = tokens[cursor].value;
        if (value === '(' || value === '[') depth++;
        if (value === ')' || value === ']') depth--;
        if (depth === 1 && value === ',') {
            const status = numericStatus(tokens[cursor + 1]?.value);
            if (status !== undefined) return status;
        }
        if (value === ';') return undefined;
    }
    return undefined;
}

function numericStatus(value: string | undefined): number | undefined {
    if (value === undefined || !/^\d+$/.test(value)) return undefined;
    const status = Number(value);
    return status >= 400 && status < 600 ? status : undefined;
}
