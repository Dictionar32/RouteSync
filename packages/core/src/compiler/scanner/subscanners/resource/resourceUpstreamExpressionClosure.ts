import { PHP_STATEMENT_KINDS } from '../../lexer/phpAstStatementKinds';
import type { Expression, ClosureStatement, ClosureBody, ClosureForClause, ClosureCatchClause, ClosureFinallyClause, ClosureIfAlternative } from '../../../../types/upstream/expression';
import type { Assignment } from '../../../../types/upstream/assignment';
import { createSourceFile } from '../../../../types/upstream/names';
import type { PhpStatement, PhpAssignmentTarget, PhpForClause, PhpIfAlternative, PhpForeachTarget, PhpFinallyClause, PhpCatchClause } from '../../lexer/phpAstStatementTypes';
import { matchPhpStatement } from '../../lexer/phpAstAlgebra';
import type { UpstreamExpressionMapper } from './resourceUpstreamExpressionMappings';
import { className, resolveAssignmentTarget, resolveAssignmentOperator, assignmentReferenceMode, sequence, variable } from './resourceUpstreamExpressionMappings';
import { relationEqual, relationGate, relationLookup, relationOptionFold, relationProject } from '../../../../semantic/kernel/semanticRelations';

export function resolveClosureBody(statements: readonly PhpStatement[], file: string, resolveExpression: UpstreamExpressionMapper): ClosureBody {
  return { kind: 'statement_body', statements: sequence(relationProject(statements, statement => resolveClosureStatement(statement, file, resolveExpression))) };
}

export function resolveClosureAssignment(statement: Extract<PhpStatement, { readonly kind: 'assignment' }>, file: string, resolveExpression: UpstreamExpressionMapper): Assignment {
  const target = resolveAssignmentTarget(statement.target, resolveExpression, file);
  return {
    kind: 'assignment',
    target,
    expression: resolveExpression(statement.value, file),
    operator: resolveAssignmentOperator(statement.operator.kind),
    reference: assignmentReferenceMode(statement.reference.kind),
    source: sourceSpanFromToken(file, statement.source),
  };
}

export function resolveClosureForAssignment(clause: Extract<PhpForClause, { readonly kind: 'assignment' }>, file: string, resolveExpression: UpstreamExpressionMapper): Assignment {
  const target = resolveAssignmentTarget(clause.target, resolveExpression, file);
  return {
    kind: 'assignment',
    target,
    expression: resolveExpression(clause.value, file),
    operator: resolveAssignmentOperator(clause.operator.kind),
    reference: assignmentReferenceMode(clause.reference.kind),
    source: sourceSpanFromToken(file, clause.source),
  };
}

export function resolveClosureStatement(statement: PhpStatement, file: string, resolveExpression: UpstreamExpressionMapper): ClosureStatement {
  return matchPhpStatement(statement, {
    expression_statement: node => ({ kind: 'expression', expression: resolveExpression(node.expression, file) }),
    return_with_value: node => ({ kind: 'return_value', expression: resolveExpression(node.expression, file) }),
    return_void: () => ({ kind: 'return_void' }),
    assignment: node => ({ kind: 'assignment', value: resolveClosureAssignment(node, file, resolveExpression) }),
    [PHP_STATEMENT_KINDS.conditional]: node => ({ kind: 'if', condition: resolveExpression(node.condition, file), thenBlock: sequence(relationProject(node.thenBlock.statements, item => resolveClosureStatement(item, file, resolveExpression))), alternative: resolveIfAlternative(node.alternative, file, resolveExpression) }),
    [PHP_STATEMENT_KINDS.collectionRecurrence]: node => ({ kind: 'foreach', iterable: resolveExpression(node.iterable, file), target: resolveForeachTarget(node.target), body: sequence(relationProject(node.body.statements, item => resolveClosureStatement(item, file, resolveExpression))) }),
    [PHP_STATEMENT_KINDS.countedRecurrence]: node => ({ kind: 'for', initializer: resolveForClause(node.initializer, file, resolveExpression), condition: resolveForClause(node.condition, file, resolveExpression), update: resolveForClause(node.update, file, resolveExpression), body: sequence(relationProject(node.body.statements, item => resolveClosureStatement(item, file, resolveExpression))) }),
    try_statement: node => ({ kind: 'try', body: sequence(relationProject(node.body.statements, item => resolveClosureStatement(item, file, resolveExpression))), catches: sequence(relationProject(node.catches, clause => resolveCatchClause(clause, file, resolveExpression))), finallyBlock: resolveFinallyClause(node.finallyBlock, file, resolveExpression) }),
    throw_statement: node => ({ kind: 'throw', expression: resolveExpression(node.expression, file) }),
    while_statement: () => { throw Error('Unsupported recursive statement in closure relation'); },
    switch_statement: () => { throw Error('Unsupported multi-candidate statement in closure relation'); },
    unset_statement: () => { throw Error('Unsupported unset statement in closure relation'); },
    include_statement: () => { throw Error('Unsupported include statement in closure relation'); },
  });
}

