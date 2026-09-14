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
    FormRequestDescriptor,
    RouteSchemaPayload
} from '../../../../types/route';
import type { RequestType } from '../../../artifacts/RequestTypesArtifact';
import { LaravelSourceLexer } from '../../LaravelSourceLexer';
import { ScannedRouteValidationRuleEntry, ScannedRouteSchemaPayload } from '../../descriptors/validationDescriptors';

export function extractInlineValidation(
    source: string,
    tokens: readonly Token[],
    k: number
): { readonly rules: readonly RouteValidationRuleEntry[]; readonly nextIndex: number } | undefined {
    if (tokens[k].value === 'validate' && tokens[k + 1]?.value === '(') {
        const parsedVal = LaravelSourceLexer.parseArray(source, tokens as Token[], k + 1);
        if (parsedVal.entries.length > 0) {
            const rules = parsedVal.entries.map(e => {
                const rawRule = e.value.kind === 'literal' && e.value.literalType === 'string' ? String(e.value.value) : e.rawExpression;
                const rulesList = rawRule.includes('|') ? rawRule.split('|').map(r => r.trim()).filter(Boolean) : [rawRule];
                return ScannedRouteValidationRuleEntry.create(e.key, rulesList);
            });
            return { rules, nextIndex: Math.max(k, parsedVal.endIndex - 1) };
        }
    }
    return undefined;
}

export function resolveActionSchema(
    formRequests: readonly FormRequestDescriptor[],
    formRequestMap: ReadonlyMap<string, RequestType>,
    schemaRules: readonly RouteValidationRuleEntry[] | undefined
): RouteSchemaPayload {
    for (const fr of formRequests) {
        const reqType = formRequestMap.get(fr.name);
        if (reqType && reqType.actions.length > 0 && reqType.actions[0].fields.length > 0) {
            return ScannedRouteSchemaPayload.fromRules(
                reqType.actions[0].fields.map(f => ScannedRouteValidationRuleEntry.create(
                    f.originalName,
                    [f.required ? 'required' : 'nullable'],
                    f.transformedName
                ))
            );
        }
    }
    if (schemaRules && schemaRules.length > 0) {
        return ScannedRouteSchemaPayload.fromRules(schemaRules);
    }
    return ScannedRouteSchemaPayload.empty();
}
