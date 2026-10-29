import { PHP_STATEMENT_KINDS } from '../phpAstStatementKinds';
import type { Expression, ClosureStatement, ClosureBody, ClosureForClause, ClosureCatchClause, ClosureFinallyClause, ClosureIfAlternative } from '../../../../types/upstream/expression';
import type { Assignment } from '../../../../types/upstream/assignment';
import { sourceFileIdentityFactory, stringValue } from '../../../../types/upstream/names';
import type { PhpStatement, PhpAssignmentTarget, PhpForClause, PhpIfAlternative, PhpForeachTarget, PhpFinallyClause, PhpCatchClause } from '../phpAstStatementTypes';
import { matchPhpStatement } from '../phpAstAlgebra';
import type { UpstreamExpressionMapper } from './phpAstExpressionMappings';
import { className, phpAstExpressionMappingOperations, sequence, variable } from './phpAstExpressionMappings';

export interface PhpAstExpressionClosureOperationsInterface {
  readonly resolveClosureBody: (statements: readonly PhpStatement[], file: string, resolveExpression: UpstreamExpressionMapper) => ClosureBody;
  readonly resolveClosureAssignment: (statement: Extract<PhpStatement, { readonly kind: 'assignment' }>, file: string, resolveExpression: UpstreamExpressionMapper) => Assignment;
  readonly resolveClosureForAssignment: (clause: Extract<PhpForClause, { readonly kind: 'assignment' }>, file: string, resolveExpression: UpstreamExpressionMapper) => Assignment;
  readonly resolveClosureStatement: (statement: PhpStatement, file: string, resolveExpression: UpstreamExpressionMapper) => ClosureStatement;
}



function resolveClosureBody(statements: readonly PhpStatement[], file: string, resolveExpression: UpstreamExpressionMapper): ClosureBody {
  return { kind: 'statement_body', statements: sequence(statements.map(statement => resolveClosureStatement(statement, file, resolveExpression))) };
}

function resolveClosureAssignment(statement: Extract<PhpStatement, { readonly kind: 'assignment' }>, file: string, resolveExpression: UpstreamExpressionMapper): Assignment {
  const target = phpAstExpressionMappingOperations.resolveAssignmentTarget(statement.target, resolveExpression, file);
  return {
    kind: 'assignment',
    target,
    expression: resolveExpression(statement.value, file),
    operator: phpAstExpressionMappingOperations.resolveAssignmentOperator(statement.operator.kind),
    reference: phpAstExpressionMappingOperations.assignmentReferenceMode(statement.reference.kind),
    source: sourceSpanFromToken(file, statement.source),
  };
}

function resolveClosureForAssignment(clause: Extract<PhpForClause, { readonly kind: 'assignment' }>, file: string, resolveExpression: UpstreamExpressionMapper): Assignment {
  const target = phpAstExpressionMappingOperations.resolveAssignmentTarget(clause.target, resolveExpression, file);
  return {
    kind: 'assignment',
    target,
    expression: resolveExpression(clause.value, file),
    operator: phpAstExpressionMappingOperations.resolveAssignmentOperator(clause.operator.kind),
    reference: phpAstExpressionMappingOperations.assignmentReferenceMode(clause.reference.kind),
    source: sourceSpanFromToken(file, clause.source),
  };
}