function resolveIfAlternative(alternative: PhpIfAlternative, file: string, resolveExpression: UpstreamExpressionMapper): ClosureIfAlternative {
  const handlers: readonly (readonly [string, () => ClosureIfAlternative])[] = [
    ['none', () => ({ kind: 'none' })],
    ['else_block', () => ({ kind: 'else_block', block: sequence(relationProject((alternative as Extract<PhpIfAlternative, { readonly kind: 'else_block' }>).block.statements, item => resolveClosureStatement(item, file, resolveExpression))) })],
    ['else_if', () => ({ kind: 'else_if', statement: resolveClosureStatement((alternative as Extract<PhpIfAlternative, { readonly kind: 'else_if' }>).statement, file, resolveExpression) as Extract<ClosureStatement, { readonly kind: 'if' }> })],
  ];
  return relationOptionFold(relationLookup(handlers, alternative.kind), () => ({ kind: 'none' }), factory => factory());
}

function resolveForeachTarget(target: PhpForeachTarget) {
  const handlers: readonly (readonly [string, () => { readonly kind: 'value'; readonly variable: ReturnType<typeof variable> } | { readonly kind: 'key_value'; readonly key: ReturnType<typeof variable>; readonly value: ReturnType<typeof variable> }])[] = [
    ['value', () => ({ kind: 'value' as const, variable: variable(target.variable) })],
    ['key_value', () => ({ kind: 'key_value' as const, key: variable((target as Extract<PhpForeachTarget, { readonly kind: 'key_value' }>).key), value: variable((target as Extract<PhpForeachTarget, { readonly kind: 'key_value' }>).value) })],
  ];
  return relationOptionFold(relationLookup(handlers, target.kind), () => ({ kind: 'value' as const, variable: variable('') }), factory => factory());
}

function resolveForClause(clause: PhpForClause, file: string, resolveExpression: UpstreamExpressionMapper): ClosureForClause {
  const handlers: readonly (readonly [string, () => ClosureForClause])[] = [
    ['empty', () => ({ kind: 'empty' })],
    ['expression', () => ({ kind: 'expression', value: resolveExpression((clause as Extract<PhpForClause, { readonly kind: 'expression' }>).value, file) })],
    ['assignment', () => ({ kind: 'assignment', value: resolveClosureForAssignment(clause as Extract<PhpForClause, { readonly kind: 'assignment' }>, file, resolveExpression) })],
  ];
  return relationOptionFold(relationLookup(handlers, clause.kind), () => ({ kind: 'empty' }), factory => factory());
}

function resolveCatchClause(clause: PhpCatchClause, file: string, resolveExpression: UpstreamExpressionMapper): ClosureCatchClause {
  return { exceptionType: className(clause.exceptionType), variable: variable(clause.variable), body: sequence(relationProject(clause.body.statements, item => resolveClosureStatement(item, file, resolveExpression))) };
}

function resolveFinallyClause(clause: PhpFinallyClause, file: string, resolveExpression: UpstreamExpressionMapper): ClosureFinallyClause {
  return relationGate(relationEqual(clause.kind, 'absent'), () => ({ kind: 'absent' }), () => ({ kind: 'present', block: sequence(relationProject((clause as Extract<PhpFinallyClause, { readonly kind: 'present' }>).block.statements, item => resolveClosureStatement(item, file, resolveExpression))) }));
}

function sourceSpanFromToken(file: string, token: { readonly startOffset: number; readonly endOffset: number }): import('../../../../types/upstream/provenance').SourceSpan { return { kind: 'source_span', file: createSourceFile(file), start: { kind: 'number_value', value: token.startOffset }, end: { kind: 'number_value', value: token.endOffset } }; }
