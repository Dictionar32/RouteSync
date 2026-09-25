import type { Expression, ClosureStatement, ClosureBody, ClosureForClause, ClosureCatchClause, ClosureFinallyClause, ClosureIfAlternative } from '../../../../types/upstream/expression';
import type { Assignment } from '../../../../types/upstream/assignment';
import { createSourceFile } from '../../../../types/upstream/names';
import type { PhpStatement, PhpAssignmentTarget, PhpForClause, PhpIfAlternative, PhpForeachTarget, PhpFinallyClause, PhpCatchClause } from '../../lexer/phpAstStatementTypes';
import { matchPhpStatement } from '../../lexer/phpAstAlgebra';
import type { UpstreamExpressionMapper } from './resourceUpstreamExpressionMappings';
import { className, mapAssignmentTarget, mapAssignmentOperator, assignmentReferenceMode, sequence, variable } from './resourceUpstreamExpressionMappings';

export function mapClosureBody(statements: readonly PhpStatement[], file: string, mapExpression: UpstreamExpressionMapper): ClosureBody {
  return { kind: 'statement_body', statements: sequence(statements.map(statement => mapClosureStatement(statement, file, mapExpression))) };
}

export function mapClosureAssignment(statement: Extract<PhpStatement, { readonly kind: 'assignment' }>, file: string, mapExpression: UpstreamExpressionMapper): Assignment {
  const target = mapAssignmentTarget(statement.target, mapExpression, file);
  return {
    kind: 'assignment',
    target,
    expression: mapExpression(statement.value, file),
    operator: mapAssignmentOperator(statement.operator.kind),
    reference: assignmentReferenceMode(statement.reference.kind),
    source: sourceSpanFromToken(file, statement.source),
  };
}


export function mapClosureForAssignment(clause: Extract<PhpForClause, { readonly kind: 'assignment' }>, file: string, mapExpression: UpstreamExpressionMapper): Assignment {
  const target = mapAssignmentTarget(clause.target, mapExpression, file);
  return {
    kind: 'assignment',
    target,
    expression: mapExpression(clause.value, file),
    operator: mapAssignmentOperator(clause.operator.kind),
    reference: assignmentReferenceMode(clause.reference.kind),
    source: sourceSpanFromToken(file, clause.source),
  };
}
export function mapClosureStatement(statement: PhpStatement, file: string, mapExpression: UpstreamExpressionMapper): ClosureStatement {
  return matchPhpStatement(statement, {
    expression_statement: node => ({ kind: 'expression', expression: mapExpression(node.expression, file) }),
    return_with_value: node => ({ kind: 'return_value', expression: mapExpression(node.expression, file) }),
    return_void: () => ({ kind: 'return_void' }),
    assignment: node => ({ kind: 'assignment', value: mapClosureAssignment(node, file, mapExpression) }),
    if_statement: node => ({ kind: 'if', condition: mapExpression(node.condition, file), thenBlock: node.thenBlock.statements.map(item => mapClosureStatement(item, file, mapExpression)), alternative: mapIfAlternative(node.alternative, file, mapExpression) }),
    foreach_statement: node => ({ kind: 'foreach', iterable: mapExpression(node.iterable, file), target: mapForeachTarget(node.target), body: node.body.statements.map(item => mapClosureStatement(item, file, mapExpression)) }),
    for_statement: node => ({ kind: 'for', initializer: mapForClause(node.initializer, file, mapExpression), condition: mapForClause(node.condition, file, mapExpression), update: mapForClause(node.update, file, mapExpression), body: node.body.statements.map(item => mapClosureStatement(item, file, mapExpression)) }),
    try_statement: node => ({ kind: 'try', body: node.body.statements.map(item => mapClosureStatement(item, file, mapExpression)), catches: node.catches.map(clause => mapCatchClause(clause, file, mapExpression)), finallyBlock: mapFinallyClause(node.finallyBlock, file, mapExpression) }),
    throw_statement: node => ({ kind: 'throw', expression: mapExpression(node.expression, file) }),
  });
}

function mapIfAlternative(alternative: PhpIfAlternative, file: string, mapExpression: UpstreamExpressionMapper): ClosureIfAlternative {
  switch (alternative.kind) {
    case 'none': return { kind: 'none' };
    case 'else_block': return { kind: 'else_block', block: alternative.block.statements.map(item => mapClosureStatement(item, file, mapExpression)) };
    case 'else_if': return { kind: 'else_if', statement: mapClosureStatement(alternative.statement, file, mapExpression) as Extract<ClosureStatement, { readonly kind: 'if' }> };
  }
}

function mapForeachTarget(target: PhpForeachTarget) {
  switch (target.kind) { case 'value': return { kind: 'value' as const, variable: variable(target.variable) }; case 'key_value': return { kind: 'key_value' as const, key: variable(target.key), value: variable(target.value) }; }
}

function mapForClause(clause: PhpForClause, file: string, mapExpression: UpstreamExpressionMapper): ClosureForClause {
  switch (clause.kind) {
    case 'empty': return { kind: 'empty' };
    case 'expression': return { kind: 'expression', value: mapExpression(clause.value, file) };
    case 'assignment': { const target = mapAssignmentTarget(clause.target, mapExpression, file); return { kind: 'assignment', value: { kind: 'assignment', target, expression: mapExpression(clause.value, file), operator: mapAssignmentOperator(clause.operator.kind), reference: assignmentReferenceMode(clause.reference.kind), source: sourceSpanFromToken(file, clause.source) } }; }
  }
}

function mapCatchClause(clause: PhpCatchClause, file: string, mapExpression: UpstreamExpressionMapper): ClosureCatchClause {
  return { exceptionType: className(clause.exceptionType), variable: variable(clause.variable), body: clause.body.statements.map(item => mapClosureStatement(item, file, mapExpression)) };
}

function mapFinallyClause(clause: PhpFinallyClause, file: string, mapExpression: UpstreamExpressionMapper): ClosureFinallyClause {
  switch (clause.kind) { case 'absent': return { kind: 'absent' }; case 'present': return { kind: 'present', block: clause.block.statements.map(item => mapClosureStatement(item, file, mapExpression)) }; }
}

function sourceSpanFromToken(file: string, token: { readonly startOffset: number; readonly endOffset: number }): import('../../../../types/upstream/provenance').SourceSpan { return { kind: 'source_span', file: createSourceFile(file), start: { kind: 'number_value', value: token.startOffset }, end: { kind: 'number_value', value: token.endOffset } }; }
