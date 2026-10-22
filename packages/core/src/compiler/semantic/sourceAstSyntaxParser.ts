import path from 'node:path';
import { LaravelSourceLexer } from '../scanner/LaravelSourceLexer';
import { parsePhpMethod } from '../scanner/lexer/phpMethodParser';
import type { SourceAstFileEvidence } from '../../types/upstream/sourceAstEvidenceAcquisitionInterface';
import type { TokenDescriptor, PhpClassPropertyAst } from '../scanner/lexer';
import { createAstIdentifier, createSourceOffset, createSourceLineNumber, classifyAstTokens } from '../scanner/lexer';
import type { PhpMethodAst } from '../scanner/lexer/phpMethodAstTypes';
import type { SourceAstParsedFile, SourceAstSyntaxParseContract, SourceAstSyntaxParserInterface } from '../../types/upstream/sourceAstSyntaxParserInterface';

type PropertyScanState = Readonly<{
  readonly classSeen: boolean;
  readonly classBodyOpened: boolean;
  readonly classBodyDepth: number;
  readonly depth: number;
  readonly skipUntil: number;
  readonly properties: readonly PhpClassPropertyAst[];
}>;

const sameText = (left: string, right: string): boolean => Object.is(left, right);

const modifierBeforeVariable = (tokens: readonly TokenDescriptor[], index: number, modifier: string): boolean => {
  const start = Math.max(index - 8, 0);
  const window = tokens.slice(start, index);
  const modifierIndex = window.findLastIndex(token => sameText(token.value, modifier));
  const boundaryIndex = window.findLastIndex(token => [';', '{', '}'].includes(token.value));
  return modifierIndex >= 0 && modifierIndex > boundaryIndex;
};

const visibility = (tokens: readonly TokenDescriptor[], index: number): PhpClassPropertyAst['visibility'] => {
  const value = tokens[index - 1]?.value ?? '';
  if (sameText(value, 'public')) return 'public';
  if (sameText(value, 'protected')) return 'protected';
  if (sameText(value, 'private')) return 'private';
  return 'implicit';
};

const propertyType = (tokens: readonly TokenDescriptor[], index: number): PhpClassPropertyAst['type'] => {
  const start = Math.max(index - 8, 0);
  const ignored = ['public', 'protected', 'private', 'static', 'readonly', 'var', ';', '{', '}'];
  const parts = tokens.slice(start, index).filter(token => !ignored.includes(token.value)).map(token => token.value);
  return parts.length === 0 ? { kind: 'untyped' } : { kind: 'declared', value: parts.join('') };
};

const endOfValue = (tokens: readonly TokenDescriptor[], start: number): number => {
  let depth = 0;
  let index = start;
  while (index < tokens.length) {
    const token = tokens[index];
    if (token === undefined) break;
    if (['[', '(', '{'].includes(token.value)) depth += 1;
    if ([']', ')', '}'].includes(token.value)) depth -= 1;
    if (sameText(token.value, ';') && depth === 0) return index;
    index += 1;
  }
  return tokens.length;
};

