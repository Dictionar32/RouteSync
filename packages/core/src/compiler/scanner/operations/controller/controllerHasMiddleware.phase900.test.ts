import { describe, expect, it } from 'vitest';
import { LaravelSourceLexer } from '../../LaravelSourceLexer';
import { createAstIdentifier } from '../../../frontend/php/phpAstTypes';
import { controllerAstCanonicalOperations } from './controllerAstCanonical';
import { controllerProducer } from './controllerProducer';
import type { ControllerReturnExpressionEvidence } from '../../../../types/upstream/controllerEvidence';
import { createControllerName, sourceFileIdentityFactory, stringValue } from '../../../../types/upstream/names';
import { laravelSourceIdentitySemantics } from '../../../../types/upstream/sourceProjectIdentity';
import type { PhpSourceInvocationSemanticPipelineCompositionEvidence } from '../../../../types/upstream/phpSourceInvocationSemanticPipelineInterface';
import { controllerDeclarationParser } from '../../../frontend/php/controllerDeclarationParser';
import { relationVariantFold } from '../../../../semantic/relations/relationalSequence';

const sequenceToArray = <T>(sequence: import('../../../../types/upstream/collections').Sequence<T>): readonly T[] => relationVariantFold(sequence, 'empty', () => [], value => [value.head, ...sequenceToArray(value.tail)]);

const notConnectedPipelineEvidence = (): Extract<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }> => {
  type Evidence = Extract<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }>;
  let evidence: Evidence;
  evidence = Object.freeze({
    kind: 'php_source_invocation_pipeline_not_connected',
    continueWith: <Result>(handlers: import('../../../../types/upstream/phpSourceInvocationSemanticPipelineInterface').PhpSourceInvocationSemanticPipelineCompositionEvidenceHandlers<Result>): Result => handlers.onNotConnected(evidence),
  });
  return evidence;
};

describe('Phase 900 controller HasMiddleware upstream evidence', () => {
  it('preserves static middleware() and projects return-array middleware with only/except', () => {
    const source = `class OrderController implements HasMiddleware {
      public static function middleware(): array {
        return ['auth', new Middleware('log', only: ['show']), new Middleware('subscribed', except: ['store'])];
      }
      public function show() {}
      public function store() {}
    }`;
    const tokens = LaravelSourceLexer.tokenize(source);
    const declaration = controllerDeclarationParser.parseSyntaxOnly(source, tokens, createAstIdentifier('OrderController'), { kind: 'syntax_only' });
    expect(declaration.interfaces).toEqual(['HasMiddleware']);
    const middleware = declaration.methods.find(method => method.name === 'middleware');
    const show = declaration.methods.find(method => method.name === 'show');
    expect(middleware?.storage).toBe('static');
    expect(show?.storage).toBe('instance');
    expect(show).toBeDefined();
    const contract = controllerAstCanonicalOperations.controllerMethodContractFromMethod(show!, 'OrderController', '<test>', { kind: 'response_reference_not_declared' }, [], [], [], declaration.interfaces, declaration.methods);
    const policies = sequenceToArray(contract.policy).filter(value => value.kind === 'controller_middleware_relation');
    expect(policies.map(value => value.origin.kind)).toContain('has_middleware');
    expect(policies.some(value => value.kind === 'controller_middleware_relation' && value.middleware.kind === 'middleware_name' && value.middleware.value.value === 'auth')).toBe(true);
    expect(policies.some(value => value.kind === 'controller_middleware_relation' && value.actions.kind === 'only' && value.actions.actions.kind === 'cons')).toBe(true);
    expect(policies.some(value => value.kind === 'controller_middleware_relation' && value.actions.kind === 'except' && value.actions.actions.kind === 'cons')).toBe(true);
  });

  it('keeps HasMiddleware evidence through the executable controller producer', () => {
    const source = `class OrderController implements HasMiddleware {
      public static function middleware(): array { return ['auth']; }
      public function show() {}
    }`;
    const tokens = LaravelSourceLexer.tokenize(source);
    const declaration = controllerDeclarationParser.parseSyntaxOnly(source, tokens, createAstIdentifier('OrderController'), { kind: 'syntax_only' });
    const show = declaration.methods.find(method => method.name === 'show');
    expect(show).toBeDefined();
    const response = { kind: 'response_reference_not_declared' as const };
    const produced = controllerProducer.produce({
      declaration: {
        kind: 'controller_declaration_evidence',
        controller: createControllerName('OrderController'),
        attributes: controllerAstCanonicalOperations.controllerMethodAttributesFromAttributes(declaration.attributes, [], { kind: 'syntax_only' }),
        inheritedAttributes: { kind: 'empty' },
        interfaces: declaration.interfaces.map(value => ({ kind: 'class_name' as const, value: { kind: 'string_value' as const, value } })),
        methods: [{
          kind: 'controller_method_evidence',
          controller: createControllerName('OrderController'),
          action: controllerAstCanonicalOperations.controllerActionFromMethod(show!, 'OrderController', '<test>', response, []),
          contract: controllerAstCanonicalOperations.controllerMethodContractFromMethod(show!, 'OrderController', '<test>', response, [], declaration.attributes, [], declaration.interfaces, declaration.methods),
          source: { kind: 'source_span', file: sourceFileIdentityFactory.create(stringValue.create('<test>')), start: { kind: 'number_value', value: show!.source.startOffset }, end: { kind: 'number_value', value: show!.source.endOffset } },
          returnExpressions: Object.freeze(show!.returns.map((returnStatement): ControllerReturnExpressionEvidence => Object.freeze({
            kind: 'controller_return_expression_evidence',
            source: { kind: 'source_span' as const, file: sourceFileIdentityFactory.create(stringValue.create('<test>')), start: { kind: 'number_value' as const, value: returnStatement.source.startOffset }, end: { kind: 'number_value' as const, value: returnStatement.expression.source.endOffset } },
            expressionSource: { kind: 'source_span' as const, file: sourceFileIdentityFactory.create(stringValue.create('<test>')), start: { kind: 'number_value' as const, value: returnStatement.expression.source.startOffset }, end: { kind: 'number_value' as const, value: returnStatement.expression.source.endOffset } },
            expressionKind: returnStatement.expression.kind,
          }))),
        }],
        source: { kind: 'source_span', file: sourceFileIdentityFactory.create(stringValue.create('<test>')), start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: source.length } },
      },
      invocationJudgment: {
        kind: 'laravel_controller_invocation_semantic_judgment',
        contractVersion: 3,
        sourceFile: sourceFileIdentityFactory.create(stringValue.create('<test>')),
        response: { kind: 'php_source_invocation_integration_not_connected', evidence: notConnectedPipelineEvidence() },
        relateSourceFileIdentity: (candidate: SourceFile) => laravelSourceIdentitySemantics.relateSourceFiles(sourceFileIdentityFactory.create(stringValue.create('<test>')), candidate),
      },
    });
    const contract = sequenceToArray(produced.methods)[0];
    const policies = contract ? sequenceToArray(contract.policy).filter(value => value.kind === 'controller_middleware_relation') : [];
    expect(policies.some(value => value.kind === 'controller_middleware_relation' && value.middleware.kind === 'middleware_name' && value.middleware.value.value === 'auth')).toBe(true);
  });

});
