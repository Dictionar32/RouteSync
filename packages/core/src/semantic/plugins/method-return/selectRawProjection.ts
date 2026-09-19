/**
 * Builds semantic query projection data from a selectRaw literal.
 * This is an upstream query-expression boundary: downstream accessors never
 * parse SQL or infer fields from the base model.
 */
import type { MethodCallField } from '../../../types/field';
import type { SemanticResolution } from '../../../types/domain/semanticResolution';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import type { ModelName } from '../../../types/domain/semanticValues';
import type { ModelSemanticDefinition } from '../../../types/domain/models';
import type { SemanticTraceNode } from '../../../types/domain/semanticResolution';
import { parseSelectRawFields } from './selectRawProjectionParser';

export function resolveSelectRawProjection(
  meta: MethodCallField,
  sourceModel: ModelName,
  sourceDefinition: ModelSemanticDefinition,
  sourceTrace: readonly SemanticTraceNode[],
  confidence: number,
): SemanticResolution {
  const sql = firstLiteral(meta);
  if (sql === null) return unknown('selectRaw requires a literal SQL projection', sourceTrace);
  const fields = parseProjection(sql, sourceDefinition);
  if (fields.length === 0) return unknown('selectRaw projection has no aliased fields', sourceTrace);
  const surface = SemanticResolutionFactory.queryProjectionSurface(fields);
  const boundAst = BoundSemanticFactory.queryProjection({
    sourceModel,
    surface,
    cardinality: { kind: 'collection' },
    nullability: { kind: 'non_nullable' },
  });
  const trace = [...sourceTrace, {
    source: 'SelectRawProjectionResolver',
    rule: 'selectRaw aliases become query projection fields',
    input: sql,
    output: fields.map(field => field.name.value).join(', '),
  }];
  return SemanticResolutionFactory.queryProjection({
    status: 'resolved', confidence, trace, boundAst, sourceModel, sourceDefinition, surface,
    cardinality: { kind: 'collection' }, nullability: { kind: 'non_nullable' },
  });
}

function firstLiteral(meta: MethodCallField): string | null {
  const argument = meta.args[0];
  if (!argument || argument.kind !== 'positional') return null;
  const value = argument.value;
  return value.kind === 'literal' && typeof value.value === 'string' ? value.value : null;
}

function parseProjection(sql: string, sourceDefinition: ModelSemanticDefinition) {
  return parseSelectRawFields(sql, sourceDefinition);
}

function unknown(rule: string, trace: readonly SemanticTraceNode[]): SemanticResolution {
  return SemanticResolutionFactory.unknown({ status: 'unknown', confidence: 0, trace: [...trace, { source: 'SelectRawProjectionResolver', rule, input: 'selectRaw', output: 'unknown' }], boundAst: BoundSemanticFactory.unsupported('unsupported_syntax') });
}
