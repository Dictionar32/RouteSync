import type { FieldNode } from '@routesync/core';
import { parsePhpExpression } from './php';

export class PhpCodeParser {
  public static parseExpression(code: string, hints?: { pattern?: string }): FieldNode {
    return parsePhpExpression(code, hints);
  }
}
