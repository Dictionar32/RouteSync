import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import type { ResponseFieldName } from '../../../types/domain/semanticValues';
import type { QueryProjectionField } from '../../../types/domain/semanticResolution';
import type { ModelSemanticDefinition } from '../../../types/upstream/model';
import { aggregateType } from './selectRawProjectionTypes';

export function parseSelectRawFields(
  sql: string,
  sourceDefinition: ModelSemanticDefinition,
): readonly QueryProjectionField[] {
  const fields: QueryProjectionField[] = [];
  for (const part of splitTopLevel(sql)) {
    const alias = aliasAfterAs(part);
    if (alias === null) continue;
    const aggregate = aggregateKind(part);
    if (aggregate !== null) {
      const source = aggregateSource(part, aggregate);
      fields.push({
        kind: 'aggregate', name: SemanticValueFactory.responseFieldName(alias), aggregate, source,
        type: aggregateType(aggregate, source, sourceDefinition),
      });
      continue;
    }
    const column = projectedColumn(part);
    if (column !== null) {
      const property = sourceDefinition.surface.byName.column(SemanticValueFactory.propertyName(column));
      if (property.kind === 'missing') continue;
      fields.push({
        kind: 'column', name: SemanticValueFactory.responseFieldName(alias),
        source: SemanticValueFactory.columnName(column), type: property.value.semanticType,
      });
    }
  }
  return Object.freeze(fields);
}

function aggregateKind(expression: string): 'avg' | 'count' | 'sum' | 'min' | 'max' | null {
  const upper = expression.toUpperCase();
  if (containsToken(upper, 'AVG')) return 'avg';
  if (containsToken(upper, 'COUNT')) return 'count';
  if (containsToken(upper, 'SUM')) return 'sum';
  if (containsToken(upper, 'MIN')) return 'min';
  if (containsToken(upper, 'MAX')) return 'max';
  return null;
}

function aggregateSource(expression: string, aggregate: 'avg' | 'count' | 'sum' | 'min' | 'max') {
  if (aggregate === 'count' && /COUNT\s*\(\s*\*\s*\)/i.test(expression)) return { kind: 'rows' } as const;
  const marker = `${aggregate.toUpperCase()}(`;
  const start = expression.toUpperCase().indexOf(marker);
  if (start < 0) return { kind: 'rows' } as const;
  const inner = expression.slice(start + marker.length).split(')')[0].trim().replace(/^[`"']|[`"']$/g, '');
  return { kind: 'column', column: SemanticValueFactory.columnName(inner) } as const;
}

function projectedColumn(expression: string): string | null {
  const beforeAs = expression.split(/\bas\b/i)[0].trim();
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(beforeAs) ? beforeAs : null;
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
  for (let i = 0; i + 1 < words.length; i += 1) if (words[i].toLowerCase() === 'as') return cleanAlias(words[i + 1]);
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
    if (quote !== '') { if (char === quote && value[i - 1] !== '\\') quote = ''; continue; }
    if (char === "'" || char === '"') { quote = char; continue; }
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) { result.push(value.slice(start, i)); start = i + 1; }
  }
  result.push(value.slice(start));
  return result;
}

function isWord(value: string | undefined): boolean {
  return value !== undefined && /[A-Za-z0-9_]/.test(value);
}
