import { relationNormalizeWhitespace, relationAll } from '../../../../semantic/relations/semanticRelations';
import { relationEqual } from '../../../../semantic/relations/semanticRelations';
import { relationGate, relationProject, relationSelect, relationOptionFold, relationSome, relationNone, type RelationOption } from '../../../../semantic/relations/relationalSequence';
/**
 * actionValidationExtractor.ts
 *
 * Extracts inline validation and resolves action schemas from FormRequests or rules.
 * Decisions are represented as semantic relations rather than host-language control flow.
 *
 * @module core/compiler/scanner/operations/controller/actionValidationExtractor
 */

import type { Token } from '../../../frontend/php/types';
import type { RouteValidationRuleEntry } from '../../../../types/route';
import { LaravelSourceLexer } from '../../LaravelSourceLexer';
import { ScannedRouteValidationRuleEntry } from '../../../semantic/validation/validationRuleEntry';

export type InlineValidationExtraction = { readonly rules: readonly RouteValidationRuleEntry[]; readonly nextIndex: number };

const validationRules = (value: string): readonly string[] => {
    const candidates = value.split('|');
    const normalized = relationProject(candidates, rule => relationNormalizeWhitespace(rule));
    return relationSelect(normalized, rule => rule.length > 0);
};

const inlineEntries = (source: string, tokens: readonly Token[], index: number): readonly InlineValidationExtraction[] => {
    const nextToken: RelationOption<Token> = relationGate(
        index + 1 < tokens.length,
        () => relationSome(tokens[index + 1]),
        relationNone<Token>,
    );
    return relationOptionFold(
        nextToken,
        () => [],
        token => relationGate(
            relationEqual(tokens[index].value, 'validate'),
            () => relationGate(
                relationEqual(token.value, '('),
                () => {
                    const parsed = LaravelSourceLexer.parseArray(source, tokens as Token[], index + 1);
                    return relationGate(
                        parsed.entries.length > 0,
                        () => [
                            {
                                rules: relationProject(parsed.entries, entry => ScannedRouteValidationRuleEntry.create(
                                    entry.key,
                                    relationGate(
                                        relationAll([relationEqual(entry.value.kind, 'literal'), relationEqual(entry.value.literalType, 'string')]),
                                        () => validationRules(entry.value.value),
                                        () => [],
                                    ),
                                )),
                                nextIndex: Math.max(index, parsed.endIndex - 1),
                            },
                        ],
                        () => [],
                    );
                },
                () => [],
            ),
            () => [],
        ),
    );
};

const inlineExtraction = (source: string, tokens: readonly Token[], index: number): RelationOption<InlineValidationExtraction> => {
    const entries = inlineEntries(source, tokens, index);
    return relationGate(entries.length > 0, () => relationSome(entries[0]), relationNone<InlineValidationExtraction>);
};

function extractInlineValidationImplementation(
    source: string,
    tokens: readonly Token[],
    k: number,
): RelationOption<InlineValidationExtraction> {
    return inlineExtraction(source, tokens, k);
}


export interface ActionValidationExtractorOperationsInterface {
  readonly extractInlineValidation: typeof extractInlineValidationImplementation;
}

export const actionValidationExtractorOperations: ActionValidationExtractorOperationsInterface = Object.freeze({
    extractInlineValidation: extractInlineValidationImplementation,
});
