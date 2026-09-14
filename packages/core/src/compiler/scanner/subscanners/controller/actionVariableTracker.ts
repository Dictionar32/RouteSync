/**
 * actionVariableTracker.ts
 *
 * Tracks action parameters, local assignments, and variable bindings in controller actions.
 *
 * @module core/compiler/scanner/subscanners/controller/actionVariableTracker
 */

import type { Token } from '../lexer/types';
import type { FormRequestDescriptor } from '../../../../types/route';
import { ScannedFormRequestDescriptor } from '../../../../types/route';

export interface ActionParameterScanResult {
    readonly formRequests: readonly FormRequestDescriptor[];
    readonly paramVariables: ReadonlyMap<string, string>;
    readonly bodyStartIndex: number;
}

export function scanActionParameters(
    tokens: readonly Token[],
    funcTokenIdx: number
): ActionParameterScanResult {
    const formRequests: FormRequestDescriptor[] = [];
    const paramVariables = new Map<string, string>();

    let pIdx = funcTokenIdx + 2;
    while (pIdx < tokens.length && tokens[pIdx].value !== '{' && tokens[pIdx].value !== ';') {
        if (tokens[pIdx].type === 'IDENTIFIER' && tokens[pIdx + 1]?.type === 'VARIABLE') {
            const typeName = tokens[pIdx].value;
            const varName = tokens[pIdx + 1].value;
            paramVariables.set(varName, typeName);
            if (typeName.endsWith('Request') && typeName !== 'Request') {
                formRequests.push(ScannedFormRequestDescriptor.create(typeName));
            }
        }
        pIdx++;
    }

    return {
        formRequests,
        paramVariables,
        bodyStartIndex: pIdx
    };
}

export function trackVariableAssignment(
    tokens: readonly Token[],
    k: number,
    localVariables: Map<string, string>
): void {
    if (tokens[k].type === 'VARIABLE' && tokens[k + 1]?.value === '=') {
        const lhs = tokens[k].value;
        const rhs1 = tokens[k + 2];
        const rhs2 = tokens[k + 3];

        if (rhs1?.type === 'IDENTIFIER' && rhs2?.value === '::') {
            const callee = rhs1.value;
            if (callee === 'DB') {
                if (tokens[k + 4]?.value === 'table' && tokens[k + 5]?.value === '(') {
                    const tableToken = tokens[k + 6];
                    if (tableToken) {
                        const cleanTable = tableToken.value.replace(/['"]/g, '');
                        localVariables.set(lhs, `table:${cleanTable}`);
                    }
                }
            } else if (!['Log', 'Auth', 'Validator', 'Gate', 'Session', 'Cache', 'Event', 'Response'].includes(callee)) {
                localVariables.set(lhs, callee);
            }
        } else if (rhs1?.type === 'VARIABLE') {
            const baseVar = rhs1.value;
            if (localVariables.has(baseVar)) {
                localVariables.set(lhs, localVariables.get(baseVar)!);
            }
        }
    }
}

export function resolveBoundModel(
    firstArg: string,
    localVariables: ReadonlyMap<string, string>,
    paramVariables: ReadonlyMap<string, string>
): string | undefined {
    if (firstArg.startsWith('$') && localVariables.has(firstArg)) {
        return localVariables.get(firstArg);
    }
    if (firstArg.startsWith('table:')) {
        return firstArg;
    }
    if (firstArg.includes('::')) {
        const root = firstArg.split('::')[0];
        if (!['DB', 'Log', 'Auth', 'Response'].includes(root)) {
            return root;
        }
    }
    if (paramVariables.has(firstArg)) {
        return paramVariables.get(firstArg);
    }
    return undefined;
}
