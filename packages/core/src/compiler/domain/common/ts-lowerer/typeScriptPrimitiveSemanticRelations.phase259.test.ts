import { PrimitiveKind } from '../../types/SemanticType';
import { resolveTypeScriptPrimitiveToken } from './typeScriptPrimitiveSemanticRelations';

const expected: readonly [PrimitiveKind, string][] = [
  [PrimitiveKind.STRING, 'string'],
  [PrimitiveKind.NUMBER, 'number'],
  [PrimitiveKind.BOOLEAN, 'boolean'],
  [PrimitiveKind.DATETIME, 'string'],
  [PrimitiveKind.FILE, 'File'],
  [PrimitiveKind.UNKNOWN, 'unknown'],
  [PrimitiveKind.UNSPECIFIED, 'unknown'],
];

for (const [kind, token] of expected) {
  if (resolveTypeScriptPrimitiveToken(kind) !== token) {
    throw new Error(`Phase 259 primitive mapping failed for ${kind}`);
  }
}

console.log('phase259 declarative TypeScript primitive semantics: PASS');
