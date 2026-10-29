/**
 * PHP AST projection for the upstream ExpressionStructure judgment.
 *
 * This adapter is intentionally downstream of structural resolution: it does
 * not inspect token precedence or choose expression candidates. It only maps
 * an already-selected closed structure into the scanner's PHP AST vocabulary.
 */
import type { ExpressionStructure } from '../../../types/upstream/scannerExpressionStructure';
import type { PhpAstValue, PhpAstValueNode, PhpArgument, PhpBinaryOperator, PhpUnaryOperator, TokenDescriptor } from './PhpAst';
import { PhpAstFactory } from './PhpAst';
import { createAstIdentifier } from './phpAstTypes';
import { createSourceOffset } from './phpAstCoreTypes';

type BinaryOperator = PhpBinaryOperator | Readonly<{ readonly kind: 'null_coalesce' }>;
type UnaryOperator = PhpUnaryOperator;
type Structure = ExpressionStructure<TokenDescriptor, BinaryOperator, UnaryOperator>;

export type PhpExpressionStructureProjection = Readonly<{
  readonly classify: (tokens: readonly TokenDescriptor[]) => PhpAstValue;
  readonly parseArguments: (tokens: readonly TokenDescriptor[]) => readonly PhpArgument[];
  readonly locate: (value: PhpAstValueNode, tokens: readonly TokenDescriptor[]) => PhpAstValue;
}>;

export interface PhpExpressionStructureProjectionOperationInterface {
  readonly project: (
    structure: Structure,
    sourceTokens: readonly TokenDescriptor[],
    projection: PhpExpressionStructureProjection,
  ) => PhpAstValue;
}

export const phpExpressionStructureProjectionOperation: PhpExpressionStructureProjectionOperationInterface = Object.freeze({
  project: (
    structure: Structure,
    sourceTokens: readonly TokenDescriptor[],
    projection: PhpExpressionStructureProjection,
  ): PhpAstValue => {
  const classify = projection.classify;
  const locate = (value: PhpAstValueNode): PhpAstValue => projection.locate(value, sourceTokens);

  switch (structure.kind) {
    case 'short_ternary':
      return locate(PhpAstFactory.shortTernary(classify(structure.condition), classify(structure.fallback)));
    case 'ternary':
      return locate(PhpAstFactory.ternaryExpression(
        classify(structure.condition),
        classify(structure.consequent),
        classify(structure.alternative),
      ));
    case 'array_access':
      return locate(PhpAstFactory.arrayAccess(classify(structure.base), classify(structure.index)));
    case 'call': {
      const args = projection.parseArguments(structure.arguments);
      return locate(structure.calleeKind === 'identifier'
        ? PhpAstFactory.functionCall(
          createAstIdentifier(structure.callee[0].value),
          PhpAstFactory.functionNameSourceEvidence(structure.callee, {
            startOffset: createSourceOffset(structure.callee[0].startOffset),
            endOffset: createSourceOffset(structure.callee[structure.callee.length - 1].endOffset),
          }),
          args,
        )
        : PhpAstFactory.callableCall(classify(structure.callee), args));
    }
    case 'binary': {
      const left = classify(structure.left);
      const right = classify(structure.right);
      return locate(structure.operator.kind === 'null_coalesce'
        ? PhpAstFactory.nullCoalesce(left, right)
        : PhpAstFactory.binaryExpression(structure.operator, left, right));
    }
    case 'unary':
      return locate(PhpAstFactory.unaryExpression(structure.operator, classify(structure.operand)));
  }
  },
});
