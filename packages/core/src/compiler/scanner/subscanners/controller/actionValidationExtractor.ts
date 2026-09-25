/**
 * actionValidationExtractor.ts
 *
 * Extracts inline validation and resolves action schemas from FormRequests or rules.
 *
 * @module core/compiler/scanner/subscanners/controller/actionValidationExtractor
 */

import type { Token } from '../lexer/types';
import type {
    RouteValidationRuleEntry,
    RouteSchemaPayload
} from '../../../../types/route';
import type { RequestField, FormRequestSource } from '../../../../types/domain/request';
import type { ControllerRequestBinding } from '../../descriptors/request/controllerActionContract';
import { LaravelSourceLexer } from '../../LaravelSourceLexer';
import { ScannedRouteValidationRuleEntry, ScannedRouteSchemaPayload } from '../../descriptors/validationDescriptors';

export function extractInlineValidation(
    source: string,
    tokens: readonly Token[],
    k: number
): { readonly rules: readonly RouteValidationRuleEntry[]; readonly nextIndex: number } | undefined {
    const nextToken = tokens[k + 1];
    if (tokens[k].value === 'validate' && nextToken && nextToken.value === '(') {
        const parsedVal = LaravelSourceLexer.parseArray(source, tokens as Token[], k + 1);
        if (parsedVal.entries.length > 0) {
            const rules = parsedVal.entries.map(e => {
                const rulesList = e.value.kind === 'literal' && e.value.literalType === 'string'
                    ? e.value.value.split('|').map(r => r.trim()).filter(Boolean)
                    : [];
                return ScannedRouteValidationRuleEntry.create(e.key, rulesList);
            });
            return { rules, nextIndex: Math.max(k, parsedVal.endIndex - 1) };
        }
    }
    return undefined;
}

export function resolveActionSchema(
    request: ControllerRequestBinding,
    inlineSchema: RouteSchemaPayload
): RouteSchemaPayload {
    const formFields: RequestField[] = [];
    if (request.kind === 'form_request') {
        formFields.push(...request.source.fields);
    }
    if (formFields.length === 0) return inlineSchema;
    if (inlineSchema.fields.length === 0 && inlineSchema.messages.length === 0 && inlineSchema.attributes.length === 0) {
        return ScannedRouteSchemaPayload.fromFields(formFields);
    }
    return ScannedRouteSchemaPayload.fromFields(
        [...formFields, ...inlineSchema.fields],
        inlineSchema.messages,
        inlineSchema.attributes
    );
}
