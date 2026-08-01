/**
 * Hash utilities for compiler
 */
import { createHash } from 'crypto';
import  { FileSpan } from '../types/FileSpan';
import { Instruction } from '../ir';

export function computeStableSymbolId(namespace: string, qualifiedName: string, span: FileSpan): string {
  const data = `${namespace}\\${qualifiedName}:${span.filePath}`;
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

export function computeIRHash(instructions: readonly Instruction[]): string {
  return createHash('sha256').update(JSON.stringify(instructions)).digest('hex');
}
