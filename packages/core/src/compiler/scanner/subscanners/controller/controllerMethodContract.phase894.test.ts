import { describe, expect, it } from 'vitest';
import { tokenizePhpSource } from '../../lexer/tokenizer';
import { parseControllerMethod } from '../../lexer/controllerMethodParser';
import { parseControllerDeclaration } from '../../lexer/controllerDeclarationParser';
import { controllerMethodContractFromMethod, controllerQueryOperations } from './controllerAstCanonical';
import type { QueryAst } from '../../../../types/upstream/query';
import type { ControllerMethodAst } from '../../lexer/controllerAstTypes';

describe('phase 894 controller method upstream contract', () => {
  it('captures Laravel-style method attributes as syntax evidence and projects implicit PHP visibility to public', () => {
    const source = `class OrderController { #[Middleware('auth')] #[Authorize('update', [Order::class])] public function show(Order $order) { return new OrderResource($order); } }`;
    const tokens = tokenizePhpSource(source);
    const functionIndex = tokens.findIndex(token => token.value === 'function');
    const parsed = parseControllerMethod(source, tokens, functionIndex, '<test>');
    expect(parsed.kind).toBe('some');
    if (parsed.kind !== 'some') return;
    expect(parsed.value.attributes).toHaveLength(2);
    expect(parsed.value.attributes[0]?.name.value).toBe('Middleware');
    expect(parsed.value.attributes[1]?.name.value).toBe('Authorize');
    expect(parsed.value.visibility).toBe('public');
    const contract = controllerMethodContractFromMethod(parsed.value, 'OrderController', '<test>', { kind: 'response_absent' });
    expect(contract.attributes.kind).toBe('cons');
    if (contract.attributes.kind !== 'cons') return;
    expect(contract.attributes.head.name.value).toBe('Middleware');
    expect(contract.attributes.tail.kind).toBe('cons');
    if (contract.attributes.tail.kind !== 'cons') return;
    expect(contract.attributes.tail.head.name.value).toBe('Authorize');
  });


  it('carries class-scoped controller attributes into method contracts with provenance', () => {
    const source = `#[Middleware('auth')] class OrderController { #[Authorize('update', [Order::class])] public function show(Order $order) {} }`;
    const tokens = tokenizePhpSource(source);
    const declaration = parseControllerDeclaration(source, tokens, { kind: 'ast_identifier', value: 'OrderController' }, '<test>');
    const method = declaration.methods[0];
    expect(method).toBeDefined();
    if (!method) return;
    const contract = controllerMethodContractFromMethod(method, 'OrderController', '<test>', { kind: 'response_absent' }, [], declaration.attributes);
    expect(contract.attributes.kind).toBe('cons');
    if (contract.attributes.kind !== 'cons') return;
    expect(contract.attributes.head.scope).toEqual({ kind: 'class' });
    expect(contract.attributes.head.name.value).toBe('Middleware');
    expect(contract.attributes.tail.kind).toBe('cons');
    if (contract.attributes.tail.kind !== 'cons') return;
    expect(contract.attributes.tail.head.scope).toEqual({ kind: 'method' });
    expect(contract.attributes.tail.head.name.value).toBe('Authorize');
  });

  it('projects controller middleware, exclusions, action scopes, and authorization as policy relations', () => {
    const source = `#[Middleware('auth', only: ['show'])] #[WithoutMiddleware('subscribed', except: ['index'])] class OrderController { #[Authorize('update', [Order::class, 'owner'])] public function show(Order $order) {} }`;
    const tokens = tokenizePhpSource(source);
    const declaration = parseControllerDeclaration(source, tokens, { kind: 'ast_identifier', value: 'OrderController' }, '<test>');
    const method = declaration.methods[0];
    expect(method).toBeDefined();
    if (!method) return;
    const contract = controllerMethodContractFromMethod(method, 'OrderController', '<test>', { kind: 'response_absent' }, [], declaration.attributes);
    const policy = [];
    let cursor = contract.policy;
    while (cursor.kind === 'cons') { policy.push(cursor.head); cursor = cursor.tail; }
    expect(policy.map(item => item.kind)).toEqual(['controller_middleware_relation', 'controller_middleware_relation', 'controller_authorization_relation']);
    expect(policy[0]).toMatchObject({ middleware: { kind: 'middleware_name', value: { value: 'auth' } }, exclusion: false, actions: { kind: 'only' } });
    expect(policy[1]).toMatchObject({ middleware: { kind: 'middleware_name', value: { value: 'subscribed' } }, exclusion: true, actions: { kind: 'except' } });
    expect(policy[2]).toMatchObject({ scope: { kind: 'method' }, arguments: { kind: 'expression_arguments' } });
  });

  it('projects only canonical resource/response operation evidence and preserves HTTP failure status', () => {
    const source = `function show(Order $order) { abort(404); return new OrderResource($order); }`;
    const tokens = tokenizePhpSource(source);
    const functionIndex = tokens.findIndex(token => token.value === 'function');
    const parsed = parseControllerMethod(source, tokens, functionIndex, '<test>');
    expect(parsed.kind).toBe('some');
    if (parsed.kind !== 'some') return;
    const contract = controllerMethodContractFromMethod(parsed.value, 'OrderController', '<test>', { kind: 'response_absent' });
    expect(contract.visibility).toEqual({ kind: 'public' });
    expect(contract.failure.kind).toBe('http_abort');
    expect(contract.failure.kind === 'http_abort' && contract.failure.status.value.value).toBe(404);
  });

  it('derives model query/write and literal database-table operations only from query evidence inside the method span', () => {
    const source = `function store(Order $order) { Order::create(['id' => $order->id]); DB::table('orders'); }`;
    const tokens = tokenizePhpSource(source);
    const functionIndex = tokens.findIndex(token => token.value === 'function');
    const parsed = parseControllerMethod(source, tokens, functionIndex, '<test>');
    expect(parsed.kind).toBe('some');
    if (parsed.kind !== 'some') return;
    const method = parsed.value as ControllerMethodAst;
    const span = {
      kind: 'source_span' as const,
      file: { kind: 'source_file' as const, value: { kind: 'string_value' as const, value: '<test>' } },
      start: { kind: 'number_value' as const, value: 0 },
      end: { kind: 'number_value' as const, value: source.length },
    };
    const knownModel = { kind: 'known' as const, name: { kind: 'model_name' as const, value: { kind: 'string_value' as const, value: 'Order' } } };
    const queries: QueryAst[] = [
      { kind: 'query_ast', model: knownModel, source: span, operations: { kind: 'cons', head: { kind: 'model_static', operation: { kind: 'create', values: {} as never } }, tail: { kind: 'empty' } }, expression: {} as never, nestedQueries: [] },
      { kind: 'query_ast', model: { kind: 'indeterminate' }, source: span, operations: { kind: 'cons', head: { kind: 'database_table', expression: { kind: 'literal', value: { kind: 'string_literal', value: { kind: 'string_value', value: 'orders' } }, source: span } }, tail: { kind: 'empty' } }, expression: {} as never, nestedQueries: [] },
    ];
    const operations = controllerQueryOperations(method, '<test>', queries);
    expect(operations.map(operation => operation.kind === 'model_write' ? `${operation.kind}:${operation.model.value.value}` : operation.kind === 'database_table' ? `${operation.kind}:${operation.table.value.value}` : operation.kind)).toEqual(['model_write:Order', 'database_table:orders']);
  });

});