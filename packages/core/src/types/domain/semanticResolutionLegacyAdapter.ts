import type { LegacySemanticResolution } from '../contract';
import type { SemanticResolution } from './semanticResolution';

/**
 * Explicit migration boundary. Legacy consumers may still receive the old
 * shape, but no resolver is allowed to construct that shape as its source of
 * truth. The conversion is one-way: strict ADT -> legacy boundary.
 */
export function toLegacySemanticResolution(
  resolution: SemanticResolution,
): LegacySemanticResolution {
  switch (resolution.kind) {
    case 'scalar':
      return {
        status: resolution.status,
        type: resolution.semanticType.kind === 'primitive'
          ? resolution.semanticType.type
          : 'unknown',
        nullable: resolution.nullable,
        confidence: resolution.confidence,
        trace: resolution.trace.map(trace => ({
          source: trace.source,
          rule: trace.rule,
          input: trace.input,
          output: trace.output,
        })),
        boundAst: resolution.boundAst,
      };
    case 'model':
      return {
        status: resolution.status,
        type: 'model',
        model: resolution.model.value,
        collection: resolution.cardinality.kind === 'collection',
        paginated: resolution.paginated,
        confidence: resolution.confidence,
        trace: resolution.trace.map(trace => ({
          source: trace.source,
          rule: trace.rule,
          input: trace.input,
          output: trace.output,
        })),
        boundAst: resolution.boundAst,
      };
    case 'resource':
      return {
        status: resolution.status,
        type: 'resource',
        resource: resolution.resource.value,
        collection: resolution.cardinality.kind === 'collection',
        paginated: resolution.paginated,
        confidence: resolution.confidence,
        trace: resolution.trace.map(trace => ({
          source: trace.source,
          rule: trace.rule,
          input: trace.input,
          output: trace.output,
        })),
        boundAst: resolution.boundAst,
      };
    case 'object':
      return {
        status: resolution.status,
        type: 'object',
        fields: Object.fromEntries(
          resolution.fields.map(([name, type]) => [name.value, type.kind]),
        ),
        confidence: resolution.confidence,
        trace: resolution.trace.map(trace => ({
          source: trace.source,
          rule: trace.rule,
          input: trace.input,
          output: trace.output,
        })),
        boundAst: resolution.boundAst,
      };
    case 'query_projection':
      return {
        status: resolution.status,
        type: 'object',
        model: resolution.sourceModel.value,
        collection: resolution.cardinality.kind === 'collection',
        nullable: resolution.nullable,
        fields: Object.fromEntries(
          resolution.fields.map(([name, type]) => [name.value, type.kind]),
        ),
        confidence: resolution.confidence,
        trace: resolution.trace.map(trace => ({
          source: trace.source,
          rule: trace.rule,
          input: trace.input,
          output: trace.output,
        })),
        boundAst: resolution.boundAst,
      };
    case 'unknown':
      return {
        status: resolution.status,
        type: 'unknown',
        confidence: resolution.confidence,
        trace: resolution.trace.map(trace => ({
          source: trace.source,
          rule: trace.rule,
          input: trace.input,
          output: trace.output,
        })),
        boundAst: resolution.boundAst,
      };
  }
}
