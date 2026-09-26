import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { LaravelSourceLexer } from '../../core/src/compiler/scanner/LaravelSourceLexer';
import { createAstIdentifier } from '../../core/src/compiler/scanner/lexer/phpAstTypes';
import { scanMiddlewareAsts } from '../../core/src/compiler/scanner/subscanners/middlewareAstCanonical';
import { middlewareProducer } from '../../core/src/compiler/scanner/subscanners/middlewareProducer';
import { controllerActionFromMethod } from '../../core/src/compiler/scanner/subscanners/controller/controllerAstCanonical';
import type { SourceProjectIdentity } from '../../core/src/types/upstream/highLevelSourceModel';
import type { SourceSpan } from '../../core/src/types/upstream/provenance';

// Middleware production is verified independently from controller dataflow.
// The ecommerce handler calls `$next($request)`, whose callable-call lowering
// remains a separate controller-flow concern.
vi.mock('../../core/src/compiler/scanner/subscanners/controller/controllerAstCanonical', () => ({
  controllerActionFromMethod: vi.fn((method, controller, _file, response) => ({
    kind: 'controller_action',
    controller: { kind: 'controller_name', value: { kind: 'string_value', value: controller } },
    action: { kind: 'action_name', value: { kind: 'string_value', value: method.name } },
    response,
  })),
}));

const fixtureRoot = path.resolve(__dirname, '../../..', 'examples/ecommerce-shop-source');
const fixtureFile = path.join(fixtureRoot, 'app/Http/Middleware/AdminMiddleware.php');

const source = (file: string, line: number): SourceSpan => ({
  kind: 'source_span',
  file: { kind: 'source_file', value: { kind: 'string_value', value: file } },
  start: { kind: 'number_value', value: line },
  end: { kind: 'number_value', value: line },
});

const project = (root: string): SourceProjectIdentity => ({
  kind: 'laravel_project',
  root: source(root, 1).file,
  source: source(root, 1),
});

describe('MiddlewareAst producer', () => {
  it('maps the ecommerce AdminMiddleware declaration into the canonical high-level middleware interface', async () => {
    const text = await readFile(fixtureFile, 'utf8');
    const tokens = LaravelSourceLexer.tokenize(text);
    const declaration = LaravelSourceLexer.parseControllerDeclaration(
      text,
      tokens,
      createAstIdentifier('AdminMiddleware'),
    );

    const middleware = middlewareProducer.produce({
      declaration,
      source: source(fixtureFile, Number(declaration.source.line)),
    });

    expect(middleware).toMatchObject({
      kind: 'middleware_ast',
      definition: {
        kind: 'middleware',
        name: { kind: 'class_name', value: { kind: 'string_value', value: 'AdminMiddleware' } },
        file: { kind: 'source_file', value: { kind: 'string_value', value: fixtureFile } },
        handle: {
          kind: 'controller_action',
          controller: { kind: 'controller_name', value: { kind: 'string_value', value: 'AdminMiddleware' } },
          action: { kind: 'action_name', value: { kind: 'string_value', value: 'handle' } },
          response: { kind: 'response_absent' },
        },
      },
      source: source(fixtureFile, 1),
    });
    expect(controllerActionFromMethod).toHaveBeenCalledWith(
      declaration.methods.find(method => method.name === 'handle'),
      'AdminMiddleware',
      fixtureFile,
      { kind: 'response_absent' },
    );
  });

  it('routes discovered middleware syntax through middlewareProducer into SourceAsts-compatible MiddlewareAst values', async () => {
    const middlewares = await scanMiddlewareAsts(project(fixtureRoot));

    expect(middlewares).toHaveLength(1);
    expect(middlewares[0]).toMatchObject({
      kind: 'middleware_ast',
      definition: {
        kind: 'middleware',
        name: { kind: 'class_name', value: { kind: 'string_value', value: 'AdminMiddleware' } },
      },
    });
  });
});
