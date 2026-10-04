/**
 * Builds semantic query projection data from a selectRaw literal.
 * This is an upstream query-expression boundary: downstream accessors never
 * parse SQL or infer fields from the base model.
 */
import type { MethodCallAstNode, PhpArgument, PhpAstNode, LiteralAstNode } from '../../../types/domain/phpAst';
import type { SemanticResolution } from '../../../types/domain/semanticResolution';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import type { ModelName } from '../../../types/domain/semanticValues';
import type { ModelSemanticDefinition } from '../../../types/upstream/model';
import type { SemanticTraceNode } from '../../../types/domain/semanticResolution';
import { parseSelectRawFields } from './selectRawProjectionParser';
import { relationOptionFold, relationProject, relationResolve, relationRefine, relationVariantFold } from '../../kernel/relationalSequence';
import { relationEqual } from '../../kernel/semanticRelations';

type LiteralOption = { readonly kind: 'none' } | { readonly kind: 'some'; readonly value: string };
const noneLiteral = (): LiteralOption => ({ kind: 'none' });
const someLiteral = (value: string): LiteralOption => ({ kind: 'some', value });


export function resolveSelectRawProjection(
  meta: MethodCallAstNode,
  sourceModel: ModelName,
  sourceDefinition: ModelSemanticDefinition,
  sourceTrace: readonly SemanticTraceNode[],
  confidence: number,
): SemanticResolution {
  return relationOptionFold(firstLiteral(meta),
    () => indeterminate('selectRaw requires a literal SQL projection', sourceTrace),
    sql => {
      const fields = parseProjection(sql, sourceDefinition);
      return relationResolve(fields.length > 0,
        () => {
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
            output: relationProject(fields, field => field.name.value).join(', '),
          }];
          return SemanticResolutionFactory.queryProjection({
            status: 'resolved', confidence, trace, boundAst, sourceModel, sourceDefinition, surface,
            cardinality: { kind: 'collection' }, nullability: { kind: 'non_nullable' },
          });
        },
        () => indeterminate('selectRaw projection has no aliased fields', sourceTrace),
      );
    },
  );
}

function firstLiteral(meta: MethodCallAstNode): LiteralOption {
  const isPositional = (value: PhpArgument): value is Extract<PhpArgument, { kind: 'positional' }> => relationEqual(value.kind, 'positional');
  const isLiteral = (value: PhpAstNode): value is LiteralAstNode => relationEqual(value.kind, 'literal');
  return relationOptionFold(
    relationRefine(meta.args[0], isPositional),
    noneLiteral,
    positional => relationOptionFold(
      relationRefine(positional.value, isLiteral),
      noneLiteral,
      literal => relationVariantFold(
        literal.value,
        'string',
        () => noneLiteral(),
        value => someLiteral(value.value),
      ),
    ),
  );
}

function parseProjection(sql: string, sourceDefinition: ModelSemanticDefinition) {
  return parseSelectRawFields(sql, sourceDefinition);
}

function indeterminate(rule: string, trace: readonly SemanticTraceNode[]): SemanticResolution {
  return SemanticResolutionFactory.indeterminate({ status: 'indeterminate', confidence: 0, trace: [...trace, { source: 'SelectRawProjectionResolver', rule, input: 'selectRaw', output: 'indeterminate' }], boundAst: BoundSemanticFactory.unsupported('unsupported_syntax') });
}
