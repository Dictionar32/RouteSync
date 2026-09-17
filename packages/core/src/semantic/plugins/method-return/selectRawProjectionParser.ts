/** Small deterministic lexer for the limited SQL projection syntax exposed by selectRaw. */
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { PrimitiveKind, PrimitiveType } from '../../../compiler/types/SemanticType';
import type { ResponseFieldName } from '../../../types/domain/semanticValues';
import type { SemanticType } from '../../../compiler/types/SemanticType';

export function parseSelectRawFields(sql: string): readonly (readonly [ResponseFieldName, SemanticType])[] {
  const fields: (readonly [ResponseFieldName, SemanticType])[] = [];
  for (const part of splitTopLevel(sql)) {
    const alias = aliasAfterAs(part);
    if (alias !== null) fields.push([SemanticValueFactory.responseFieldName(alias), aggregateType(part)] as const);
  }
  return fields;
}

function aggregateType(expression: string): SemanticType {
  const upper = expression.toUpperCase();
  if (containsToken(upper, 'AVG') || containsToken(upper, 'COUNT') || containsToken(upper, 'SUM') || containsToken(upper, 'MIN') || containsToken(upper, 'MAX')) {
    return new PrimitiveType(PrimitiveKind.NUMBER);
  }
  return new PrimitiveType(PrimitiveKind.UNKNOWN);
}

function containsToken(value: string, token: string): boolean {
  let index = value.indexOf(token + '(');
  while (index >= 0) {
    if (index === 0 || !isWord(value[index - 1])) return true;
    index = value.indexOf(token + '(', index + 1);
  }
  return false;
}

function aliasAfterAs(expression: string): string | null {
  const words = expression.trim().split(' ').filter(Boolean);
  for (let i = 0; i + 1 < words.length; i += 1) {
    if (words[i].toLowerCase() === 'as') return cleanAlias(words[i + 1]);
  }
  return null;
}

function cleanAlias(value: string): string | null {
  const alias = value.trim().split('`').join('').split(',').join('').split(';').join('');
  return alias.length > 0 ? alias : null;
}

function splitTopLevel(value: string): readonly string[] {
  const result: string[] = [];
  let start = 0;
  let depth = 0;
  let quote = '';
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (quote !== '') {
      if (char === quote && value[i - 1] !== '\\') quote = '';
      continue;
    }
    if (char === "'" || char === '"') { quote = char; continue; }
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) { result.push(value.slice(start, i)); start = i + 1; }
  }
  result.push(value.slice(start));
  return result;
}

function isWord(value: string | undefined): boolean {
  return value !== undefined && ((value >= 'A' && value <= 'Z') || (value >= 'a' && value <= 'z') || (value >= '0' && value <= '9') || value === '_');
}
