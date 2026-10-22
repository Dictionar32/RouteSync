import type { SourceAstFileEvidence } from './sourceAstEvidenceAcquisitionInterface';

/** Syntax-only parse result. The upstream contract is independent of a concrete parser AST vocabulary. */
export interface SourceAstParsedFile<MethodSyntax, PropertySyntax, TokenSyntax> {
  readonly kind: 'source_ast_parsed_file';
  readonly evidence: SourceAstFileEvidence;
  readonly tokens: readonly TokenSyntax[];
  readonly owner: string;
  readonly methods: readonly MethodSyntax[];
  readonly properties: readonly PropertySyntax[];
  readonly closed: true;
}

export interface SourceAstSyntaxParseContract<MethodSyntax, PropertySyntax, TokenSyntax> {
  readonly kind: 'source_ast_syntax_parse';
  readonly files: readonly SourceAstParsedFile<MethodSyntax, PropertySyntax, TokenSyntax>[];
  readonly closed: true;
}

/** Parses syntax evidence only; semantic meaning is assigned by upstream reasoning producers. */
export interface SourceAstSyntaxParserInterface<MethodSyntax, PropertySyntax, TokenSyntax> {
  readonly kind: 'source_ast_syntax_parser_interface';
  readonly closed: true;
  parse(files: readonly SourceAstFileEvidence[]): SourceAstSyntaxParseContract<MethodSyntax, PropertySyntax, TokenSyntax>;
  /** Parses already-tokenized property syntax through the same owned syntax boundary. */
  parseProperties(tokens: readonly TokenSyntax[]): readonly PropertySyntax[];
}
