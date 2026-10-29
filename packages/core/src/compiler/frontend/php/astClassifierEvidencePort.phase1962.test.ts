import { describe, expect, it } from 'vitest';
import { astClassifierEvidenceInterface } from './astClassifierEvidence';
import { phpSourceTokenizer } from './tokenizer';
import type { AstClassifierBlockResult, AstClassifierExpressionResult } from '../../../types/upstream/astClassifierEvidenceContract';
import type { PhpAstValue, PhpBlock, TokenDescriptor } from './PhpAst';

describe('Phase 1962 AST classifier request/result correlation', () => {
  it('correlates expression requests with expression results at the interface', () => {
    const tokens: readonly TokenDescriptor[] = phpSourceTokenizer.tokenize('$order->id');
    const result: AstClassifierExpressionResult<PhpAstValue> = astClassifierEvidenceInterface.classify({ kind: 'expression', tokens });

    expect(result.kind).toBe('expression');
    expect(result.value.kind).toBeDefined();
  });

  it('correlates block requests with block results at the interface', () => {
    const tokens: readonly TokenDescriptor[] = phpSourceTokenizer.tokenize('return $order;');
    const result: AstClassifierBlockResult<PhpBlock> = astClassifierEvidenceInterface.classify({ kind: 'block', tokens });

    expect(result.kind).toBe('block');
    expect(result.value.kind).toBe('block');
  });
});
