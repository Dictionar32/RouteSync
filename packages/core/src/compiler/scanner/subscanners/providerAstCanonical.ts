import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import * as path from 'node:path';
import { readSourceText } from './scannerUtils';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { collectPhpFiles } from './scannerUtils';
import { mapResourcePhpAstToUpstream } from './resource/resourceUpstreamExpressionCanonical';
import { mapClosureBody } from './resource/resourceUpstreamExpressionClosure';
import type { ClosureStatement } from '../../../types/upstream/expression';
import type { ProviderAst } from '../../../types/upstream/ast';
import type { ProviderDefinition, ContainerOperationName, ProviderContainerOperation, ProviderSourceAst } from '../../../types/upstream/application';
import type { Expression, ExpressionArguments } from '../../../types/upstream/expression';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { StringValue } from '../../../types/upstream/valueObjects';
import type { ControllerMethodAst } from '../lexer/controllerAstTypes';
import type { PhpStatement } from '../lexer/phpAstTypes';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const source = (file: string, line: number): SourceSpan => ({
  kind: 'source_span',
  file: { kind: 'source_file', value: stringValue(file) },
  start: { kind: 'number_value', value: line },
  end: { kind: 'number_value', value: line },
});

function className(tokens: readonly { readonly value: string }[]): string {
  for (let index = 0; index + 1 < tokens.length; index += 1) {
    if (tokens[index].value === 'class') return tokens[index + 1].value;
  }
  throw new Error('Provider class declaration not found');
}

function methodExpression(method: ControllerMethodAst, file: string): Expression {
  const methodSource = source(file, Number(method.source.line));
  return {
    kind: 'closure',
    value: {
      kind: 'closure',
      parameters: { kind: 'variable_names', items: { kind: 'empty' } },
      captures: { kind: 'closure_captures', items: { kind: 'empty' } },
      body: mapClosureBody(method.body.statements, file, mapResourcePhpAstToUpstream),
      source: methodSource,
    },
    source: methodSource,
  };
}


function sequence<T>(items: readonly T[]): import('../../../types/upstream/collections').Sequence<T> {
  return items.reduceRight<import('../../../types/upstream/collections').Sequence<T>>(
    (tail, head) => ({ kind: 'cons', head, tail }),
    { kind: 'empty' },
  );
}

function expressionArguments(expression: Expression): ExpressionArguments | undefined {
  if (expression.kind === 'method') return expression.arguments;
  if (expression.kind === 'nullsafe_method') return expression.arguments;
  return undefined;
}

function containerOperationName(expression: Expression): ContainerOperationName | undefined {
  if (expression.kind !== 'method' && expression.kind !== 'nullsafe_method') return undefined;
  if (expression.operation.kind !== 'domain') return undefined;
  return expression.operation.name;
}

function isContainerReceiver(expression: Expression): boolean {
  if (expression.kind === 'property') {
    return expression.property.value.value === 'app' && expression.receiver.kind === 'variable' && expression.receiver.name.value.value === 'this';
  }
  if (expression.kind === 'method' || expression.kind === 'nullsafe_method') return isContainerReceiver(expression.receiver);
  return false;
}

function collectContainerOperations(expression: Expression, operations: ProviderContainerOperation[]): void {
  const name = containerOperationName(expression);
  if (name !== undefined && isContainerReceiver(expression.receiver)) {
    const args = expressionArguments(expression);
    if (args !== undefined) operations.push({ kind: 'provider_container_operation', name, arguments: args, source: expression.source });
  }
  if (expression.kind === 'closure') {
    if (expression.value.body.kind === 'expression_body') collectContainerOperations(expression.value.body.expression, operations);
    else {
      let items = expression.value.body.statements.items;
      while (items.kind === 'cons') {
        collectContainerOperationsFromClosureStatement(items.head, operations);
        items = items.tail;
      }
    }
    return;
  }
  if (expression.kind === 'method' || expression.kind === 'nullsafe_method') {
    collectContainerOperations(expression.receiver, operations);
    let args = expression.arguments.items;
    while (args.kind === 'cons') { collectContainerOperations(args.head, operations); args = args.tail; }
  }
}

function collectContainerOperationsFromClosureStatement(statement: import('../../../types/upstream/expression').ClosureStatement, operations: ProviderContainerOperation[]): void {
  switch (statement.kind) {
    case 'expression': collectContainerOperations(statement.expression, operations); return;
    case 'return_value': collectContainerOperations(statement.expression, operations); return;
    case 'assignment': collectContainerOperations(statement.value.expression, operations); return;
    case 'throw': collectContainerOperations(statement.expression, operations); return;
    case 'if': collectContainerOperations(statement.condition, operations); { let items = statement.thenBlock.items; while (items.kind === 'cons') { collectContainerOperationsFromClosureStatement(items.head, operations); items = items.tail; } return; }
    case 'foreach': collectContainerOperations(statement.iterable, operations); { let items = statement.body.items; while (items.kind === 'cons') { collectContainerOperationsFromClosureStatement(items.head, operations); items = items.tail; } return; }
    case 'for': return;
    case 'try': { let items = statement.body.items; while (items.kind === 'cons') { collectContainerOperationsFromClosureStatement(items.head, operations); items = items.tail; } return; }
    case 'return_void': return;
  }
}

export function buildProviderAstFromSource(sourceAst: ProviderSourceAst, fileValue: import('../../../types/upstream/provenance').SourceFile, span: SourceSpan): ProviderAst {
  const register = sourceAst.methods.find(method => method.name === 'register');
  const boot = sourceAst.methods.find(method => method.name === 'boot');
  if (!register || !boot) throw new Error(`Provider register/boot methods not found: ${fileValue.value.value}`);
  const registerExpression = methodExpression(register, fileValue.value.value);
  const bootExpression = methodExpression(boot, fileValue.value.value);
  const operations: ProviderContainerOperation[] = [];
  collectContainerOperations(registerExpression, operations);
  collectContainerOperations(bootExpression, operations);
  const definition: ProviderDefinition = {
    kind: 'provider',
    name: { kind: 'class_name', value: sourceAst.className.value },
    file: fileValue,
    register: registerExpression,
    boot: bootExpression,
    containerOperations: { kind: 'provider_container_operations', items: sequence(operations) },
    source: span,
  };
  return { kind: 'provider_ast', definition, source: span };
}

export async function scanProviderAsts(sourceProject: SourceProjectIdentity): Promise<readonly ProviderAst[]> {
    const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'app', 'Providers');
  const files = await collectPhpFiles(directory);
  const { providerProducer } = await import('./providerProducer');
  const asts: ProviderAst[] = [];
  for (const file of files) {
    const text = await readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(text);
    const name = className(tokens);
    const declaration = LaravelSourceLexer.parseControllerDeclaration(text, tokens, createAstIdentifier(name));
    const span = source(file, Number(declaration.source.line));
    const sourceAst: ProviderSourceAst = {
      kind: 'provider_source_ast',
      className: createAstIdentifier(name),
      methods: declaration.methods,
      source: span,
    };
    asts.push(providerProducer.produce({
      source: sourceAst,
      file: { kind: 'source_file', value: stringValue(file) },
      sourceSpan: span,
    }));
  }
  return Object.freeze(asts);
}
