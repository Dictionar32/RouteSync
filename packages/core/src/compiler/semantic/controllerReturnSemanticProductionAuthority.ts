/**
 * Source-evidence authority for route-closure return semantics.
 *
 * This implementation no longer delegates closure-return production to the legacy
 * controllerAstCanonical subscanner. It consumes typed PHP AST evidence and produces
 * the existing ControllerReturnSemantic ADT. The expression projection's transitive
 * relation dependency remains a separate migration boundary and is not claimed closed.
 */
import type { ControllerReturnSemantic } from '../../types/upstream/controller';
import type { ControllerReturnSemanticProductionInput, ControllerReturnSemanticProductionInterface } from '../../types/upstream/controllerReturnSemanticProductionInterface';
import type { PhpAstValue } from '../frontend/php/phpAstExpressionTypes';
import type { PhpBlock, PhpStatement } from '../frontend/php/phpAstStatementTypes';
import type { Expression } from '../../types/upstream/expression';
import type { ResponseJsonPayload, ResponseStatus } from '../../types/upstream/response';
import type { HttpStatusCode } from '../../types/upstream/valueObjects';
import { phpAstExpressionProjectionOperations } from '../frontend/php/routeAst/phpAstExpressionSemanticAuthority';
import type { Sequence } from '../../types/upstream/collections';

function sequenceOf<T>(values: readonly T[]): Sequence<T> {
  return values.reduceRight<Sequence<T>>(
    (tail, head) => Object.freeze({ kind: 'cons', head, tail }),
    Object.freeze({ kind: 'empty' }),
  );
}

function statusCode(value: number): HttpStatusCode {
  return Object.freeze({ kind: 'http_status_code', value: Object.freeze({ kind: 'number_value', value }) });
}

function responseStatus(value: PhpAstValue | undefined): ResponseStatus {
  if (value !== undefined && value.kind === 'literal' && value.literalType === 'number') {
    const status = statusCode(value.value);
    return Object.freeze({ kind: 'response_status', value: status, origin: Object.freeze({ kind: 'source_explicit', status }) });
  }
  return Object.freeze({ kind: 'response_status', value: statusCode(200), origin: Object.freeze({ kind: 'framework_default' }) });
}

function positionalArgument(value: PhpAstValue, position: number): PhpAstValue | undefined {
  if (value.kind !== 'method_chain' && value.kind !== 'function_call' && value.kind !== 'static_call') return undefined;
  const positional = value.arguments.filter(argument => argument.kind === 'positional');
  return positional[position]?.value;
}

function expression(value: PhpAstValue, file: string): Expression {
  return phpAstExpressionProjectionOperations.projectExpression(value, file);
}

function responsePayload(value: PhpAstValue, file: string): ResponseJsonPayload {
  return Object.freeze({ kind: 'expression', expression: expression(value, file) });
}

function returnValuesFromBlock(block: PhpBlock): readonly PhpAstValue[] {
  const output: PhpAstValue[] = [];
  for (const statement of block.statements) output.push(...returnValuesFromStatement(statement));
  return Object.freeze(output);
}

function returnValuesFromStatement(statement: PhpStatement): readonly PhpAstValue[] {
  switch (statement.kind) {
    case 'return_with_value':
      return Object.freeze([statement.expression]);
    case 'if_statement':
      return Object.freeze([
        ...returnValuesFromBlock(statement.thenBlock),
        ...(statement.alternative.kind === 'else_block'
          ? returnValuesFromBlock(statement.alternative.block)
          : statement.alternative.kind === 'else_if'
            ? returnValuesFromBlock(statement.alternative.statement.thenBlock)
            : []),
      ]);
    case 'foreach_statement':
    case 'for_statement':
      return returnValuesFromBlock(statement.body);
    case 'try_statement':
      return Object.freeze([
        ...returnValuesFromBlock(statement.body),
        ...statement.catches.flatMap(catcher => returnValuesFromBlock(catcher.body)),
        ...(statement.finallyBlock.kind === 'present' ? returnValuesFromBlock(statement.finallyBlock.block) : []),
      ]);
    default:
      return Object.freeze([]);
  }
}

function transactionReturnValues(value: PhpAstValue): readonly PhpAstValue[] {
  if (value.kind !== 'static_call' || value.classReference.sourceName !== 'DB' || value.method !== 'transaction') return Object.freeze([]);
  const closure = value.arguments.find(argument => argument.kind === 'positional' && argument.value.kind === 'closure');
  if (closure === undefined || closure.kind !== 'positional' || closure.value.kind !== 'closure') return Object.freeze([]);
  return returnValuesFromBlock(closure.value.body);
}