const parsePropertySyntax = (tokens: readonly TokenDescriptor[]): readonly PhpClassPropertyAst[] => {
  const initial: PropertyScanState = { classSeen: false, classBodyOpened: false, classBodyDepth: 0, depth: 0, skipUntil: -1, properties: [] };
  let state = initial;
  tokens.forEach((token, index) => {
    if (index <= state.skipUntil) return;
    const classSeen = sameText(token.value, 'class') || state.classSeen;
    let depthOpened = state.depth;
    if (sameText(token.value, '{')) depthOpened += 1;
    if (sameText(token.value, '}')) depthOpened -= 1;
    const opensClassBody = sameText(token.value, '{') && classSeen && !state.classBodyOpened;
    const bodyOpened = opensClassBody || state.classBodyOpened;
    const bodyDepth = opensClassBody ? depthOpened : state.classBodyDepth;
    const inBody = bodyOpened && depthOpened === bodyDepth && !sameText(token.value, '}');
    if (!(inBody && sameText(token.type, 'VARIABLE'))) {
      state = { ...state, classSeen, classBodyOpened: bodyOpened, classBodyDepth: bodyDepth, depth: depthOpened };
      return;
    }
    const nextValue = tokens[index + 1]?.value ?? '';
    if (!sameText(nextValue, '=') && !sameText(nextValue, ';')) {
      state = { ...state, classSeen, classBodyOpened: bodyOpened, classBodyDepth: bodyDepth, depth: depthOpened };
      return;
    }
    const initialized = sameText(nextValue, '=');
    const end = initialized ? endOfValue(tokens, index + 2) : index + 1;
    const valueTokens = initialized ? tokens.slice(index + 2, end) : [];
    const startToken = tokens[index - 1] ?? token;
    const endToken = tokens[end > index ? end - 1 : index] ?? token;
    const initialization: PhpClassPropertyAst['initialization'] = initialized
      ? { kind: 'present', value: classifyAstTokens(valueTokens) }
      : { kind: 'absent' };
    const property: PhpClassPropertyAst = Object.freeze({
      kind: 'class_property',
      name: createAstIdentifier(token.value.slice(1)),
      visibility: visibility(tokens, index),
      storage: modifierBeforeVariable(tokens, index, 'static') ? 'static' : 'instance',
      mutability: modifierBeforeVariable(tokens, index, 'readonly') ? 'readonly' : 'mutable',
      type: propertyType(tokens, index),
      promotion: { kind: 'declared' },
      initialization,
      value: initialized ? { kind: 'present', value: classifyAstTokens(valueTokens) } : { kind: 'absent' },
      documentation: { kind: 'absent' },
      startOffset: createSourceOffset(startToken.startOffset),
      endOffset: createSourceOffset(endToken.endOffset),
      startLine: createSourceLineNumber(startToken.line),
      endLine: createSourceLineNumber(endToken.line),
    });
    state = { classSeen, classBodyOpened: bodyOpened, classBodyDepth: bodyDepth, depth: depthOpened, skipUntil: end, properties: [...state.properties, property] };
  });
  return Object.freeze(state.properties);
};

export const sourceAstSyntaxParser: SourceAstSyntaxParserInterface<PhpMethodAst, PhpClassPropertyAst, TokenDescriptor> = Object.freeze({
  kind: 'source_ast_syntax_parser_interface',
  closed: true,
  parseProperties(tokens: readonly TokenDescriptor[]): readonly PhpClassPropertyAst[] {
    return parsePropertySyntax(tokens);
  },
  parse(files: readonly SourceAstFileEvidence[]): SourceAstSyntaxParseContract<PhpMethodAst, PhpClassPropertyAst, TokenDescriptor> {
    const parsed: SourceAstParsedFile<PhpMethodAst, PhpClassPropertyAst, TokenDescriptor>[] = [];
    for (const evidence of files) {
      const tokens = LaravelSourceLexer.tokenize(evidence.text);
      const classToken = tokens.findIndex(token => sameText(token.value, 'class'));
      const classStart = classToken < 0 ? 0 : classToken + 1;
      const owner = tokens.slice(classStart).find(token => sameText(token.type, 'IDENTIFIER'))?.value ?? path.basename(evidence.path, '.php');
      const methods: PhpMethodAst[] = [];
      tokens.forEach((token, index) => {
        if (!sameText(token.value, 'function')) return;
        const method = parsePhpMethod(evidence.text, tokens, index);
        if (method.kind === 'some') methods.push(method.value);
      });
      let properties: readonly PhpClassPropertyAst[] = [];
      if (sameText(evidence.sourceKind, 'model')) properties = parsePropertySyntax(tokens);
      parsed.push(Object.freeze({
        kind: 'source_ast_parsed_file',
        evidence,
        tokens,
        owner,
        methods: Object.freeze(methods),
        properties: Object.freeze(properties),
        closed: true,
      }));
    }
    return Object.freeze({ kind: 'source_ast_syntax_parse', files: Object.freeze(parsed), closed: true });
  },
});
