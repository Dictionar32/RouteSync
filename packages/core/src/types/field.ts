/**
 * CompilerRoadmap.md Stage 2 follow-up — unified field representation.
 * See compiler/CompilerBacklog.md H1/H3 and the design review thread that
 * produced this (v1 -> v3, approved) for the reasoning behind every choice
 * here. Short version:
 *
 *   - Collapses 3 previously-parallel unions (ResourceFieldKind,
 *     ResponseMetadata) into one, FieldNode.
 *   - Parser produces framework-agnostic AST only (no `resource`,
 *     no forced `model` on static calls). Laravel-specific facts
 *     (is this a Resource? a collection call?) live exclusively in
 *     `resolved`, decided by ResourceGraphResolver and nothing upstream.
 *   - declared semantic fields do not belong to this syntax carrier.
 *     Scanner declarations have their own semantic descriptors and must not
 *     masquerade as parser-produced FieldNode variants.
 *
 * MIGRATION STATUS (phase 1 of 3 — see compiler/CompilerBacklog.md):
 *   1. [this file] add the new model + adapters from the old one. DONE.
 *   2. migrate PhpCodeParser.ts / incremental.ts / SemanticResolutionKernel
 *      to use FieldNode internally; verify routesync.ir.json output is
 *      unchanged (or changed only as expected). NOT STARTED.
 *   3. delete ResourceFieldKind, ResponseMetadata and the
 *      Scanned-vs-Parsed split once every consumer has moved. IN PROGRESS.
 * Retired ParsedASTNode types are archived and are no longer part of the active public AST contract.
 */

import type { AccessKind } from './contract'
import type { SourceRef } from './semantic'
import type { PhpClassName, PhpFunctionName, PhpMethodName, PhpPropertyName, PhpVariableName, PhpConstantName, PhpCastType, PhpParameter } from './domain/phpAst/astValues'
import type { UnsupportedAstReason } from './domain/phpAst/nodes'

export interface BaseField {
  source?: SourceRef
}

/** Base for every kind PhpCodeParser produces from a code string — always carries the original text for debugging, so it isn't repeated on all 12 variants individually. */
export interface ParsedField extends BaseField {
  originalCode: string
  source: SourceRef
}

/* ---------- declared kinds (known without parsing PHP code) ----------
   Constructed directly by StaticLaravelScanner's attribute/JSON-literal
   scan — never by PhpCodeParser. */

export type FieldArrayKey =
  | { readonly kind: 'implicit' }
  | { readonly kind: 'explicit'; readonly expression: FieldNode }

export interface FieldEntryNode { readonly key: FieldArrayKey; readonly value: FieldNode }

export interface ArrayField extends BaseField { kind: 'array'; entries: readonly FieldEntryNode[] }

export interface UnknownField extends BaseField {
  kind: 'unknown'
  reason: UnsupportedAstReason
}

/* ---------- raw / parsed kinds ---------- */


export interface LiteralField extends ParsedField { kind: 'literal'; value: string | number | boolean | null }

export interface VariableField extends ParsedField { kind: 'variable'; name: PhpVariableName }

export interface PropertyAccessField extends ParsedField { kind: 'property_access'; target: FieldNode; property: PhpPropertyName; accessKind: AccessKind }
export interface ArrayAccessField extends ParsedField { kind: 'array_access'; target: FieldNode; offset: FieldNode }

export type FieldArgument =
  | { readonly kind: 'positional'; readonly value: FieldNode }
  | { readonly kind: 'named'; readonly name: PhpPropertyName; readonly value: FieldNode }
  | { readonly kind: 'unpacked'; readonly value: FieldNode }

export type FieldReturnExpression =
  | { readonly kind: 'value'; readonly value: FieldNode }
  | { readonly kind: 'void' }

export type FieldStatement =
  | { readonly kind: 'expression_statement'; readonly expression: FieldNode }
  | { readonly kind: 'return_statement'; readonly expression: FieldReturnExpression }

export interface ClosureField extends ParsedField {
  kind: 'closure'
  parameters: readonly PhpParameter[]
  captures: readonly { readonly kind: 'by_value' | 'by_reference'; readonly variable: PhpVariableName }[]
  body: readonly FieldStatement[]
}

export interface ArrowFunctionField extends ParsedField {
  kind: 'arrow_func'
  parameters: readonly PhpParameter[]
  body: FieldNode
}

export interface FunctionCallField extends ParsedField { kind: 'function_call'; name: PhpFunctionName; args: readonly FieldArgument[] }
export interface MethodCallField extends ParsedField { kind: 'method_call'; target: FieldNode; name: PhpMethodName; args: readonly FieldArgument[] }
export interface NullsafeMethodCallField extends ParsedField { kind: 'nullsafe_method_call'; target: FieldNode; name: PhpMethodName; args: readonly FieldArgument[] }
export interface VariableCallField extends ParsedField { kind: 'variable_call'; name: PhpVariableName; args: readonly FieldArgument[] }
export interface StaticMethodCallField extends ParsedField { kind: 'static_method_call'; className: PhpClassName; name: PhpMethodName; args: readonly FieldArgument[] }
export interface StaticPropertyAccessField extends ParsedField { kind: 'static_property_access'; className: PhpClassName; property: PhpPropertyName }
export interface StaticConstantField extends ParsedField { kind: 'static_constant'; className: PhpClassName; constantName: PhpConstantName }

export interface UnaryExpressionField extends ParsedField { kind: 'unary_expression'; operator: import('./domain/phpAst/astValues').PhpUnaryOperator; expression: FieldNode }

export interface BinaryExpressionField extends ParsedField { kind: 'binary_expression'; operator: import('./domain/phpAst/astValues').PhpBinaryOperator; left: FieldNode; right: FieldNode }

export interface TypeCastField extends ParsedField { kind: 'type_cast'; castType: PhpCastType; expression: FieldNode }

export interface TernaryField extends ParsedField { kind: 'ternary'; condition: FieldNode; truthy: FieldNode; falsy: FieldNode }

export interface NullsafePropertyAccessField extends ParsedField { kind: 'nullsafe_property_access'; target: FieldNode; property: PhpPropertyName }

export interface NewInstanceField extends ParsedField { kind: 'new_instance'; className: PhpClassName; args: readonly FieldArgument[] }

export type FieldNode =
  | ArrayField | UnknownField
  | LiteralField | VariableField | PropertyAccessField | ArrayAccessField
  | FunctionCallField | MethodCallField | NullsafeMethodCallField | VariableCallField
  | StaticMethodCallField | StaticPropertyAccessField | StaticConstantField | UnaryExpressionField | BinaryExpressionField
  | TypeCastField | TernaryField
  | NullsafePropertyAccessField | NewInstanceField | ClosureField | ArrowFunctionField

export { matchFieldNode, type FieldNodeVisitor } from './domain/fieldCatamorphism'

/* ---------- unified route/resource/model definitions ---------- */
/* (*Def, not *Node: semantic.ts already has ServiceNode/ControllerNode/
   ModelNode for the service-graph layer.) */

export * from './domain/entityDefinitions';
