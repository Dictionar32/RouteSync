import { relationNormalizeWhitespace, relationAll } from '../../../../semantic/foundation/semanticRelations';
import { relationEqual } from '../../../../semantic/foundation/semanticRelations';
import { relationGate, relationProject, relationSelect, relationOptionFold, relationSome, relationNone, type RelationOption } from '../../../../semantic/foundation/relationalSequence';
/**
 * actionValidationExtractor.ts
 *
 * Extracts inline validation and resolves action schemas from FormRequests or rules.
 * Decisions are represented as semantic relations rather than host-language control flow.
 *
 * @module core/compiler/scanner/subscanners/controller/actionValidationExtractor
 */

import type { Token } from '../lexer/types';
import type { RouteValidationRuleEntry, RouteSchemaPayload } from '../../../../types/route';
import type { RequestField } from '../../../../types/domain/request';
import type { ControllerRequestBinding } from '../../descriptors/request/controllerActionContract';
import { LaravelSourceLexer } from '../../LaravelSourceLexer';
import { ScannedRouteValidationRuleEntry } from '../../descriptors/validation/validationRuleEntry';
import { createRouteSchemaPayload } from '../../../../types/domain/validationRules';

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

export function extractInlineValidation(
    source: string,
    tokens: readonly Token[],
    k: number,
): RelationOption<InlineValidationExtraction> {
    return inlineExtraction(source, tokens, k);
}

const formRequestFields = (request: ControllerRequestBinding): readonly RequestField[] =>
    relationGate(
        relationEqual(request.kind, 'form_request'),
        () => request.source.fields,
        () => [],
    );

const schemaIsEmpty = (schema: RouteSchemaPayload): boolean =>
    relationEqual(schema.fields.length + schema.messages.length + schema.attributes.length, 0);

export function resolveActionSchema(
    request: ControllerRequestBinding,
    inlineSchema: RouteSchemaPayload,
): RouteSchemaPayload {
    const formFields = formRequestFields(request);
    return relationGate(
        relationEqual(formFields.length, 0),
        () => inlineSchema,
        () => relationGate(
            schemaIsEmpty(inlineSchema),
            () => createRouteSchemaPayload(formFields),
            () => createRouteSchemaPayload(
                [...formFields, ...inlineSchema.fields],
                inlineSchema.messages,
                inlineSchema.attributes,
            ),
        ),
    );
}
