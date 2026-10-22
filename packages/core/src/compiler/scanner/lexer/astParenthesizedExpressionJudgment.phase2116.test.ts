import { describe, expect, it } from 'vitest';
import { classifyAstTokens } from './astClassifierRuntime';
import { phpSourceTokenizer } from './tokenizer';
import type { TokenDescriptor } from './PhpAst';

const tokens = (source: string): readonly TokenDescriptor[] =>
  phpSourceTokenizer.tokenize(source).filter(token => token.type !== 'EOF');

describe('Phase 2116 parenthesized AST judgment', () => {
  it('projects a fully matched parenthesized expression through the upstream delimiter judgment', () => {
    const parenthesized = classifyAstTokens(tokens('(1 + 2)'));
    const inner = classifyAstTokens(tokens('1 + 2'));

    expect(parenthesized.kind).toBe(inner.kind);
    expect(parenthesized.source.startOffset).toBeDefined();
    expect(parenthesized.source.endOffset).toBeDefined();
  });
});
