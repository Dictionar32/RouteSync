/** Strict binary-expression semantic producer. Policy is relation-driven. */
import type { SemanticResolution } from '../../../types/domain/semanticResolution';
import type { ResolutionContext, ResolverMeta } from '../../types';
import type { ResolutionScope } from '../../resolutionScope';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { PrimitiveKind, type PrimitiveType, primitiveType } from '../../../types/domain/semanticType';
import { resolveInScope } from '../../kernel/resolveInScope';
import { relationFirstOption, relationOptionFold, relationResolve, relationRefine } from '../../kernel/relationalSequence';
import { relationAll, relationAny, relationEqual } from '../../kernel/semanticRelations';

type BinaryMeta = Extract<ResolverMeta, { kind: 'binary_expression' }>;
type ScalarResolution = Extract<SemanticResolution, { kind: 'scalar' }>;
type SemanticOperator = Parameters<typeof SemanticValueFactory.semanticOperator>[0];

const arithmeticTypeCatalog: readonly [string, PrimitiveType][] = Object.freeze([
  ['addition', primitiveType(PrimitiveKind.NUMBER)],
  ['subtraction', primitiveType(PrimitiveKind.NUMBER)],
  ['multiplication', primitiveType(PrimitiveKind.NUMBER)],
  ['division', primitiveType(PrimitiveKind.NUMBER)],
  ['modulo', primitiveType(PrimitiveKind.NUMBER)],
  ['concat', primitiveType(PrimitiveKind.STRING)],
]);

const operatorCatalog: readonly [string, SemanticOperator][] = Object.freeze([
  ['addition', 'add'], ['subtraction', 'subtract'], ['multiplication', 'multiply'],
  ['division', 'divide'], ['modulo', 'modulo'], ['concat', 'concat'],
]);

const isBinaryMeta = (meta: ResolverMeta): meta is BinaryMeta => relationEqual(meta.kind, 'binary_expression');
const isScalar = (value: SemanticResolution): value is ScalarResolution => relationEqual(value.kind, 'scalar');
const isKnown = (value: SemanticResolution): boolean => !relationEqual(value.kind, 'indeterminate');

export function resolveBinaryExpression(meta: ResolverMeta, context: ResolutionContext, scope: ResolutionScope): SemanticResolution {
  return relationOptionFold(
    relationRefine(meta, isBinaryMeta),
    () => indeterminate('Invalid binary-expression metadata'),
    binary => {
      const left = resolveInScope(context.kernel, binary.left, scope);
      const right = resolveInScope(context.kernel, binary.right, scope);
      const operator = binary.operator.kind;
      const trace = [...left.trace, ...right.trace, {
        source: 'ExpressionResolver', rule: `Binary operation: ${operator}`,
        input: operator, output: 'resolved binary expression',
      }];
      return relationResolve(relationEqual(operator, 'null_coalesce'),
        () => resolveNullCoalesce(left, right, trace),
        () => relationOptionFold(
          relationFirstOption(arithmeticTypeCatalog, entry => relationEqual(entry[0], operator)),
          () => indeterminate(`Unsupported binary operator: ${operator}`),
          typeEntry => relationResolve(relationAny([relationEqual(left.kind, 'indeterminate'), relationEqual(right.kind, 'indeterminate')]),
            () => indeterminate(`Binary operand unresolved: ${operator}`),
            () => relationOptionFold(
              relationFirstOption(operatorCatalog, entry => relationEqual(entry[0], operator)),
              () => indeterminate(`Unsupported semantic operator: ${operator}`),
              operatorEntry => ({
                kind: 'scalar', status: 'resolved', confidence: Math.min(left.confidence, right.confidence),
                trace, boundAst: BoundSemanticFactory.binary({
                  operator: SemanticValueFactory.semanticOperator(operatorEntry[1]),
                  left: left.boundAst, right: right.boundAst, resultingType: typeEntry[1],
                }),
                semanticType: typeEntry[1], nullability: { kind: 'non_nullable' },
              }),
            )),
        ),
      );
    },
  );
}

function resolveNullCoalesce(left: SemanticResolution, right: SemanticResolution, trace: SemanticResolution['trace']): SemanticResolution {
  return relationResolve(relationAll([!isKnown(left), !isKnown(right)]),
    () => indeterminate('Both null-coalesce operands are unresolved'),
    () => relationOptionFold(
      relationFirstOption([left, right], isScalar),
      () => indeterminate('Null-coalesce requires scalar semantic operands'),
      resolved => ({
        kind: 'scalar', status: 'resolved', confidence: resolved.confidence, trace,
        boundAst: BoundSemanticFactory.binary({
          operator: SemanticValueFactory.semanticOperator('null_coalesce'),
          left: left.boundAst, right: right.boundAst, resultingType: resolved.semanticType,
        }), semanticType: resolved.semanticType, nullability: { kind: 'non_nullable' },
      }),
    ),
  );
}

function indeterminate(rule: string): SemanticResolution {
  return {
    kind: 'indeterminate', status: 'indeterminate', confidence: 0,
    trace: [{ source: 'ExpressionResolver', rule, input: 'binary_expression', output: 'indeterminate' }],
    boundAst: BoundSemanticFactory.unsupported('unsupported_syntax'),
  };
}
