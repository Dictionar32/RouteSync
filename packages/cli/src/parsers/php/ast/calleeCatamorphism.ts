/** Declarative callee relation dispatcher at the parser boundary. */
import type { PhpAstNode, PhpFunctionName, PhpMethodName, PhpClassName, PhpVariableName, PhpArgument } from '@routesync/core';
import { relationFirstOption, relationOptionFold, relationVariant } from '@routesync/core';
import type {
  PhpGrammarNode,
  GrammarIdentifier,
  GrammarName,
  GrammarPropertyLookup,
  GrammarNullsafeLookup,
  GrammarStaticLookup,
  GrammarVariable,
} from './grammar';

const functionName = (value: string): PhpFunctionName => ({ kind: 'function_name', value });
const methodName = (value: string): PhpMethodName => ({ kind: 'method_name', value });
const className = (value: string): PhpClassName => ({ kind: 'class_name', value });
const variableName = (value: string): PhpVariableName => ({ kind: 'variable_name', value });

const memberName = (node: PhpGrammarNode, label: string): string =>
  relationOptionFold(
    relationVariant(node, 'identifier'),
    () => relationOptionFold(
      relationVariant(node, 'name'),
      () => { throw Error(`PHP AST boundary: invalid ${label} node ${node.kind}`); },
      value => value.name,
    ),
    value => value.name,
  );

const classReference = (node: PhpGrammarNode): string =>
  relationOptionFold(
    relationVariant(node, 'name'),
    () => relationOptionFold(
      relationVariant(node, 'selfreference'),
      () => relationOptionFold(
        relationVariant(node, 'staticreference'),
        () => { throw Error(`PHP AST boundary: invalid class reference node ${node.kind}`); },
        value => value.raw,
      ),
      value => value.raw,
    ),
    value => value.name,
  );

export type KnownCallee =
  | GrammarIdentifier
  | GrammarName
  | GrammarPropertyLookup
  | GrammarNullsafeLookup
  | GrammarStaticLookup
  | GrammarVariable;
export type UnsupportedCallee = Exclude<PhpGrammarNode, KnownCallee>;

export interface CalleeVisitor<R> {
  readonly identifier: (callee: GrammarIdentifier, args: readonly PhpArgument[], code: string) => R;
  readonly name: (callee: GrammarName, args: readonly PhpArgument[], code: string) => R;
  readonly propertylookup: (callee: GrammarPropertyLookup, args: readonly PhpArgument[], code: string) => R;
  readonly nullsafepropertylookup: (callee: GrammarNullsafeLookup, args: readonly PhpArgument[], code: string) => R;
  readonly staticlookup: (callee: GrammarStaticLookup, args: readonly PhpArgument[], code: string) => R;
  readonly variable: (callee: GrammarVariable, args: readonly PhpArgument[], code: string) => R;
  readonly unknown: (callee: PhpGrammarNode, args: readonly PhpArgument[], code: string) => R;
}

export function createCalleeAstVisitor(adaptNode: (node: PhpGrammarNode) => PhpAstNode): CalleeVisitor<PhpAstNode> {
  const visitor: CalleeVisitor<PhpAstNode> = {
    identifier: (callee, args, code) => ({ kind: 'function_call', originalCode: code, source: { kind: 'absent' }, name: functionName(callee.name), args }),
    name: (callee, args, code) => ({ kind: 'function_call', originalCode: code, source: { kind: 'absent' }, name: functionName(lastName(callee.name)), args }),
    propertylookup: (callee, args, code) => ({ kind: 'method_call', originalCode: code, source: { kind: 'absent' }, target: adaptNode(callee.what), name: methodName(memberName(callee.offset, 'method')), args }),
    nullsafepropertylookup: (callee, args, code) => ({ kind: 'nullsafe_method_call', originalCode: code, source: { kind: 'absent' }, target: adaptNode(callee.what), name: methodName(memberName(callee.offset, 'method')), args }),
    staticlookup: (callee, args, code) => ({ kind: 'static_method_call', originalCode: code, source: { kind: 'absent' }, className: className(classReference(callee.what)), name: methodName(memberName(callee.offset, 'method')), args }),
    variable: (callee, args, code) => ({ kind: 'variable_call', originalCode: code, source: { kind: 'absent' }, name: variableName(callee.name), args }),
    unknown: (_callee, _args, code) => ({ kind: 'unsupported', originalCode: code, source: { kind: 'absent' }, reason: { kind: 'unsupported_syntax' } }),
  };
  return Object.freeze(visitor);
}

export function matchCallee<R>(callee: PhpGrammarNode, args: readonly PhpArgument[], code: string, visitor: CalleeVisitor<R>): R {
  return relationOptionFold(
    relationVariant(callee, 'identifier'),
    () => relationOptionFold(
      relationVariant(callee, 'name'),
      () => relationOptionFold(
        relationVariant(callee, 'propertylookup'),
        () => relationOptionFold(
          relationVariant(callee, 'nullsafepropertylookup'),
          () => relationOptionFold(
            relationVariant(callee, 'staticlookup'),
            () => relationOptionFold(
              relationVariant(callee, 'variable'),
              () => visitor.unknown(callee, args, code),
              value => visitor.variable(value, args, code),
            ),
            value => visitor.staticlookup(value, args, code),
          ),
          value => visitor.nullsafepropertylookup(value, args, code),
        ),
        value => visitor.propertylookup(value, args, code),
      ),
      value => visitor.name(value, args, code),
    ),
    value => visitor.identifier(value, args, code),
  );
}

const lastName = (name: string): string =>
  relationOptionFold(
    relationFirstOption(name.split('\\').reverse(), () => true),
    () => name,
    value => value,
  );
