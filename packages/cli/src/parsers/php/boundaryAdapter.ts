/**
 * boundaryAdapter.ts
 *
 * Catamorphic Boundary Adapter: PhpGrammarNode → PhpAstNode.
 * Zero Record, zero any, zero if.
 *
 * @module cli/parsers/php
 */

import type { PhpAstNode } from '@routesync/core';
import type { PhpGrammarNode } from './ast/grammar';
import { matchPhpGrammar, type PhpGrammarVisitor } from './ast/grammarCatamorphism';
import { matchCallee, createCalleeAstVisitor } from './ast/calleeCatamorphism';
import { extractOffsetString } from './ast/offsetCatamorphism';

export function adaptPhpAstBoundary(node: unknown, code: string): PhpAstNode {
    const grammarNode = (node ?? { kind: 'unknown' }) as PhpGrammarNode;
    const adaptChild = (child: PhpGrammarNode): PhpAstNode => adaptPhpAstBoundary(child, code);
    const calleeVisitor = createCalleeAstVisitor(adaptChild);

    const GRAMMAR_VISITOR: PhpGrammarVisitor<PhpAstNode> = {
        propertylookup: (n) => Object.freeze({ kind: 'property_lookup', originalCode: code, target: adaptChild(n.what), property: extractOffsetString(n.offset) }),
        nullsafepropertylookup: (n) => Object.freeze({ kind: 'nullsafe_property_lookup', originalCode: code, target: adaptChild(n.what), property: extractOffsetString(n.offset) }),
        offsetlookup: (n) => Object.freeze({ kind: 'offset_lookup', originalCode: code, target: adaptChild(n.what), property: extractOffsetString(n.offset) }),
        staticlookup: (n) => Object.freeze({ kind: 'static_constant', originalCode: code, className: ((n.what as any)?.name || (n.what as any)?.raw || '').split('\\').pop() || '', constantName: extractOffsetString(n.offset) }),
        call: (n) => matchCallee(n.what, (n.arguments || []).map(adaptChild), code, calleeVisitor),
        new: (n) => Object.freeze({ kind: 'new_instance', originalCode: code, className: ((n.what as any)?.name || '').split('\\').pop() || '', args: (n.arguments || []).map(adaptChild) }),
        closure: (n) => {
            const ret = (n.body?.children || []).find((s: any) => s?.kind === 'return');
            return ret?.expr ? adaptChild(ret.expr) : Object.freeze({ kind: 'unknown', originalCode: code, code });
        },
        arrowfunc: (n) => Object.freeze({ kind: 'arrow_func', originalCode: code, body: adaptChild(n.body) }),
        bin: (n) => Object.freeze({ kind: 'binary', originalCode: code, operator: n.type, left: adaptChild(n.left), right: adaptChild(n.right) }),
        unary: (n) => Object.freeze({ kind: 'unary', originalCode: code, operator: n.type, what: adaptChild(n.what) }),
        cast: (n) => Object.freeze({ kind: 'type_cast', originalCode: code, castType: (n.type === 'int' || n.type === 'integer') ? 'int' : (n.type === 'float' || n.type === 'double') ? 'float' : (n.type === 'bool' || n.type === 'boolean') ? 'bool' : 'string', expr: adaptChild(n.expr) }),
        retif: (n) => Object.freeze({ kind: 'ternary', originalCode: code, condition: adaptChild(n.test), truthy: adaptChild(n.trueExpr), falsy: adaptChild(n.falseExpr) }),
        array: (n) => Object.freeze({ kind: 'array', originalCode: code, items: (n.items || []).map(e => ({ key: e.key ? extractOffsetString(e.key) : null, value: adaptChild(e.value) })) }),
        string: (n) => Object.freeze({ kind: 'literal', originalCode: code, value: n.value }),
        number: (n) => Object.freeze({ kind: 'literal', originalCode: code, value: Number(n.value) }),
        boolean: (n) => Object.freeze({ kind: 'literal', originalCode: code, value: Boolean(n.value) }),
        nullkeyword: () => Object.freeze({ kind: 'literal', originalCode: code, value: null }),
        encapsed: () => Object.freeze({ kind: 'literal', originalCode: code, value: code }),
        variable: (n) => Object.freeze({ kind: 'variable', originalCode: code, name: n.name }),
        unknown: () => Object.freeze({ kind: 'unknown', originalCode: code, code })
    };

    return matchPhpGrammar(grammarNode, GRAMMAR_VISITOR);
}
