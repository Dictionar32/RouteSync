import path from 'path';
import type { ResponseAst } from '../../../types/upstream/ast';
import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import type { ResponseDtoDeclarationAst } from '../lexer/responseDtoAstTypes';
import { responseProducer } from './responseProducer';
import type { SourceSpan } from '../../../types/upstream/provenance';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { collectPhpFiles } from './scannerUtils';

import { readSourceText } from './scannerUtils';
import { relationEqual } from '../../../semantic/kernel/semanticRelations';
import { relationGate, relationAsyncFold, relationFirst, relationOptionFold, relationProject, relationSelect, relationSome, relationNone } from '../../../semantic/kernel/relationalSequence';
const span = (file: string, line: number): SourceSpan => ({
  kind: 'source_span',
  file: { kind: 'source_file', value: stringValue(file) },
  start: { kind: 'number_value', value: line },
  end: { kind: 'number_value', value: line },
});

function primitiveType(name: PhpPropertyTypeAst['name']): TypeExpression {
  const candidates: readonly { readonly name: PhpPropertyTypeAst['name']; readonly value: TypeExpression }[] = [
    { name: 'bool', value: { kind: 'primitive', value: { kind: 'boolean' } } },
    { name: 'int', value: { kind: 'primitive', value: { kind: 'number' } } },
    { name: 'float', value: { kind: 'primitive', value: { kind: 'number' } } },
    { name: 'string', value: { kind: 'primitive', value: { kind: 'string' } } },
  ];
  return relationOptionFold(
    relationFirst(candidates, candidate => relationEqual(candidate.name, name)),
    () => ({ kind: 'mixed' }),
    candidate => candidate.value,
  );
}

function typeExpression(type: PhpPropertyTypeAst): TypeExpression {
  const value = relationGate(relationEqual(type.kind, 'primitive'),
    () => primitiveType(type.name),
    () => relationGate(relationEqual(type.kind, 'mixed'),
      () => ({ kind: 'mixed' } as const),
      () => ({ kind: 'reference', value: { kind: 'class', name: { kind: 'class_name', value: stringValue(type.name) } } } as const)));
  return relationGate(type.nullable, () => ({ kind: 'nullable', value }), () => value);
}

const defaultResponseStatus: HttpStatusCode = {
  kind: 'http_status_code',
  value: { kind: 'number_value', value: 200 },
};

const emptyTransport = (): import('../../../types/upstream/response').ResponseTransport => ({
  kind: 'response_transport',
  headers: { kind: 'empty' },
  cookies: { kind: 'empty' },
});

function definition(ast: ResponseDtoDeclarationAst, file: string): ResponseAst {
  return responseProducer.produce({ kind: 'dto', declaration: ast, source: span(file, Number(ast.source.line)) });
}

function className(tokens: readonly { readonly value: string }[]): string {
  const seek = (index: number): ReturnType<typeof relationNone<string>> | ReturnType<typeof relationSome<string>> => relationGate(index + 1 < tokens.length,
    () => relationGate(relationEqual(tokens[index].value, 'class'), () => relationSome(tokens[index + 1].value), () => seek(index + 1)),
    () => relationNone());
  return relationOptionFold(seek(0),
    () => { throw Error('Response DTO class declaration not found'); },
    value => value);
}

async function scanFiles(files: readonly string[], asts: readonly ResponseAst[]): Promise<readonly ResponseAst[]> {
  return relationAsyncFold(files, asts, async (current, file) => {
    const source = await readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(source);
    const ast = LaravelSourceLexer.parseResponseDtoDeclaration(tokens, createAstIdentifier(className(tokens)));
    return Object.freeze([...current, definition(ast, file)]);
  });
}

async function scanControllerFiles(files: readonly string[], asts: readonly ResponseAst[]): Promise<readonly ResponseAst[]> {
  return relationAsyncFold(files, asts, async (current, file) => {
    const source = await readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(source);
    const declaration = LaravelSourceLexer.parseControllerDeclaration(source, tokens, createAstIdentifier(path.basename(file, '.php')));
    const produced = relationProject(relationSelect(declaration.methods, method => relationGate(relationEqual(method.returns.length, 0), () => false, () => true)), method =>
      responseProducer.produce({ kind: 'controller', method, source: span(file, Number(method.source.line)) }));
    return Object.freeze([...current, ...produced]);
  });
}

export async function scanResponseAsts(sourceProject: SourceProjectIdentity): Promise<readonly ResponseAst[]> {
  const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'app', 'Http', 'DTOs');
  const controllerDirectory = path.join(sourceRoot, 'app', 'Http', 'Controllers');
  const files = await collectPhpFiles(directory);
  const controllerFiles = await collectPhpFiles(controllerDirectory);
  const dtoAsts = await scanFiles(files, Object.freeze([]));
  return Object.freeze(await scanControllerFiles(controllerFiles, dtoAsts));
}
