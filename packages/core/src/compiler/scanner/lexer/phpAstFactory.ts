/** Immutable constructors for scanner-level PHP syntax AST. */
import type { AstIdentifier, PhpArgument, PhpArrayEntry, PhpAstValue, PhpClosureCapture, PhpParameter, PhpPropertyPath, PhpBlock } from './phpAstTypes';

export class PhpAstFactory {
    static stringLiteral(value: string): PhpAstValue { return Object.freeze({ kind: 'literal', literalType: 'string', value }); }
    static numberLiteral(raw: string): PhpAstValue { return Object.freeze({ kind: 'literal', literalType: 'number', value: Number(raw) }); }
    static booleanLiteral(value: boolean): PhpAstValue { return Object.freeze({ kind: 'literal', literalType: 'boolean', value }); }
    static nullLiteral(): PhpAstValue { return Object.freeze({ kind: 'literal', literalType: 'null', value: null }); }
    static variableReference(name: AstIdentifier): PhpAstValue { return Object.freeze({ kind: 'variable_reference', name }); }
    static propertyPath(root: AstIdentifier, steps: readonly AstIdentifier[]): PhpPropertyPath { return Object.freeze({ root, steps: Object.freeze([...steps]) }); }
    static propertyAccess(target: PhpPropertyPath, receiver: PhpAstValue, property: AstIdentifier, nullsafe: boolean): PhpAstValue { return Object.freeze({ kind: 'property_access', target, receiver, property, nullsafe }); }
    static methodChain(target: PhpPropertyPath, receiver: PhpAstValue, property: AstIdentifier, args: readonly PhpArgument[], nullsafe: boolean): PhpAstValue { return Object.freeze({ kind: 'method_chain', target, receiver, property, arguments: Object.freeze(args.map(a => a.value)), argumentDescriptors: Object.freeze([...args]), nullsafe }); }
    static resourceSingle(resourceName: AstIdentifier, argument: PhpAstValue): PhpAstValue { return Object.freeze({ kind: 'resource_single', resourceName, argument }); }
    static resourceCollection(resourceName: AstIdentifier, argument: PhpAstValue): PhpAstValue { return Object.freeze({ kind: 'resource_collection', resourceName, argument }); }
    static staticCall(className: AstIdentifier, method: AstIdentifier, args: readonly PhpArgument[]): PhpAstValue { return Object.freeze({ kind: 'static_call', className, method, arguments: Object.freeze(args.map(a => a.value)), argumentDescriptors: Object.freeze([...args]) }); }
    static classReference(className: AstIdentifier): PhpAstValue { return Object.freeze({ kind: 'class_reference', className }); }
    static ternaryExpression(condition: PhpAstValue, trueBranch: PhpAstValue, falseBranch: PhpAstValue): PhpAstValue { return Object.freeze({ kind: 'ternary_expression', condition, trueBranch, falseBranch }); }
    static nestedArray(entries: readonly PhpArrayEntry[]): PhpAstValue { return Object.freeze({ kind: 'nested_array', entries: Object.freeze([...entries]) }); }
    static closure(parameters: readonly PhpParameter[], captures: readonly PhpClosureCapture[], body: PhpBlock): PhpAstValue { return Object.freeze({ kind: 'closure', parameters: Object.freeze([...parameters]), captures: Object.freeze([...captures]), body }); }
    static arrowFunction(parameters: readonly PhpParameter[], body: PhpAstValue): PhpAstValue { return Object.freeze({ kind: 'arrow_function', parameters: Object.freeze([...parameters]), body }); }
    static unsupported(tokens: readonly import('./phpAstTypes').TokenDescriptor[]): PhpAstValue { return Object.freeze({ kind: 'unsupported', reason: 'unclassified_expression', tokens: Object.freeze([...tokens]) }); }
}