function responseMethodSemantic(value: Extract<PhpAstValue, { readonly kind: 'method_chain' }>, file: string): ControllerReturnSemantic | undefined {
  if (value.receiver.kind !== 'function_call' || value.receiver.functionName !== 'response') return undefined;
  const semanticExpression = expression(value, file);
  const status = responseStatus(positionalArgument(value, 1));
  switch (value.property) {
    case 'json': {
      const payload = positionalArgument(value, 0);
      return Object.freeze({ kind: 'response', result: Object.freeze({ kind: 'content', body: Object.freeze({ kind: 'json', shape: Object.freeze({ kind: 'single', payload: payload === undefined ? Object.freeze({ kind: 'expression', expression: semanticExpression }) : responsePayload(payload, file) }) }), status }), expression: semanticExpression });
    }
    case 'jsonp': {
      const callback = positionalArgument(value, 0);
      const payload = positionalArgument(value, 1);
      return Object.freeze({ kind: 'response', result: Object.freeze({ kind: 'content', body: Object.freeze({ kind: 'json_with_callback', shape: Object.freeze({ kind: 'single', payload: payload === undefined ? Object.freeze({ kind: 'expression', expression: semanticExpression }) : responsePayload(payload, file) }), callback: callback === undefined ? semanticExpression : expression(callback, file) }), status }), expression: semanticExpression });
    }
    case 'noContent':
      return Object.freeze({ kind: 'response', result: Object.freeze({ kind: 'no_content', status }), expression: semanticExpression });
    case 'file': {
      const fileValue = positionalArgument(value, 0);
      return Object.freeze({ kind: 'response', result: Object.freeze({ kind: 'content', body: Object.freeze({ kind: 'file', file: fileValue === undefined ? semanticExpression : expression(fileValue, file) }), status }), expression: semanticExpression });
    }
    case 'stream':
    case 'eventStream': {
      const callback = positionalArgument(value, 0);
      const body = value.property === 'stream'
        ? Object.freeze({ kind: 'stream' as const, callback: callback === undefined ? semanticExpression : expression(callback, file) })
        : Object.freeze({ kind: 'event_stream' as const, callback: callback === undefined ? semanticExpression : expression(callback, file) });
      return Object.freeze({ kind: 'response', result: Object.freeze({ kind: 'content', body, status }), expression: semanticExpression });
    }
    case 'streamJson': {
      const payload = positionalArgument(value, 0);
      return Object.freeze({ kind: 'response', result: Object.freeze({ kind: 'content', body: Object.freeze({ kind: 'stream_json', payload: payload === undefined ? semanticExpression : expression(payload, file) }), status }), expression: semanticExpression });
    }
    case 'streamDownload': {
      const callback = positionalArgument(value, 0);
      const filename = positionalArgument(value, 1);
      return Object.freeze({ kind: 'response', result: Object.freeze({ kind: 'content', body: Object.freeze({ kind: 'stream_download', callback: callback === undefined ? semanticExpression : expression(callback, file), filename: filename === undefined ? semanticExpression : expression(filename, file) }), status }), expression: semanticExpression });
    }
    case 'view': {
      const view = positionalArgument(value, 0);
      const data = positionalArgument(value, 1);
      return Object.freeze({ kind: 'response', result: Object.freeze({ kind: 'content', body: Object.freeze({ kind: 'view', view: Object.freeze({ kind: 'view', view: view === undefined ? semanticExpression : expression(view, file), data: data === undefined ? semanticExpression : expression(data, file) }) }), status }), expression: semanticExpression });
    }
    default:
      return undefined;
  }
}

function returnSemantic(value: PhpAstValue, file: string): ControllerReturnSemantic {
  const nestedReturns = transactionReturnValues(value);
  if (nestedReturns.length > 0) return returnSetSemantic(nestedReturns, file);
  const semanticExpression = expression(value, file);
  switch (value.kind) {
    case 'method_chain': {
      const response = responseMethodSemantic(value, file);
      if (response !== undefined) return response;
      if (value.property === 'download') {
        const filename = positionalArgument(value, 0);
        return Object.freeze({ kind: 'response', result: Object.freeze({ kind: 'content', body: Object.freeze({ kind: 'download', file: expression(value.receiver, file), filename: filename === undefined ? semanticExpression : expression(filename, file) }), status: responseStatus(undefined) }), expression: semanticExpression });
      }
      return Object.freeze({ kind: 'expression', expression: semanticExpression });
    }
    case 'function_call':
      if (value.functionName === 'redirect') {
        const target = value.arguments.find(argument => argument.kind === 'positional');
        return Object.freeze({ kind: 'response', result: Object.freeze({ kind: 'redirect', redirect: Object.freeze({ kind: 'internal', target: target === undefined ? semanticExpression : expression(target.value, file) }), status: Object.freeze({ kind: 'response_status', value: statusCode(302), origin: Object.freeze({ kind: 'framework_default' }) }) }), expression: semanticExpression });
      }
      return Object.freeze({ kind: 'expression', expression: semanticExpression });
    case 'literal':
      return value.literalType === 'string'
        ? Object.freeze({ kind: 'response', result: Object.freeze({ kind: 'content', body: Object.freeze({ kind: 'text', body: semanticExpression }), status: responseStatus(undefined) }), expression: semanticExpression })
        : Object.freeze({ kind: 'expression', expression: semanticExpression });
    case 'nested_array':
      return Object.freeze({ kind: 'response', result: Object.freeze({ kind: 'content', body: Object.freeze({ kind: 'json', shape: Object.freeze({ kind: 'single', payload: Object.freeze({ kind: 'expression', expression: semanticExpression }) }) }), status: responseStatus(undefined) }), expression: semanticExpression });
    default:
      return Object.freeze({ kind: 'expression', expression: semanticExpression });
  }
}

function returnSetSemantic(values: readonly PhpAstValue[], file: string): ControllerReturnSemantic {
  if (values.length === 0) return Object.freeze({ kind: 'absent' });
  const semantics = values.map(value => returnSemantic(value, file));
  if (semantics.length === 1) return semantics[0];
  return Object.freeze({ kind: 'branches', branches: sequenceOf(semantics), expression: expression(values[0], file) });
}

function produceClosureReturnSemantic(input: ControllerReturnSemanticProductionInput<readonly PhpAstValue[]>): ControllerReturnSemantic {
  return returnSetSemantic(input.method, input.sourceFile.value.value);
}

export const controllerReturnSemanticProductionAuthority: ControllerReturnSemanticProductionInterface<readonly PhpAstValue[]> = Object.freeze({
  kind: 'controller_return_semantic_production',
  ownership: 'produces-the-existing-ControllerReturnSemantic-ADT-for-the-exact-method-source-subject',
  produce: produceClosureReturnSemantic,
});