function resolveClosureStatement(statement: PhpStatement, file: string, resolveExpression: UpstreamExpressionMapper): ClosureStatement {
  return matchPhpStatement(statement, {
    expression_statement: node => ({ kind: 'expression', expression: resolveExpression(node.expression, file) }),
    return_with_value: node => ({ kind: 'return_value', expression: resolveExpression(node.expression, file) }),
    return_void: () => ({ kind: 'return_void' }),
    assignment: node => ({ kind: 'assignment', value: resolveClosureAssignment(node, file, resolveExpression) }),
    [PHP_STATEMENT_KINDS.conditional]: node => ({ kind: 'if', condition: resolveExpression(node.condition, file), thenBlock: sequence(node.thenBlock.statements.map(item => resolveClosureStatement(item, file, resolveExpression))), alternative: resolveIfAlternative(node.alternative, file, resolveExpression) }),
    [PHP_STATEMENT_KINDS.collectionRecurrence]: node => ({ kind: 'foreach', iterable: resolveExpression(node.iterable, file), target: resolveForeachTarget(node.target), body: sequence(node.body.statements.map(item => resolveClosureStatement(item, file, resolveExpression))) }),
    [PHP_STATEMENT_KINDS.countedRecurrence]: node => ({ kind: 'for', initializer: resolveForClause(node.initializer, file, resolveExpression), condition: resolveForClause(node.condition, file, resolveExpression), update: resolveForClause(node.update, file, resolveExpression), body: sequence(node.body.statements.map(item => resolveClosureStatement(item, file, resolveExpression))) }),
    try_statement: node => ({ kind: 'try', body: sequence(node.body.statements.map(item => resolveClosureStatement(item, file, resolveExpression))), catches: sequence(node.catches.map(clause => resolveCatchClause(clause, file, resolveExpression))), finallyBlock: resolveFinallyClause(node.finallyBlock, file, resolveExpression) }),
    throw_statement: node => ({ kind: 'throw', expression: resolveExpression(node.expression, file) }),
    while_statement: node => ({ kind: 'unsupported', reason: { kind: 'while_statement' }, source: sourceSpanFromToken(file, node.source) }),
    switch_statement: node => ({ kind: 'unsupported', reason: { kind: 'switch_statement' }, source: sourceSpanFromToken(file, node.source) }),
    unset_statement: node => ({ kind: 'unsupported', reason: { kind: 'unset_statement' }, source: sourceSpanFromToken(file, node.source) }),
    include_statement: node => ({ kind: 'unsupported', reason: { kind: 'include_statement' }, source: sourceSpanFromToken(file, node.source) }),
  });
}

function resolveIfAlternative(alternative: PhpIfAlternative, file: string, resolveExpression: UpstreamExpressionMapper): ClosureIfAlternative {
  switch (alternative.kind) {
    case 'none': return { kind: 'none' };
    case 'else_block': return { kind: 'else_block', block: sequence(alternative.block.statements.map(item => resolveClosureStatement(item, file, resolveExpression))) };
    case 'else_if': return { kind: 'else_if', statement: resolveClosureStatement(alternative.statement, file, resolveExpression) };
  }
}

function resolveForeachTarget(target: PhpForeachTarget): { readonly kind: 'value'; readonly variable: ReturnType<typeof variable> } | { readonly kind: 'key_value'; readonly key: ReturnType<typeof variable>; readonly value: ReturnType<typeof variable> } {
  switch (target.kind) {
    case 'value': return { kind: 'value', variable: variable(target.variable) };
    case 'key_value': return { kind: 'key_value', key: variable(target.key), value: variable(target.value) };
  }
}

function resolveForClause(clause: PhpForClause, file: string, resolveExpression: UpstreamExpressionMapper): ClosureForClause {
  switch (clause.kind) {
    case 'empty': return { kind: 'empty' };
    case 'expression': return { kind: 'expression', value: resolveExpression(clause.value, file) };
    case 'assignment': return { kind: 'assignment', value: resolveClosureForAssignment(clause, file, resolveExpression) };
  }
}

function resolveCatchClause(clause: PhpCatchClause, file: string, resolveExpression: UpstreamExpressionMapper): ClosureCatchClause {
  return { exceptionType: className(clause.exceptionType), variable: variable(clause.variable), body: sequence(clause.body.statements.map(item => resolveClosureStatement(item, file, resolveExpression))) };
}

function resolveFinallyClause(clause: PhpFinallyClause, file: string, resolveExpression: UpstreamExpressionMapper): ClosureFinallyClause {
  switch (clause.kind) {
    case 'absent': return { kind: 'absent' };
    case 'present': return { kind: 'present', block: sequence(clause.block.statements.map(item => resolveClosureStatement(item, file, resolveExpression))) };
  }
}

function sourceSpanFromToken(file: string, token: { readonly startOffset: number; readonly endOffset: number }): import('../../../../types/upstream/provenance').SourceSpan { return { kind: 'source_span', file: sourceFileIdentityFactory.create(stringValue.create(file)), start: { kind: 'number_value', value: token.startOffset }, end: { kind: 'number_value', value: token.endOffset } }; }


export const phpAstExpressionClosureOperations: PhpAstExpressionClosureOperationsInterface = Object.freeze({
  resolveClosureBody,
  resolveClosureAssignment,
  resolveClosureForAssignment,
  resolveClosureStatement,
});
