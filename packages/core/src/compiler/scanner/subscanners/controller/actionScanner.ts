/**
 * actionScanner.ts
 *
 * Scans individual controller action body: parameters, validation, and response.
 *
 * @module core/compiler/scanner/subscanners/controller
 */

import type { Token } from '../lexer/types';
import type {
  ResponseDescriptor,
  RouteValidationRuleEntry,
  FormRequestDescriptor,
  RouteSchemaPayload
} from '../../../../types/route';
import { ResourceResponseDescriptor } from '../../../../types/route';
import type { RequestType } from '../../../artifacts/RequestTypesArtifact';
import { LaravelSourceLexer } from '../../LaravelSourceLexer';
import {
  ControllerActionInfo,
  ScannedControllerActionDescriptor
} from '../../descriptors/requestDescriptors';
import { ScannedRouteValidationRuleEntry, ScannedRouteSchemaPayload } from '../../descriptors/validationDescriptors';
import { ScannedFormRequestDescriptor } from '../../../../types/route';
import {
  detectResourceResponse,
  detectModelResponse,
  detectInlineResponse
} from './responseDetector';

export function scanControllerAction(
  source: string,
  tokens: readonly Token[],
  funcTokenIdx: number,
  controllerName: string,
  fullPath: string,
  formRequestMap: ReadonlyMap<string, RequestType>
): { readonly actionName: string; readonly descriptor: ControllerActionInfo } | undefined {
  if (tokens[funcTokenIdx].value !== 'function' || tokens[funcTokenIdx + 1]?.type !== 'IDENTIFIER') {
    return undefined;
  }

  const actionName = tokens[funcTokenIdx + 1].value;
  const sourceLine = source.slice(0, tokens[funcTokenIdx].startOffset).split('\n').length;
  const formRequests: FormRequestDescriptor[] = [];

  // Scan parameters for FormRequest type hint
  let pIdx = funcTokenIdx + 2;
  while (pIdx < tokens.length && tokens[pIdx].value !== '{' && tokens[pIdx].value !== ';') {
    if (tokens[pIdx].type === 'IDENTIFIER' && tokens[pIdx].value.endsWith('Request') && tokens[pIdx].value !== 'Request' && tokens[pIdx + 1]?.type === 'VARIABLE') {
      formRequests.push(ScannedFormRequestDescriptor.create(tokens[pIdx].value));
    }
    pIdx++;
  }

  let k = pIdx;
  let responseDesc: ResponseDescriptor | undefined;
  let schemaRules: RouteValidationRuleEntry[] | undefined;

  if (tokens[k]?.value === '{') {
    let depth = 1;
    k++;
    while (k < tokens.length && depth > 0) {
      if (tokens[k].value === '{') depth++;
      else if (tokens[k].value === '}') depth--;

      // Inline validation: $request->validate([ ... ])
      if (tokens[k].value === 'validate' && tokens[k + 1]?.value === '(') {
        const parsedVal = LaravelSourceLexer.parseArray(source, tokens as Token[], k + 1);
        if (parsedVal.entries.length > 0) {
          schemaRules = parsedVal.entries.map(e => {
            const rawRule = e.value.kind === 'literal' && e.value.literalType === 'string' ? String(e.value.value) : e.rawExpression;
            const rulesList = rawRule.includes('|') ? rawRule.split('|').map(r => r.trim()).filter(Boolean) : [rawRule];
            return ScannedRouteValidationRuleEntry.create(e.key, rulesList);
          });
        }
        k = Math.max(k, parsedVal.endIndex - 1);
      }

      if (!responseDesc) {
        responseDesc =
          detectResourceResponse(tokens, k) ??
          detectModelResponse(tokens, k) ??
          detectInlineResponse(source, tokens, k, controllerName, actionName);
      }

      k++;
    }
  }

  let schema: RouteSchemaPayload = ScannedRouteSchemaPayload.empty();
  for (const fr of formRequests) {
    const reqType = formRequestMap.get(fr.name);
    if (reqType && reqType.actions.length > 0 && reqType.actions[0].fields.length > 0) {
      schema = ScannedRouteSchemaPayload.fromRules(
        reqType.actions[0].fields.map(f => ScannedRouteValidationRuleEntry.create(
          f.originalName,
          [f.required ? 'required' : 'nullable'],
          f.transformedName
        ))
      );
      break;
    }
  }
  if (schema.rules.length === 0 && schemaRules && schemaRules.length > 0) {
    schema = ScannedRouteSchemaPayload.fromRules(schemaRules);
  }

  const defaultResource = `${controllerName.replace(/Controller$/, '')}Resource`;
  const resolvedResponse = responseDesc ?? ResourceResponseDescriptor.single(defaultResource);

  const descriptor = ScannedControllerActionDescriptor.create({
    controllerName,
    actionName,
    response: resolvedResponse,
    sourceFile: fullPath,
    sourceLine,
    formRequests,
    schema,
    schemaRules: schemaRules ?? []
  });

  return { actionName, descriptor };
}
