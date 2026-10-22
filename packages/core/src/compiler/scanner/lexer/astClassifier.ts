/**
 * Canonical legacy scanner adapter for the existing AST classifier interface.
 * All lexer consumers converge on the single request/result ADT port; this
 * module does not maintain a parallel relation-based classification path.
 */
export {
  classifyAstTokens,
  classifyAstValue,
  classifyPhpBlock,
} from './astClassifierEvidence';
export type { PhpAstValue, TokenDescriptor, PhpBlock } from './PhpAst';
