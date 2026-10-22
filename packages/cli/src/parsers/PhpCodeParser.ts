import type { PhpAstNode } from '@routesync/core';
import { phpExpressionParsingOperation } from './php';

export interface PhpCodeParsingOperationInterface {
  readonly parseExpression: (code: string, hints?: { readonly pattern?: string }) => PhpAstNode;
}

export const phpCodeParsingOperation: PhpCodeParsingOperationInterface = Object.freeze({
  parseExpression: (code: string, _hints?: { readonly pattern?: string }): PhpAstNode =>
    phpExpressionParsingOperation.parse(code),
});
