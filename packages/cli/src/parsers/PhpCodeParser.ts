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

  public static parseExpression(code: string, hints?: any): any {
    if (hints && hints.pattern) {
        if (hints.pattern === 'variable' && code.match(/^\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*$/)) {
            return { kind: 'variable', name: code.substring(1) };
        }
    }

    try {
      const ast = this.parser.parseCode(`<?php $val = ${code};`, 'eval');
      if (ast && ast.children && ast.children.length > 0) {
        const expr = ast.children[0] as any;
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

    if (node.kind === 'nullsafepropertylookup') {
      const target = this.mapNode(node.what);
      const property = node.offset?.name || (node.offset?.kind === 'identifier' ? node.offset.name : null);
      if (property) {
        return { kind: 'nullsafe_property_access', target, property };
      }
    }

    if (node.kind === 'offsetlookup') {
      const target = this.mapNode(node.what);
      const property = node.offset?.value || node.offset?.name || (node.offset?.kind === 'identifier' ? node.offset.name : null);
      if (property) {
        return { kind: 'property_access', target, property };
      }
    }

    if (node.kind === 'bin') {
      return {
        kind: 'binary_expression',
        operator: node.type,
        left: this.mapNode(node.left),
        right: this.mapNode(node.right)
      };
    }

    if (node.kind === 'cast') {
      return {
        kind: 'type_cast',
        castType: node.type,
        expression: this.mapNode(node.expr)
      };
    }

    if (node.kind === 'retif') {
      return {
        kind: 'ternary',
        condition: this.mapNode(node.test),
        truthy: this.mapNode(node.trueExpr),
        falsy: this.mapNode(node.falseExpr)
      };
    }

    if (node.kind === 'nullkeyword') {
      return { kind: 'primitive', type: 'null' };
    }

    if (node.kind === 'arrowfunc') {
      return this.mapNode(node.body);
    }

    if (node.kind === 'closure') {
      if (node.body && Array.isArray(node.body.children)) {
        const retStmt = node.body.children.find((s: any) => s.kind === 'return');
        if (retStmt) {
          return this.mapNode(retStmt.expr);
        }
      }
    }

    if (node.kind === 'new') {
      const className = node.what?.name || '';
      const baseName = className.split('\\').pop() || '';
      return {
        kind: 'new_instance',
        target: { kind: 'property_access', target: null, property: baseName },
        resource: baseName.endsWith('Resource') ? baseName : undefined
      };
    }

    if (node.kind === 'call') {
      let target = null;
      let name = null;
      if (node.what && (node.what.kind === 'identifier' || node.what.kind === 'name')) {
        name = node.what.name;
      } else if (node.what && node.what.kind === 'staticlookup') {
        const className = node.what.what?.name;
        const methodName = node.what.offset?.name || (node.what.offset?.kind === 'identifier' ? node.what.offset.name : null);
        const args = Array.isArray(node.arguments) ? node.arguments.map((arg: any) => this.mapNode(arg)) : [];
        if (className && methodName) {
          if (methodName === 'collection') {
            return { kind: 'resource', resource: className, collection: true };
          }
          return {
            kind: 'static_method_call',
            target: { kind: 'model', model: className },
            name: methodName,
            arguments: args
          };
        }
      } else {
        if (node.what && (node.what.kind === 'propertylookup' || node.what.kind === 'nullsafepropertylookup')) {
          target = this.mapNode(node.what.what);
          name = node.what.offset?.name || (node.what.offset?.kind === 'identifier' ? node.what.offset.name : null);
        } else {
          target = this.mapNode(node.what);
        }
      }
      const args = Array.isArray(node.arguments) ? node.arguments.map((arg: any) => this.mapNode(arg)) : [];
      return { kind: 'method_call', target, name, arguments: args };
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
    if (node.kind === 'string') return { kind: 'primitive', type: 'string', value: node.value };
    if (node.kind === 'encapsed') return { kind: 'primitive', type: 'string' };
    if (node.kind === 'number') return { kind: 'primitive', type: 'number', value: Number(node.value) };
    if (node.kind === 'boolean') return { kind: 'primitive', type: 'boolean', value: !!node.value };

    return { kind: 'primitive', type: 'unknown' };
  }
}
