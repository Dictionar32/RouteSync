/**
 * nodeMapper.ts
 *
 * Recursively maps php-parser AST nodes into FieldNode domain structures.
 *
 * @module cli/parsers/php
 */

import type { FieldNode } from '@routesync/core';
import { sliceNodeSource } from './sourceSlice';

export function mapPhpAstNode(node: any, source: string): FieldNode {
  if (!node) return { kind: 'unknown' };
  const originalCode = sliceNodeSource(node, source);

  if (node.kind === 'propertylookup') {
    const target = mapPhpAstNode(node.what, source);
    const property = node.offset?.name || (node.offset?.kind === 'identifier' ? node.offset.name : null);
    if (property) {
      return { kind: 'property_access', originalCode, target, property, accessKind: 'property_access' };
    }
  }

  if (node.kind === 'nullsafepropertylookup') {
    const target = mapPhpAstNode(node.what, source);
    const property = node.offset?.name || (node.offset?.kind === 'identifier' ? node.offset.name : null);
    if (property) {
      return { kind: 'nullsafe_property_access', originalCode, target, property };
    }
  }

  if (node.kind === 'offsetlookup') {
    const target = mapPhpAstNode(node.what, source);
    const property = node.offset?.value || node.offset?.name || (node.offset?.kind === 'identifier' ? node.offset.name : null);
    if (property) {
      return { kind: 'property_access', originalCode, target, property, accessKind: 'array_access' };
    }
  }

  if (node.kind === 'bin') {
    return {
      kind: 'binary_expression',
      originalCode,
      operator: node.type,
      left: mapPhpAstNode(node.left, source),
      right: mapPhpAstNode(node.right, source)
    };
  }

  if (node.kind === 'cast') {
    return {
      kind: 'type_cast',
      originalCode,
      castType: node.type,
      expression: mapPhpAstNode(node.expr, source)
    };
  }

  if (node.kind === 'retif') {
    return {
      kind: 'ternary',
      originalCode,
      condition: mapPhpAstNode(node.test, source),
      truthy: mapPhpAstNode(node.trueExpr, source),
      falsy: mapPhpAstNode(node.falseExpr, source)
    };
  }

  if (node.kind === 'nullkeyword') {
    return { kind: 'literal', originalCode, value: null };
  }

  if (node.kind === 'arrowfunc') {
    return mapPhpAstNode(node.body, source);
  }

  if (node.kind === 'closure') {
    if (node.body && Array.isArray(node.body.children)) {
      const retStmt = node.body.children.find((s: any) => s.kind === 'return');
      if (retStmt) {
        return mapPhpAstNode(retStmt.expr, source);
      }
    }
    return { kind: 'unknown', code: originalCode };
  }

  if (node.kind === 'new') {
    const className = (node.what?.name || '').split('\\').pop() || '';
    const args = Array.isArray(node.arguments) ? node.arguments.map((arg: any) => mapPhpAstNode(arg, source)) : [];
    return { kind: 'new_instance', originalCode, className, args };
  }

  if (node.kind === 'call') {
    if (node.what && node.what.kind === 'staticlookup') {
      const className = (node.what.what?.name || '').split('\\').pop() || '';
      const methodName = node.what.offset?.name || (node.what.offset?.kind === 'identifier' ? node.what.offset.name : null);
      const args = Array.isArray(node.arguments) ? node.arguments.map((arg: any) => mapPhpAstNode(arg, source)) : [];
      if (className && methodName) {
        return { kind: 'static_method_call', originalCode, className, name: methodName, args };
      }
    }

    let target: FieldNode | null = null;
    let name: string | null = null;
    if (node.what && (node.what.kind === 'identifier' || node.what.kind === 'name')) {
      name = node.what.name;
    } else if (node.what && (node.what.kind === 'propertylookup' || node.what.kind === 'nullsafepropertylookup')) {
      target = mapPhpAstNode(node.what.what, source);
      name = node.what.offset?.name || (node.what.offset?.kind === 'identifier' ? node.what.offset.name : null);
    } else {
      target = mapPhpAstNode(node.what, source);
    }
    const args = Array.isArray(node.arguments) ? node.arguments.map((arg: any) => mapPhpAstNode(arg, source)) : [];
    return { kind: 'method_call', originalCode, target, name: name || '', args };
  }

  if (node.kind === 'variable') {
    return { kind: 'variable', originalCode, name: node.name };
  }

  if (node.kind === 'staticlookup') {
    const className = (node.what?.name || '').split('\\').pop() || '';
    const methodName = node.offset?.name;
    if (className && methodName) {
      return { kind: 'static_method_call', originalCode, className, name: methodName, args: [] };
    }
  }

  if (node.kind === 'string') return { kind: 'literal', originalCode, value: node.value };
  if (node.kind === 'encapsed') return { kind: 'primitive', type: 'string' };
  if (node.kind === 'number') return { kind: 'literal', originalCode, value: Number(node.value) };
  if (node.kind === 'boolean') return { kind: 'literal', originalCode, value: !node.value };

  return { kind: 'unknown', code: originalCode };
}
