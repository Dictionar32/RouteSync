import { Engine } from 'php-parser';

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

  public static parseExpression(code: string): any {
    try {
      const ast = this.parser.parseCode(`<?php $val = ${code};`, 'eval');
      if (ast && ast.children && ast.children.length > 0) {
        const expr = ast.children[0];
        if (expr.kind === 'expressionstatement' && expr.expression && expr.expression.kind === 'assign') {
          return this.mapNode(expr.expression.right);
        }
      }
    } catch (e) {
      // Ignore parser errors and fallback to unknown
    }
    return { kind: 'primitive', type: 'unknown' };
  }

  private static mapNode(node: any): any {
    if (!node) return { kind: 'primitive', type: 'unknown' };

    if (node.kind === 'propertylookup') {
      const target = this.mapNode(node.what);
      const property = node.offset?.name || (node.offset?.kind === 'identifier' ? node.offset.name : null);
      if (property) {
        return { kind: 'property_access', target, property };
      }
    }

    if (node.kind === 'call') {
      const target = this.mapNode(node.what);
      let name = null;
      if (node.what && node.what.kind === 'propertylookup') {
        name = node.what.offset?.name;
      } else if (node.what && node.what.kind === 'identifier') {
        name = node.what.name;
      }
      return { kind: 'method_call', target, name };
    }

    if (node.kind === 'variable') {
      return { kind: 'variable', name: node.name };
    }

    if (node.kind === 'staticlookup') {
      const what = node.what?.name;
      const offset = node.offset?.name;
      if (what && offset) {
         if (offset === 'collection') {
             return { kind: 'resource', resource: what, collection: true };
         }
         return { kind: 'static_method_call', target: { kind: 'model', model: what }, name: offset };
      }
    }

    // Try to guess from primitive values
    if (node.kind === 'string' || node.kind === 'encapsed') return { kind: 'primitive', type: 'string' };
    if (node.kind === 'number') return { kind: 'primitive', type: 'number' };
    if (node.kind === 'boolean') return { kind: 'primitive', type: 'boolean' };

    return { kind: 'primitive', type: 'unknown' };
  }
}
