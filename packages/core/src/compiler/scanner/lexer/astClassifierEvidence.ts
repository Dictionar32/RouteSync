/**
 * Stable scanner-facing syntax port. Parsing/classification stays in the
 * runtime implementation; semantic evidence is delegated to the existing
 * upstream producer and closed semantic-stage contract.
 */
import type {
  AstClassifierEvidenceInterface,
  AstClassifierEvidenceRequest,
  AstClassifierExpressionResult,
  AstClassifierBlockResult,
} from '../../../types/upstream/astClassifierEvidenceContract';
import type { AstSemanticStageInterface } from '../../../types/upstream/astSemanticStageInterfaceAlgebra';
import type { AstNodeIdentity } from '../../../types/upstream/ast';
import type { SourceSpan } from '../../../types/upstream/provenance';
import { produceAstSemanticEvidence } from '../../../types/upstream/astSemanticEvidenceProducer';
import type { PhpAstExpressionKind } from '../../../types/upstream/phpAstSyntaxKind';
import type { PhpAstValue, PhpBlock, TokenDescriptor } from './PhpAst';
import {
  classifyAstTokens as runtimeClassifyAstTokens,
  classifyPhpBlock as runtimeClassifyPhpBlock,
} from './astClassifierRuntime';
import { phpSourceTokenizer } from './tokenizer';
import { astSemanticStageInterfaceOf } from '../../../types/upstream/astSemanticStageInterfaceAlgebra';

export type AstClassifierEvidencePort = AstClassifierEvidenceInterface<TokenDescriptor, PhpAstValue, PhpBlock>;

const classifyExpression = (
  tokens: readonly TokenDescriptor[],
): AstClassifierExpressionResult<PhpAstValue> => Object.freeze({
  kind: 'expression',
  value: runtimeClassifyAstTokens(tokens),
});

const classifyBlock = (
  tokens: readonly TokenDescriptor[],
): AstClassifierBlockResult<PhpBlock> => Object.freeze({
  kind: 'block',
  value: runtimeClassifyPhpBlock(tokens),
});

function classify(request: Extract<AstClassifierEvidenceRequest<TokenDescriptor>, { readonly kind: 'expression' }>): AstClassifierExpressionResult<PhpAstValue>;
function classify(request: Extract<AstClassifierEvidenceRequest<TokenDescriptor>, { readonly kind: 'block' }>): AstClassifierBlockResult<PhpBlock>;
function classify(request: AstClassifierEvidenceRequest<TokenDescriptor>): AstClassifierExpressionResult<PhpAstValue> | AstClassifierBlockResult<PhpBlock> {

  switch (request.kind) {
    case 'expression':
      return classifyExpression(request.tokens);
    case 'block':
      return classifyBlock(request.tokens);
  }
}

export const astClassifierEvidenceInterface: AstClassifierEvidencePort = Object.freeze({ classify });

const expressionValue = (result: AstClassifierExpressionResult<PhpAstValue>): PhpAstValue => result.value;

const blockValue = (result: AstClassifierBlockResult<PhpBlock>): PhpBlock => result.value;

/** Legacy text ingress is tokenized before crossing the typed syntax boundary. */
const classifyValueResult = (source: string): PhpAstValue => {
  const tokens = phpSourceTokenizer.tokenize(source).filter(token => token.type !== 'EOF');
  return expressionValue(astClassifierEvidenceInterface.classify({ kind: 'expression', tokens }));
};

const classifyTokensResult = (tokens: readonly TokenDescriptor[]): PhpAstValue =>
  expressionValue(astClassifierEvidenceInterface.classify({ kind: 'expression', tokens }));

const classifyBlockResult = (tokens: readonly TokenDescriptor[]): PhpBlock =>
  blockValue(astClassifierEvidenceInterface.classify({ kind: 'block', tokens }));


export type AstSemanticEvidenceRequest = Readonly<{
  readonly node: AstNodeIdentity;
  readonly source: SourceSpan;
  readonly syntax: PhpAstExpressionKind;
}>;

const classifySemanticResult = (input: AstSemanticEvidenceRequest): AstSemanticStageInterface =>
  astSemanticStageInterfaceOf(produceAstSemanticEvidence(input));

/** Typed conveniences project over syntax capabilities or the existing semantic producer. */
export const classifyAstValue = classifyValueResult;
export const classifyAstTokens = classifyTokensResult;
export const classifyPhpBlock = classifyBlockResult;
export const classifyAstSemanticEvidence = classifySemanticResult;
