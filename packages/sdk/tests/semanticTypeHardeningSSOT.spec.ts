import { describe, it, expect } from 'vitest';
import {
  createSourceLineNumber,
  createSourceColumnNumber,
  createConfidenceScore,
  createModelNodeName,
  createServiceNodeName,
  createControllerNodeName,
  SourceRefFactory,
  RootASTNodeFactory,
  matchParsedAST,
  SemanticFieldSet,
  ModelCastCollection,
  IRHintsFactory,
  IRRawNodeDescriptor,
  type ParsedASTVisitor
} from '@routesync/core';

describe('Semantic Type Hardening & Level 7 Constructors SSOT', () => {
  it('enforces nominal boundaries and branded atoms for semantic coordinates', () => {
    const line = createSourceLineNumber(42);
    const col = createSourceColumnNumber(15);
    const negativeLine = createSourceLineNumber(-10);
    const confidence = createConfidenceScore(0.85);
    const clampedUpper = createConfidenceScore(1.5);
    const clampedLower = createConfidenceScore(-0.5);

    expect(line).toBe(42);
    expect(col).toBe(15);
    expect(negativeLine).toBe(1);
    expect(confidence).toBe(0.85);
    expect(clampedUpper).toBe(1.0);
    expect(clampedLower).toBe(0.0);

    const modelName = createModelNodeName('  Order  ');
    const serviceName = createServiceNodeName(' PaymentService ');
    const controllerName = createControllerNodeName(' ApiController ');

    expect(modelName).toBe('Order');
    expect(serviceName).toBe('PaymentService');
    expect(controllerName).toBe('ApiController');
  });

  it('constructs frozen provenance nodes and IR hints without undefined leaks', () => {
    const ref = SourceRefFactory.create('app/Models/User.php', 'model', 12, 4);
    expect(Object.isFrozen(ref)).toBe(true);
    expect(ref.file).toBe('app/Models/User.php');
    expect(ref.context).toBe('model');
    expect(ref.line).toBe(12);
    expect(ref.column).toBe(4);

    const unknownRef = SourceRefFactory.unknown();
    expect(Object.isFrozen(unknownRef)).toBe(true);
    expect(unknownRef.line).toBe(0);

    const rootNode = RootASTNodeFactory.create('rootExpr', ref);
    expect(Object.isFrozen(rootNode)).toBe(true);
    expect(rootNode.kind).toBe('root');
    expect(rootNode.identifier).toBe('rootExpr');

    const hints = IRHintsFactory.create('property_access', 0.95, false, 'eloquent');
    expect(Object.isFrozen(hints)).toBe(true);
    expect(hints.pattern).toBe('property_access');
    expect(hints.confidence).toBe(0.95);

    const rawNode = IRRawNodeDescriptor.fromRawCode('$user->id', hints);
    expect(Object.isFrozen(rawNode)).toBe(true);
    expect(rawNode.code).toBe('$user->id');
  });

  it('executes pure catamorphism on ParsedASTNode without if/switch', () => {
    const visitor: ParsedASTVisitor<string> = {
      root: (n) => `root:${n.identifier}`,
      variable: (n) => `var:${n.name}`,
      property_access: (n) => `prop:${n.property}`,
      method_call: (n) => `call:${n.name}`,
      binary_expression: (n) => `bin:${n.operator}`,
      type_cast: (n) => `cast:${n.castType}`,
      ternary: () => 'ternary',
      literal: (n) => `lit:${n.value}`,
      null_literal: () => 'null',
      nullsafe_chain: (n) => `chain:${n.chain.length}`,
      unknown: (n) => `unknown:${n.code}`,
      primitive: (n) => `prim:${n.type}`,
      resource: (n) => `res:${n.resource}`,
      model: (n) => `model:${n.model}`,
      static_method_call: (n) => `static:${n.name}`,
      nullsafe_property_access: (n) => `nullsafe_prop:${n.property}`,
      new_instance: () => 'new'
    };

    const varNode = { kind: 'variable' as const, name: 'request' };
    const propNode = {
      kind: 'property_access' as const,
      target: varNode,
      property: 'user_id',
      accessKind: 'property' as const
    };
    const litNode = { kind: 'literal' as const, value: 123 };

    expect(matchParsedAST(varNode, visitor)).toBe('var:request');
    expect(matchParsedAST(propNode, visitor)).toBe('prop:user_id');
    expect(matchParsedAST(litNode, visitor)).toBe('lit:123');
  });

  it('maintains immutable and frozen field sets and cast collections', () => {
    const fieldSet = SemanticFieldSet.fromEntries([
      { name: 'id', type: 'number' },
      { name: 'email', type: 'string' }
    ]);

    expect(Object.isFrozen(fieldSet)).toBe(true);
    expect(fieldSet.size).toBe(2);
    expect(fieldSet.get('id')).toBe('number');
    expect(fieldSet.get('email')).toBe('string');
    expect(fieldSet.has('id')).toBe(true);
    expect(fieldSet.has('missing')).toBe(false);

    const castCollection = ModelCastCollection.fromEntries([
      { column: 'is_active', castType: 'boolean' },
      { column: 'metadata', castType: 'array' }
    ]);

    expect(Object.isFrozen(castCollection)).toBe(true);
    expect(castCollection.size).toBe(2);
    expect(castCollection.get('is_active')).toBe('boolean');
    expect(castCollection.getCast('metadata')).toBe('array');
    expect(castCollection.has('is_active')).toBe(true);
    expect(castCollection.has('non_existent')).toBe(false);
  });
});
