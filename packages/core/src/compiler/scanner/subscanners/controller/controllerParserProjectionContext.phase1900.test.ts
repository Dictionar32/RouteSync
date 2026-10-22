import { describe, expect, test } from 'vitest';
import { parseControllerDeclaration } from '../../lexer/controllerDeclarationParser';
import { phpSourceTokenizer } from '../../lexer/tokenizer';
import { createAstIdentifier } from '../../lexer/phpAstTypes';
import { createSourceFile } from '../../../../types/upstream/names';
import { laravelControllerInvocationSemanticJudgmentAuthority } from '../../../../types/upstream/laravelControllerInvocationSemanticJudgmentAuthority';

describe('Laravel controller parser projection context Phase 1900', () => {
  test('syntax-only projection produces body syntax without fabricating semantic dataflow', () => {
    const source = '<?php class ExampleController { public function show() { return response()->json([]); } }';
    const declaration = parseControllerDeclaration(source, phpSourceTokenizer.tokenize(source), createAstIdentifier('ExampleController'), { kind: 'syntax_only' });

    expect(declaration.methods[0]?.body.statements).toHaveLength(1);
    expect(declaration.methods[0]?.body.dataflow).toBeUndefined();
  });

  test('semantic projection derives source identity and integrated response from one canonical judgment', () => {
    const source = '<?php class ExampleController { public function show() { return response()->json([]); } }';
    const judgment = laravelControllerInvocationSemanticJudgmentAuthority.judge({
      kind: 'controller_invocation_pipeline_not_provided',
      sourceFile: createSourceFile('/fixtures/ExampleController.php'),
    });
    const declaration = parseControllerDeclaration(source, phpSourceTokenizer.tokenize(source), createAstIdentifier('ExampleController'), {
      kind: 'invocation_semantic_judgment',
      judgment,
    });

    expect(declaration.methods[0]?.body.dataflow?.invocationSemanticIntegratedResponse.response.phpFunctionInvocations.kind).toBe('php_source_invocation_integration_not_connected');
  });
});
