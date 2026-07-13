import { Engine } from 'php-parser';
import type { FieldNode } from '@routesync/core';

/**
 * Phase 2 of the FieldNode migration (packages/core/src/types/field.ts).
 * Framework-agnostic on purpose: this file used to hardcode two Laravel
 * conventions directly into the AST —
 *   - every `X::y` forced `target: { kind: 'model', model: X }`, so
 *     Carbon::now() / Route::get() / Str::slug() all got tagged as if X
 *     were an Eloquent model
 *   - `methodName === 'collection'` short-circuited straight to
 *     `{ kind: 'resource', ... }`
 * Both are gone. "Is this a Resource / a collection call" is decided
 * exclusively by ResourceGraphResolver (packages/core/src/semantic/
 * plugins/ResourceGraphResolver.ts) now, via `resolved`, never by this
 * parser. See field.ts's header comment for the full reasoning.
 */
export class PhpCodeParser {
  private static parser = new Engine({
    parser: {
      extractDoc: true,
      php7: true,
    },
    ast: {
      withPositions: true,
    },
  });

  public static parseExpression(code: string, hints?: { pattern?: string }): FieldNode {
    if (hints && hints.pattern) {
      if (hints.pattern === 'variable' && code.match(/^\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*$/)) {
        return { kind: 'variable', originalCode: code, name: code.substring(1) };
      }
    }

    const wrapped = `<?php $val = ${code};`;
    try {
      const ast = this.parser.parseCode(wrapped, 'eval');
      if (ast && ast.children && ast.children.length > 0) {
        const expr = ast.children[0] as Record<string, unknown>;
        if (expr && expr.kind === 'expressionstatement' && expr.expression && typeof expr.expression === 'object' && (expr.expression as unknown as Record<string, unknown>).kind === 'assign') {
          return this.mapNode((expr.expression as unknown as Record<string, unknown>).right, wrapped);
        }
      }
    } catch (e) {
      // Ignore parser errors and fallback to unknown
    }
    return { kind: 'unknown', code };
  }

  /** Slices the original source text for a node, using php-parser's position offsets — this is what makes `originalCode` accurate per-node instead of repeating the whole expression on every node. */
  private static slice(node: any, source: string): string {
    if (node && node.loc && node.loc.start && node.loc.end && typeof node.loc.start.offset === 'number' && typeof node.loc.end.offset === 'number') {
      return source.slice(node.loc.start.offset, node.loc.end.offset);
    }
    return '';
  }

  private static mapNode(node: any, source: string): FieldNode {
    if (!node) return { kind: 'unknown' };
    const originalCode = this.slice(node, source);

    if (node.kind === 'propertylookup') {
      const target = this.mapNode(node.what, source);
      const property = node.offset?.name || (node.offset?.kind === 'identifier' ? node.offset.name : null);
      if (property) {
        return { kind: 'property_access', originalCode, target, property, accessKind: 'property_access' };
      }
    }

    if (node.kind === 'nullsafepropertylookup') {
      const target = this.mapNode(node.what, source);
      const property = node.offset?.name || (node.offset?.kind === 'identifier' ? node.offset.name : null);
      if (property) {
        return { kind: 'nullsafe_property_access', originalCode, target, property };
      }
    }

    if (node.kind === 'offsetlookup') {
      const target = this.mapNode(node.what, source);
      const property = node.offset?.value || node.offset?.name || (node.offset?.kind === 'identifier' ? node.offset.name : null);
      if (property) {
        // Array offset access ($arr['key']) is distinct from ->property access,
        // even though both currently normalize to the 'property_access' kind for
        // backward compatibility. accessKind preserves the distinction so JSON
        // member chains (see ExpressionResolver) can record how each key was reached.
        return { kind: 'property_access', originalCode, target, property, accessKind: 'array_access' };
      }
    }

    if (node.kind === 'bin') {
      return {
        kind: 'binary_expression',
        originalCode,
        operator: node.type,
        left: this.mapNode(node.left, source),
        right: this.mapNode(node.right, source),
      };
    }

    if (node.kind === 'cast') {
      return {
        kind: 'type_cast',
        originalCode,
        castType: node.type,
        expression: this.mapNode(node.expr, source),
      };
    }

    if (node.kind === 'retif') {
      return {
        kind: 'ternary',
        originalCode,
        condition: this.mapNode(node.test, source),
        truthy: this.mapNode(node.trueExpr, source),
        falsy: this.mapNode(node.falseExpr, source),
      };
    }

    if (node.kind === 'nullkeyword') {
      return { kind: 'literal', originalCode, value: null };
    }

    if (node.kind === 'arrowfunc') {
      return this.mapNode(node.body, source);
    }

    if (node.kind === 'closure') {
      if (node.body && Array.isArray(node.body.children)) {
        const retStmt = node.body.children.find((s: any) => s.kind === 'return');
        if (retStmt) {
          return this.mapNode(retStmt.expr, source);
        }
      }
      return { kind: 'unknown', code: originalCode };
    }

    if (node.kind === 'new') {
      const className = (node.what?.name || '').split('\\').pop() || '';
      const args = Array.isArray(node.arguments) ? node.arguments.map((arg: any) => this.mapNode(arg, source)) : [];
      return { kind: 'new_instance', originalCode, className, args };
    }

    if (node.kind === 'call') {
      if (node.what && node.what.kind === 'staticlookup') {
        const className = (node.what.what?.name || '').split('\\').pop() || '';
        const methodName = node.what.offset?.name || (node.what.offset?.kind === 'identifier' ? node.what.offset.name : null);
        const args = Array.isArray(node.arguments) ? node.arguments.map((arg: any) => this.mapNode(arg, source)) : [];
        if (className && methodName) {
          return { kind: 'static_method_call', originalCode, className, name: methodName, args };
        }
      }

      let target: FieldNode | null = null;
      let name: string | null = null;
      if (node.what && (node.what.kind === 'identifier' || node.what.kind === 'name')) {
        name = node.what.name;
      } else if (node.what && (node.what.kind === 'propertylookup' || node.what.kind === 'nullsafepropertylookup')) {
        target = this.mapNode(node.what.what, source);
        name = node.what.offset?.name || (node.what.offset?.kind === 'identifier' ? node.what.offset.name : null);
      } else {
        target = this.mapNode(node.what, source);
      }
      const args = Array.isArray(node.arguments) ? node.arguments.map((arg: any) => this.mapNode(arg, source)) : [];
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

    // Literals — genuine, known values. (Interpolated strings, 'encapsed'
    // below, know their TYPE but not a concrete value, so they stay
    // 'primitive' rather than 'literal' — see field.ts's declared-vs-parsed
    // note.)
    if (node.kind === 'string') return { kind: 'literal', originalCode, value: node.value };
    if (node.kind === 'encapsed') return { kind: 'primitive', type: 'string' };
    if (node.kind === 'number') return { kind: 'literal', originalCode, value: Number(node.value) };
    if (node.kind === 'boolean') return { kind: 'literal', originalCode, value: !!node.value };

    return { kind: 'unknown', code: originalCode };
  }
}
