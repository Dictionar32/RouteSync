import { describe, expect, it } from 'vitest';
import { LaravelSourceLexer } from '../../LaravelSourceLexer';
import { createAstIdentifier } from '../../lexer/phpAstTypes';
import { controllerActionFromMethod, controllerMethodAttributesFromAttributes, controllerMethodContractFromMethod } from './controllerAstCanonical';
import { controllerProducer } from './controllerProducer';
import { createControllerName, createSourceFile } from '../../../../types/upstream/names';
import { parseControllerDeclaration } from '../../lexer/controllerDeclarationParser';
import { relationVariantFold } from '../../../../semantic/foundation/relationalSequence';

const sequenceToArray = <T>(sequence: import('../../../../types/upstream/collections').Sequence<T>): readonly T[] => relationVariantFold(sequence, 'empty', () => [], value => [value.head, ...sequenceToArray(value.tail)]);

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
    const declaration = parseControllerDeclaration(source, tokens, createAstIdentifier('OrderController'), '<test>');
    expect(declaration.interfaces).toEqual(['HasMiddleware']);
    const middleware = declaration.methods.find(method => method.name === 'middleware');
    const show = declaration.methods.find(method => method.name === 'show');
    expect(middleware?.storage).toBe('static');
    expect(show?.storage).toBe('instance');
    expect(show).toBeDefined();
    const contract = controllerMethodContractFromMethod(show!, 'OrderController', '<test>', { kind: 'response_absent' }, [], [], [], declaration.interfaces, declaration.methods);
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
    const declaration = parseControllerDeclaration(source, tokens, createAstIdentifier('OrderController'), '<test>');
    const show = declaration.methods.find(method => method.name === 'show');
    expect(show).toBeDefined();
    const response = { kind: 'response_absent' as const };
    const produced = controllerProducer.produce({
      declaration: {
        kind: 'controller_declaration_evidence',
        controller: createControllerName('OrderController'),
        attributes: controllerMethodAttributesFromAttributes(declaration.attributes, [], '<test>'),
        inheritedAttributes: { kind: 'empty' },
        interfaces: declaration.interfaces.map(value => ({ kind: 'class_name' as const, value: { kind: 'string_value' as const, value } })),
        methods: [{
          kind: 'controller_method_evidence',
          controller: createControllerName('OrderController'),
          action: controllerActionFromMethod(show!, 'OrderController', '<test>', response, []),
          contract: controllerMethodContractFromMethod(show!, 'OrderController', '<test>', response, [], declaration.attributes, [], declaration.interfaces, declaration.methods),
          source: { kind: 'source_span', file: createSourceFile('<test>'), start: { kind: 'number_value', value: show!.source.startOffset }, end: { kind: 'number_value', value: show!.source.endOffset } },
        }],
        source: { kind: 'source_span', file: createSourceFile('<test>'), start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: source.length } },
      },
      file: createSourceFile('<test>'),
      source: { kind: 'source_span', file: createSourceFile('<test>'), start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: source.length } },
    });
    const contract = sequenceToArray(produced.methods)[0];
    const policies = contract ? sequenceToArray(contract.policy).filter(value => value.kind === 'controller_middleware_relation') : [];
    expect(policies.some(value => value.kind === 'controller_middleware_relation' && value.middleware.kind === 'middleware_name' && value.middleware.value.value === 'auth')).toBe(true);
  });

});
