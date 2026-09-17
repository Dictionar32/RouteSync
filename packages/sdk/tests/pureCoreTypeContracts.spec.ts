import { describe, it, expect } from 'vitest';
import {
  RouteDefinitionDescriptor,
  RequestHeaders,
  RouteParameters,
  RouteQueryParameters,
  RequestPayload,
  RouteSchemaModel,
  ResponseSchemaModel,
  RouteMapperModel,
  SourceRefFactory,
  IRHintsFactory,
  IRRawNodeDescriptor,
  SemanticFieldSet,
  ModelCastCollection,
  ZodObjectShape,
  ModelFieldMap,
  ModelRelationMap,
  ModelAccessorMap,
  RouteTransformMapFactory,
  RouteSchemaMapFactory,
  RouteContractConfigFactory,
  RequestOptionsDescriptor,
  type RouteDefinitionContract
} from '@routesync/core';

describe('Pure Core Type Contracts & Domain Models (Zero Null, Zero ?, Zero Naked Record)', () => {
  describe('1. RequestHeaders Value Object', () => {
    it('provides case-insensitive O(1) lookup and non-nullable returns', () => {
      const headers = RequestHeaders.fromRecord({
        'Content-Type': 'application/json',
        'X-Custom-Token': 'secret123'
      });

      expect(headers.get('content-type')).toBe('application/json');
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('x-custom-token')).toBe('secret123');
      expect(headers.get('non-existent')).toBe(''); // Non-nullable return (0 null, 0 undefined)
      expect(headers.has('content-type')).toBe(true);
      expect(headers.has('authorization')).toBe(false);
    });

    it('supports object spread compatibility for downstream HTTP clients', () => {
      const headers = RequestHeaders.fromRecord({
        'Authorization': 'Bearer token_abc',
        'Accept': 'application/json'
      });

      const spread = { ...headers };
      expect(spread['Authorization']).toBe('Bearer token_abc');
      expect(spread['Accept']).toBe('application/json');
    });

    it('RequestHeaders.empty() produces a safe, frozen instance with zero entries', () => {
      const empty = RequestHeaders.empty();
      expect(empty.get('anything')).toBe('');
      expect(empty.has('anything')).toBe(false);
      expect(Array.from(empty.entries()).length).toBe(0);
      expect(empty.toRecord()).toEqual({});
      expect(Object.isFrozen(empty)).toBe(true);
    });
  });

  describe('2. RouteParameters & RouteQueryParameters Collections', () => {
    it('encapsulates path parameters with type-safe access and spread compatibility', () => {
      const params = RouteParameters.fromRecord({
        id: 42,
        slug: 'tech-article',
        published: true
      });

      expect(params.get('id')).toBe(42);
      expect(params.get('slug')).toBe('tech-article');
      expect(params.get('published')).toBe(true);
      expect(params.get('unknown')).toBeUndefined();
      expect(params.has('id')).toBe(true);
      expect(params.has('missing')).toBe(false);

      const spread = { ...params };
      expect(spread.id).toBe(42);
      expect(spread.slug).toBe('tech-article');
      expect(params.toRecord()).toEqual({ id: 42, slug: 'tech-article', published: true });
    });

    it('RouteParameters.empty() creates a clean, frozen empty collection', () => {
      const empty = RouteParameters.empty();
      expect(empty.entries.length).toBe(0);
      expect(empty.has('id')).toBe(false);
      expect(empty.toRecord()).toEqual({});
      expect(Object.isFrozen(empty)).toBe(true);
    });

    it('encapsulates query parameters including array and scalar values', () => {
      const query = RouteQueryParameters.fromRecord({
        page: 1,
        search: 'laravel',
        tags: ['php', 'typescript']
      });

      expect(query.get('page')).toBe(1);
      expect(query.get('search')).toBe('laravel');
      expect(query.get('tags')).toEqual(['php', 'typescript']);
      expect(query.has('page')).toBe(true);
      expect(query.has('unknown')).toBe(false);
    });

    it('RouteQueryParameters.empty() creates an empty frozen collection', () => {
      const empty = RouteQueryParameters.empty();
      expect(empty.entries.length).toBe(0);
      expect(empty.toRecord()).toEqual({});
      expect(Object.isFrozen(empty)).toBe(true);
    });
  });

  describe('3. RequestPayload Value Object', () => {
    it('encapsulates body properties with hasProperties signaling and spread compatibility', () => {
      const payload = RequestPayload.fromRecord({
        title: 'New Post',
        price: 99.5
      });

      expect(payload.hasProperties()).toBe(true);
      expect(payload.get('title')).toBe('New Post');
      expect(payload.get('price')).toBe(99.5);
      expect(payload.has('title')).toBe(true);
      expect(payload.has('missing')).toBe(false);

      const spread = { ...payload };
      expect(spread.title).toBe('New Post');
      expect(payload.toRecord()).toEqual({ title: 'New Post', price: 99.5 });
    });

    it('RequestPayload.empty() signals zero properties without null', () => {
      const empty = RequestPayload.empty();
      expect(empty.hasProperties()).toBe(false);
      expect(empty.properties.length).toBe(0);
      expect(empty.get('anything')).toBeUndefined();
      expect(empty.toRecord()).toEqual({});
      expect(Object.isFrozen(empty)).toBe(true);
    });
  });

  describe('4. RouteDefinitionDescriptor (Complete Contract: 0 ?, 0 null)', () => {
    it('constructs with 100% direct assignment and complete non-nullable contract', () => {
      const headers = RequestHeaders.fromRecord({ 'X-Api-Version': 'v2' });
      const params = RouteParameters.fromRecord({ orderId: 101 });
      const query = RouteQueryParameters.fromRecord({ tab: 'details' });
      const body = RequestPayload.fromRecord({ note: 'urgent' });
      const schema = RouteSchemaModel.empty();
      const responseSchema = ResponseSchemaModel.empty();
      const contract = Object.freeze({ body: (v: unknown) => v });
      const mapper = RouteMapperModel.identity();

      const desc = new RouteDefinitionDescriptor({
        method: 'POST',
        path: '/orders/:orderId',
        auth: true,
        headers,
        params,
        query,
        body,
        schema,
        responseSchema,
        contract,
        mapper,
        cache: false,
        retry: false
      });

      expect(desc.method).toBe('POST');
      expect(desc.path).toBe('/orders/:orderId');
      expect(desc.auth).toBe(true);
      expect(desc.headers).toBe(headers);
      expect(desc.params).toBe(params);
      expect(desc.query).toBe(query);
      expect(desc.body).toBe(body);
      expect(desc.schema).toBe(schema);
      expect(desc.responseSchema).toBe(responseSchema);
      expect(desc.contract).toBe(contract);
      expect(desc.mapper).toBe(mapper);
      expect(desc.cache).toBe(false);
      expect(desc.retry).toBe(false);
      expect(Object.isFrozen(desc)).toBe(true);
    });

    it('static factory .fromMinimal() fills complete default values with zero null and zero undefined', () => {
      const desc = RouteDefinitionDescriptor.fromMinimal({
        method: 'GET',
        path: '/health'
      });

      expect(desc.method).toBe('GET');
      expect(desc.path).toBe('/health');
      expect(desc.auth).toBe(false);
      expect(desc.headers instanceof RequestHeaders).toBe(true);
      expect(desc.headers.toRecord()).toEqual({});
      expect(desc.params instanceof RouteParameters).toBe(true);
      expect(desc.params.entries.length).toBe(0);
      expect(desc.query instanceof RouteQueryParameters).toBe(true);
      expect(desc.query.entries.length).toBe(0);
      expect(desc.body instanceof RequestPayload).toBe(true);
      expect(desc.body.hasProperties()).toBe(false);
      expect(desc.schema.parse('input')).toBe('input');
      expect(desc.responseSchema.parse('res')).toBe('res');
      expect(desc.cache).toBe(false);
      expect(desc.retry).toBe(false);
    });
  });

  describe('5. Semantic Domain Collections (SemanticFieldSet, ModelCastCollection, ZodObjectShape)', () => {
    it('SemanticFieldSet encapsulates field type definitions with O(1) lookup', () => {
      const fields = SemanticFieldSet.fromRecord({
        id: 'number',
        email: 'string',
        is_verified: 'boolean'
      });

      expect(fields.getType('id')).toBe('number');
      expect(fields.getType('email')).toBe('string');
      expect(fields.getType('is_verified')).toBe('boolean');
      expect(fields.getType('missing')).toBeUndefined();
      expect(fields.hasField('email')).toBe(true);
      expect(fields.hasField('missing')).toBe(false);
      expect(fields.toRecord()).toEqual({ id: 'number', email: 'string', is_verified: 'boolean' });
    });

    it('ModelCastCollection encapsulates eloquent casts with O(1) lookup', () => {
      const casts = ModelCastCollection.fromRecord({
        created_at: 'datetime',
        settings: 'json'
      });

      expect(casts.getCast('created_at')).toBe('datetime');
      expect(casts.getCast('settings')).toBe('json');
      expect(casts.getCast('unknown')).toBeUndefined();
      expect(casts.hasCast('settings')).toBe(true);
      expect(casts.hasCast('unknown')).toBe(false);
      expect(casts.toRecord()).toEqual({ created_at: 'datetime', settings: 'json' });
    });

    it('ZodObjectShape encapsulates Zod properties with O(1) lookup', () => {
      const shape = ZodObjectShape.fromRecord({
        title: { kind: 'zod_string' },
        views: { kind: 'zod_number' }
      });

      expect(shape.getProperty('title')).toEqual({ kind: 'zod_string' });
      expect(shape.getProperty('views')).toEqual({ kind: 'zod_number' });
      expect(shape.has('title')).toBe(true);
      expect(shape.has('missing')).toBe(false);
    });
  });

  describe('6. Catamorphic Pattern Matcher (matchParsedAST: 0 if, 0 switch)', () => {
    const dummyVisitor: ParsedASTVisitor<string> = {
      root: (n) => `root:${n.identifier}`,
      variable: (n) => `var:${n.name}`,
      property_access: (n) => `prop:${n.property}`,
      method_call: (n) => `call:${n.name}`,
      binary_expression: (n) => `binary:${n.operator}`,
      type_cast: (n) => `cast:${n.castType}`,
      ternary: () => 'ternary',
      literal: (n) => `lit:${String(n.value)}`,
      null_literal: () => 'null_literal',
      nullsafe_chain: () => 'nullsafe_chain',
      unknown: (n) => `unknown:${n.code}`,
      primitive: (n) => `prim:${n.type}`,
      resource: (n) => `res:${n.resource}`,
      model: (n) => `model:${n.model}`,
      static_method_call: (n) => `static:${n.name}`,
      nullsafe_property_access: (n) => `nullsafe_prop:${n.property}`,
      new_instance: () => 'new_instance'
    };

    it('dispatches deterministically to root visitor', () => {
      const node = RootASTNodeFactory.create('queryBuilder');
      expect(matchParsedAST(node, dummyVisitor)).toBe('root:queryBuilder');
    });

    it('dispatches deterministically to variable visitor', () => {
      const node: VariableAST = { kind: 'variable', name: '$user' };
      expect(matchParsedAST(node, dummyVisitor)).toBe('var:$user');
    });

    it('dispatches deterministically to literal visitor', () => {
      const node: LiteralAST = { kind: 'literal', value: 123 };
      expect(matchParsedAST(node, dummyVisitor)).toBe('lit:123');
    });

    it('dispatches deterministically to null_literal visitor', () => {
      const node: NullLiteralAST = { kind: 'null_literal' };
      expect(matchParsedAST(node, dummyVisitor)).toBe('null_literal');
    });

    it('dispatches deterministically to property_access visitor with non-null target', () => {
      const node: PropertyAccessAST = {
        kind: 'property_access',
        target: RootASTNodeFactory.create('user'),
        property: 'email',
        accessKind: 'property_access'
      };
      expect(matchParsedAST(node, dummyVisitor)).toBe('prop:email');
    });

    it('dispatches deterministically to method_call visitor with non-null target', () => {
      const node: MethodCallAST = {
        kind: 'method_call',
        target: RootASTNodeFactory.create('user'),
        name: 'getAttribute',
        args: []
      };
      expect(matchParsedAST(node, dummyVisitor)).toBe('call:getAttribute');
    });
  });

  describe('7. SourceRefFactory & IRHintsFactory (Deterministic Defaults)', () => {
    it('creates SourceRef with non-nullable coordinate defaults', () => {
      const ref = SourceRefFactory.unknown('app/Http/Controllers/OrderController.php', 'controller');
      expect(ref.file).toBe('app/Http/Controllers/OrderController.php');
      expect(ref.line).toBe(0);
      expect(ref.column).toBe(0);
      expect(ref.context).toBe('controller');
      expect(Object.isFrozen(ref)).toBe(true);
    });

    it('creates IRHints with non-nullable confidence and defaults', () => {
      const hints = IRHintsFactory.empty('method_call');
      expect(hints.pattern).toBe('method_call');
      expect(hints.confidence).toBe(1.0);
      expect(hints.nullable).toBe(false);
      expect(hints.framework_context).toBe('unknown');
      expect(Object.isFrozen(hints)).toBe(true);
    });

    it('constructs IRRawNodeDescriptor with guaranteed non-nullable hints', () => {
      const raw = IRRawNodeDescriptor.fromRawCode('$model->save()');
      expect(raw.kind).toBe('raw_code');
      expect(raw.code).toBe('$model->save()');
      expect(raw.hints.confidence).toBe(1.0);
      expect(Object.isFrozen(raw)).toBe(true);
    });
  });

  describe('8. Semantic Domain Collection Maps (Pure Encapsulated ADT, 0 any, 0 Naked Record)', () => {
    it('ModelFieldMap provides encapsulated non-nullable lookup, size, and iterator', () => {
      const fields = ModelFieldMap.fromRecord({
        id: { type: 'number', nullable: false },
        title: { type: 'string', nullable: true }
      });
      expect(fields.get('id')).toEqual({ type: 'number', nullable: false });
      expect(fields.has('title')).toBe(true);
      expect(fields.has('missing')).toBe(false);
      expect(fields.size).toBe(2);
      expect(Object.isFrozen(fields)).toBe(true);

      const collected: string[] = [];
      for (const entry of fields) {
        collected.push(entry.column);
      }
      expect(collected).toEqual(['id', 'title']);

      const rec = fields.toRecord();
      expect(rec.id).toEqual({ type: 'number', nullable: false });
      expect(rec.title).toEqual({ type: 'string', nullable: true });
    });

    it('ModelRelationMap provides encapsulated non-nullable lookup and iterator', () => {
      const rels = ModelRelationMap.fromRecord({
        items: { type: 'hasMany', model: 'OrderItem' }
      });
      expect(rels.get('items')).toEqual({ type: 'hasMany', model: 'OrderItem' });
      expect(rels.has('items')).toBe(true);
      expect(rels.size).toBe(1);
      expect(Object.isFrozen(rels)).toBe(true);

      const collectedRels = Array.from(rels).map(r => r.relationName);
      expect(collectedRels).toEqual(['items']);
      expect(rels.toRecord().items).toEqual({ type: 'hasMany', model: 'OrderItem' });
    });

    it('ModelAccessorMap provides encapsulated non-nullable lookup and iterator', () => {
      const accessors = ModelAccessorMap.fromRecord({
        fullName: { source: SourceRefFactory.unknown(), ast: {}, semantic: {} }
      });
      expect(accessors.has('fullName')).toBe(true);
      expect(accessors.get('fullName')).toBeDefined();
      expect(accessors.size).toBe(1);
      expect(Object.isFrozen(accessors)).toBe(true);
    });

    it('RequestOptionsDescriptor provides frozen defaults with 0 ? and 0 null', () => {
      const opts = RequestOptionsDescriptor.empty();
      expect(opts.params.entries.length).toBe(0);
      expect(opts.headers.get('accept')).toBe('');
      expect(opts.timeoutMs).toBe(0);
      expect(opts.signal).toBeDefined();
      expect(Object.isFrozen(opts)).toBe(true);
    });

    it('RouteTransformMapFactory provides 0 ? complete identity transforms', () => {
      const transform = RouteTransformMapFactory.empty();
      expect(transform.params('foo')).toBe('foo');
      expect(transform.query('bar')).toBe('bar');
      expect(transform.body({ a: 1 })).toEqual({ a: 1 });
      expect(transform.request('req')).toBe('req');
      expect(transform.response('resp')).toBe('resp');
      expect(Object.isFrozen(transform)).toBe(true);
    });
  });
});
