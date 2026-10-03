import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import type { QueryProjectionField } from '../../../types/domain/semanticResolution';
import type { ModelSemanticDefinition } from '../../../types/upstream/model';
import { aggregateType } from './selectRawProjectionTypes';
import { relationResolve, relationFirst, relationOptionFold, relationTextSlice, relationGate } from '../../kernel/relationalSequence';
import { relationAny, relationAll, relationEqual, relationNotEqual } from '../../kernel/semanticRelations';
import { matchLookup } from '../../../types/upstream/collections';
import type { RelationOption } from '../../kernel/relationalSequence';

type Aggregate = 'avg' | 'count' | 'sum' | 'min' | 'max';
const AGGREGATES: readonly [Aggregate, string][] = [
  ['avg', 'AVG'], ['count', 'COUNT'], ['sum', 'SUM'], ['min', 'MIN'], ['max', 'MAX'],
];

export function parseSelectRawFields(sql: string, sourceDefinition: ModelSemanticDefinition): readonly QueryProjectionField[] {
  return Object.freeze(projectParts(splitTopLevel(sql), sourceDefinition));
}

const projectParts = (parts: readonly string[], sourceDefinition: ModelSemanticDefinition, index = 0, output: readonly QueryProjectionField[] = []): readonly QueryProjectionField[] =>
  relationResolve(index < parts.length,
    () => {
      const part = parts[index];
      return relationOptionFold(
        aliasAfterAs(part),
        () => projectParts(parts, sourceDefinition, index + 1, output),
        alias => projectParts(parts, sourceDefinition, index + 1, projectPart(part, alias, sourceDefinition, output)),
      );
    },
    () => output);

const projectPart = (part: string, alias: string, sourceDefinition: ModelSemanticDefinition, output: readonly QueryProjectionField[]): readonly QueryProjectionField[] =>
  relationOptionFold(
    aggregateKind(part),
    () => projectColumn(part, alias, sourceDefinition, output),
    aggregate => [...output, {
      kind: 'aggregate', name: SemanticValueFactory.responseFieldName(alias), aggregate,
      source: aggregateSource(part, aggregate), type: aggregateType(aggregate, aggregateSource(part, aggregate), sourceDefinition),
    }],
  );

const projectColumn = (part: string, alias: string, sourceDefinition: ModelSemanticDefinition, output: readonly QueryProjectionField[]): readonly QueryProjectionField[] =>
  relationOptionFold(
    projectedColumn(part),
    () => output,
    column => matchLookup(
      sourceDefinition.surface.byName.column(SemanticValueFactory.propertyName(column)),
      {
        missing: () => output,
        found: lookup => [...output, {
          kind: 'column', name: SemanticValueFactory.responseFieldName(alias), source: SemanticValueFactory.columnName(column),
          type: lookup.value.semanticType,
        }],
      },
    ),
  );

function aggregateKind(expression: string): RelationOption<Aggregate> {
  const upper = expression.toUpperCase();
  return relationOptionFold(relationFirst(AGGREGATES, ([, token]) => containsToken(upper, token)), () => ({ kind: 'none' }), ([kind]) => ({ kind: 'some', value: kind }));
}

function aggregateSource(expression: string, aggregate: Aggregate) {
  const upper = expression.toUpperCase();
  const rows = relationResolve(relationEqual(aggregate, 'count'), () => /COUNT\s*\(\s*\*\s*\)/i.test(expression), () => false);
  const marker = `${aggregate.toUpperCase()}(`;
  const start = upper.indexOf(marker);
  return relationResolve(relationAny([rows, start < 0]),
    () => ({ kind: 'rows' } as const),
    () => ({ kind: 'column', column: SemanticValueFactory.columnName(relationTextSlice(expression, start + marker.length, expression.length).split(')')[0].replace(/^[`"']|[`"']$/g, '')) } as const));
}

function projectedColumn(expression: string): RelationOption<string> {
  const beforeAs = expression.split(/\bas\b/i)[0].replace(/^\s+|\s+$/g, '');
  return relationGate(/^[A-Za-z_][A-Za-z0-9_]*$/.test(beforeAs), () => ({ kind: 'some', value: beforeAs }), () => ({ kind: 'none' }));
}

function containsToken(value: string, token: string): boolean {
  const normalizedValue = value.toUpperCase();
  const normalizedToken = token.toUpperCase();
  const scan = (index: number): boolean => relationResolve(
    index < normalizedValue.length,
    () => relationGate(
      relationEqual(normalizedValue.slice(index, index + normalizedToken.length), normalizedToken),
      () => relationAll([
        relationGate(index > 0, () => !/[A-Z0-9_]/.test(normalizedValue[index - 1]), () => true),
        relationGate(index + normalizedToken.length < normalizedValue.length, () => !/[A-Z0-9_]/.test(normalizedValue[index + normalizedToken.length]), () => true),
      ]),
      () => scan(index + 1),
    ),
    () => false,
  );
  return scan(0);
}

function aliasAfterAs(expression: string): RelationOption<string> {
  const match = relationFirst([...expression.matchAll(/\bas\s+([^\s]+)/ig)], () => true);
  return relationOptionFold(match, () => ({ kind: 'none' }), value => cleanAlias(String(value[1])));
}

function cleanAlias(value: string): RelationOption<string> {
  const alias = value.replace(/^\s+|\s+$/g, '').split('`').join('').split(',').join('').split(';').join('');
  return relationGate(alias.length > 0, () => ({ kind: 'some', value: alias }), () => ({ kind: 'none' }));
}

function splitTopLevel(value: string, index = 0, start = 0, depth = 0, quote = '', output: readonly string[] = []): readonly string[] {
  return relationResolve(index < value.length,
    () => {
      const char = value[index];
      const escapedQuote = relationNotEqual(relationAny([
        relationEqual(quote, ''),
        relationAll([relationEqual(char, quote), relationEqual(value[index - 1], '\\')]),
      ]), true);
      const nextQuote = relationResolve(
        relationEqual(quote, ''),
        () => relationResolve(relationEqual(char, "'"), () => char, () => relationResolve(relationEqual(char, '"'), () => char, () => '')),
        () => relationResolve(escapedQuote, () => '', () => quote),
      );
      const nextDepth = relationResolve(
        relationAll([relationEqual(quote, ''), relationEqual(char, '(')]),
        () => depth + 1,
        () => relationResolve(relationAll([relationEqual(quote, ''), relationEqual(char, ')')]), () => depth - 1, () => depth),
      );
      const splitPoint = relationAll([relationEqual(quote, ''), relationEqual(char, ','), relationEqual(depth, 0)]);
      const nextOutput = relationResolve(splitPoint, () => [...output, relationTextSlice(value, start, index)], () => output);
      const nextStart = relationResolve(splitPoint, () => index + 1, () => start);
      return splitTopLevel(value, index + 1, nextStart, nextDepth, nextQuote, nextOutput);
    },
    () => [...output, relationTextSlice(value, start, value.length)]);
}
