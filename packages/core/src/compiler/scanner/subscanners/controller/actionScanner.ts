/**
 * actionScanner.ts
 *
 * Scans individual controller action body: parameters, validation, and response.
 * Active Consumer orchestrating variable tracking, validation extraction, and descriptor construction.
 *
 * @module core/compiler/scanner/subscanners/controller
 */

import type { Token } from '../lexer/types';
import type { ResponseDescriptor, RouteValidationRuleEntry, HttpErrorResponseDescriptor } from '../../../../types/route';
import { ResourceResponseDescriptor } from '../../../../types/route';
import type { RequestType } from '../../../artifacts/RequestTypesArtifact';
import { ControllerActionInfo, ScannedControllerActionDescriptor } from '../../descriptors/requestDescriptors';
import { detectResourceInvocation, detectModelResponse, detectInlineResponse } from './responseDetector';
import { scanActionParameters, trackVariableAssignment, resolveBoundModel } from './actionVariableTracker';
import { extractInlineValidation, resolveActionSchema } from './actionValidationExtractor';
import { detectActionError } from './controllerErrorDetector';

export function scanControllerAction(
  source: string,
  tokens: readonly Token[],
  funcTokenIdx: number,
  controllerName: string,
  fullPath: string,
  formRequestMap: ReadonlyMap<string, RequestType>
): { readonly actionName: string; readonly descriptor: ControllerActionInfo } | undefined {
  if (tokens[funcTokenIdx].value !== 'function' || tokens[funcTokenIdx + 1]?.type !== 'IDENTIFIER') return undefined;

  const actionName = tokens[funcTokenIdx + 1].value;
  const sourceLine = source.slice(0, tokens[funcTokenIdx].startOffset).split('\n').length;
  const paramScan = scanActionParameters(tokens, funcTokenIdx);
  const localVariables = new Map<string, string>(paramScan.paramVariables);
  const resourceModelMap = new Map<string, string>();
  const errorResponses: HttpErrorResponseDescriptor[] = [];

  let k = paramScan.bodyStartIndex;
  let responseDesc: ResponseDescriptor | undefined;
  let schemaRules: readonly RouteValidationRuleEntry[] | undefined;

  if (tokens[k]?.value === '{') {
    let depth = 1;
    k++;
    while (k < tokens.length && depth > 0) {
      if (tokens[k].value === '{') depth++;
      else if (tokens[k].value === '}') depth--;

      trackVariableAssignment(tokens, k, localVariables);

      const inlineVal = extractInlineValidation(source, tokens, k);
      if (inlineVal) {
        schemaRules = inlineVal.rules;
        k = inlineVal.nextIndex;
      }

      const actionErr = detectActionError(tokens, k);
      if (actionErr) errorResponses.push(actionErr);

      if (!responseDesc) {
        const resInv = detectResourceInvocation(tokens, k);
        if (resInv) {
          responseDesc = resInv.descriptor;
          if (resInv.firstArg) {
            const bound = resolveBoundModel(resInv.firstArg, localVariables, paramScan.paramVariables);
            if (bound) resourceModelMap.set(resInv.resourceName, bound);
          }
        } else {
          responseDesc = detectModelResponse(tokens, k) ?? detectInlineResponse(source, tokens, k, controllerName, actionName);
        }
      }
      k++;
    }
  }

  const defaultResource = `${controllerName.replace(/Controller$/, '')}Resource`;
  const descriptor = ScannedControllerActionDescriptor.create({
    controllerName,
    actionName,
    response: responseDesc ?? ResourceResponseDescriptor.single(defaultResource),
    sourceFile: fullPath,
    sourceLine,
    formRequests: paramScan.formRequests,
    schema: resolveActionSchema(paramScan.formRequests, formRequestMap, schemaRules),
    schemaRules: schemaRules ?? [],
    resourceModelMap,
    errorResponses
  });

  return { actionName, descriptor };
}
