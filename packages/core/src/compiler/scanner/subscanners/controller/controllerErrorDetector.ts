/**
 * controllerErrorDetector.ts
 *
 * Scans controller action tokens for explicit abort() calls and HTTP error responses.
 *
 * @module core/compiler/scanner/subscanners/controller/controllerErrorDetector
 */

import type { Token } from '../lexer/types';
import { HttpErrorResponseDescriptor } from '../../../../types/route';
import { ScannedHttpErrorResponseDescriptor } from '../../descriptors/routeDescriptors';

const CODE_DISPATCH: Record<number, () => HttpErrorResponseDescriptor> = {
    400: () => ScannedHttpErrorResponseDescriptor.badRequest(),
    401: () => ScannedHttpErrorResponseDescriptor.unauthorized(),
    403: () => ScannedHttpErrorResponseDescriptor.forbidden(),
    404: () => ScannedHttpErrorResponseDescriptor.notFound(),
    422: () => ScannedHttpErrorResponseDescriptor.unprocessableEntity(),
    500: () => ScannedHttpErrorResponseDescriptor.internalServerError()
};

/**
 * Detects explicit abort(code) or response()->json(..., code) error responses.
 */
export function detectActionError(
    tokens: readonly Token[],
    k: number
): HttpErrorResponseDescriptor | undefined {
    // 1. abort(code, ...)
    if (tokens[k].value === 'abort' && tokens[k + 1]?.value === '(') {
        const argToken = tokens[k + 2];
        if (argToken && !isNaN(Number(argToken.value))) {
            const code = Number(argToken.value);
            return CODE_DISPATCH[code]?.();
        }
    }

    // 2. response()->json(..., code)
    if (tokens[k].value === 'json' && tokens[k - 1]?.value === '->' && tokens[k + 1]?.value === '(') {
        let parenDepth = 1;
        let p = k + 2;
        while (p < tokens.length && parenDepth > 0 && tokens[p].value !== ';') {
            if (tokens[p].value === '(' || tokens[p].value === '[') parenDepth++;
            else if (tokens[p].value === ')' || tokens[p].value === ']') {
                parenDepth--;
                if (parenDepth === 0) break;
            } else if (parenDepth === 1 && tokens[p].value === ',') {
                const nextVal = tokens[p + 1]?.value;
                if (nextVal && !isNaN(Number(nextVal))) {
                    const code = Number(nextVal);
                    if (code >= 400 && code < 600) {
                        return CODE_DISPATCH[code]?.();
                    }
                }
            }
            p++;
        }
    }

    return undefined;
}
