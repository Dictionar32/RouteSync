import { describe, expect, test } from 'vitest';
import { controllerDeclarationParser } from '../../../frontend/php/controllerDeclarationParser';
import { phpSourceTokenizer } from '../../../frontend/php/tokenizer';
import { createAstIdentifier } from '../../../frontend/php/phpAstTypes';
import { sourceFileIdentityFactory, stringValue } from '../../../../types/upstream/names';
import { laravelControllerInvocationSemanticJudgmentAuthority, laravelControllerInvocationSemanticInputFactory } from '../../../../types/upstream/laravelControllerInvocationSemanticJudgmentAuthority';

describe('Laravel controller parser projection context Phase 1900', () => {
  test('syntax-only projection produces body syntax without fabricating semantic dataflow', () => {
    const source = '<?php class ExampleController { public function show() { return response()->json([]); } }';
    const declaration = controllerDeclarationParser.parseSyntaxOnly(source, phpSourceTokenizer.tokenize(source), createAstIdentifier('ExampleController'), { kind: 'syntax_only' });

    expect(declaration.methods[0]?.body.statements).toHaveLength(1);
    expect(declaration.methods[0]?.body.dataflow).toBeUndefined();
  });

  test('semantic projection derives source identity and integrated response from one canonical judgment', () => {
    const source = '<?php class ExampleController { public function show() { return response()->json([]); } }';
    const judgment = laravelControllerInvocationSemanticJudgmentAuthority.judge(laravelControllerInvocationSemanticInputFactory.withoutPipeline(sourceFileIdentityFactory.create(stringValue.create('/fixtures/ExampleController.php'))));
    const declaration = controllerDeclarationParser.parseWithInvocationJudgment(source, phpSourceTokenizer.tokenize(source), createAstIdentifier('ExampleController'), judgment);

    expect(declaration.methods[0]?.body.dataflow?.invocationSemanticIntegratedResponse.response.phpFunctionInvocations.kind).toBe('php_source_invocation_integration_not_connected');
  });
});
