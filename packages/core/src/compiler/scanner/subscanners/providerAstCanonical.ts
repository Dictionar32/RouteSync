import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import * as path from 'node:path';
import { readSourceText } from './scannerUtils';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { collectPhpFiles } from './scannerUtils';
import { mapResourcePhpAstToUpstream } from './resource/resourceUpstreamExpressionCanonical';
import { resolveClosureBody } from './resource/resourceUpstreamExpressionClosure';
import type { ClosureStatement, ExpressionArgument } from '../../../types/upstream/expression';
import { createDomainAstJudgment, type ProviderAst } from '../../../types/upstream/ast';
import type { ProviderDefinition, ProviderContainerOperation, ProviderContainerOperationName, ProviderContextualBinding, ProviderContainerBinding, ProviderContainerBindings, ProviderContextualGive, ProviderContainerLifecycleHook, ProviderContainerResolution, ProviderContainerAlias, ProviderContainerInvocation, ProviderContainerBoundCheck, ProviderContainerTagging, ProviderContainerTaggedResolution, ProviderContainerRegistration, ProviderBindingAttribute, ProviderBindingAttributes, ExpressionArgumentsOption } from '../../../types/upstream/application';
import type { Expression, ExpressionArguments } from '../../../types/upstream/expression';
import type { ProviderSourceEvidence, ProviderMethodEvidence } from '../../../types/upstream/providerEvidence';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { StringValue } from '../../../types/upstream/valueObjects';
import { relationGate, relationSome, relationNone, relationResolve, type RelationOption } from '../../../semantic/foundation/semanticRelations';
import { RELATION_NONE, relationIsNone, relationIsPresent, type RelationMaybe, type RelationNone } from '../../../semantic/foundation/relationalSequence';
import { relationLookup } from '../../../semantic/foundation/relationalSequence';
import { relationContains } from '../../../semantic/foundation/relationMembership';
import { relationOptionFold, relationAdvanceIndex, relationFirstOption, relationProject, relationSelect, relationAll, relationAny } from '../../../semantic/foundation/relationalSequence';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const source = (file: string, line: number): SourceSpan => ({
  kind: 'source_span',
  file: { kind: 'source_file', value: stringValue(file) },
  start: { kind: 'number_value', value: line },
  end: { kind: 'number_value', value: line },
});

function className(tokens: readonly { readonly value: string }[]): string {
  const seek = (index: number): RelationOption<string> => relationGate(
    relationAdvanceIndex(index, 1) >= tokens.length,
    () => relationNone(),
    () => relationGate(Object.is(tokens[index].value, 'class'), () => relationSome(tokens[relationAdvanceIndex(index, 1)].value), () => seek(relationAdvanceIndex(index, 1))),
  );
  return relationOptionFold(seek(0), () => { throw Error('Provider class declaration not found'); }, value => value);
}

function methodExpression(method: ProviderMethodEvidence): Expression {
  return method.body;
}


function sequence<T>(items: readonly T[]): import('../../../types/upstream/collections').Sequence<T> {
  const build = (index: number): import('../../../types/upstream/collections').Sequence<T> => relationGate(
    index < 0,
    () => ({ kind: 'empty' }),
    () => ({ kind: 'cons', head: items[index], tail: build(index - 1) }),
  );
  return build(items.length - 1);
}

function expressionArguments(expression: Expression): RelationOption<ExpressionArguments> {
  return relationGate(
    Object.is(expression.kind, 'method'),
    () => relationSome((expression as Extract<Expression, { readonly kind: 'method' }>).arguments),
    () => relationGate(
      Object.is(expression.kind, 'nullsafe_method'),
      () => relationSome((expression as Extract<Expression, { readonly kind: 'nullsafe_method' }>).arguments),
      () => relationNone(),
    ),
  );
}

const providerContainerOperationNames = Object.freeze([
  'bind', 'bind_if', 'singleton', 'singleton_if', 'scoped', 'scoped_if',
  'instance', 'alias', 'make', 'make_with', 'bound', 'call', 'when', 'needs', 'give', 'give_tagged', 'give_config',
  'extend', 'resolving', 'after_resolving', 'rebinding', 'before_resolving', 'after_resolving_attribute', 'when_has_attribute',
]);

function containerOperationName(expression: Expression): RelationOption<ProviderContainerOperationName> {
  return relationGate(
    relationAny([Object.is(expression.kind, 'method'), Object.is(expression.kind, 'nullsafe_method')]),
    () => relationGate(
      Object.is(expression.operation.kind, 'domain'),
      () => {
        const name = expression.operation.name.value.value;
        return relationGate(relationContains(providerContainerOperationNames, name), () => relationSome(name as ProviderContainerOperationName), () => relationNone());
      },
      () => relationNone(),
    ),
    () => relationNone(),
  );
}

function isContainerReceiver(expression: Expression): boolean {
  return relationGate(
    Object.is(expression.kind, 'property'),
    () => relationAll([Object.is(expression.property.value.value, 'app'), Object.is(expression.receiver.kind, 'variable'), Object.is(expression.receiver.name.value.value, 'this')]),
    () => relationGate(
      relationAny([Object.is(expression.kind, 'method'), Object.is(expression.kind, 'nullsafe_method')]),
      () => isContainerReceiver(expression.receiver),
      () => false,
    ),
  );
}

function collectContainerOperations(expression: Expression, operations: ProviderContainerOperation[]): void {
  const resolvedName = containerOperationName(expression);
  const receiverMatch = relationGate(
    relationAny([Object.is(expression.kind, 'method'), Object.is(expression.kind, 'nullsafe_method')]),
    () => isContainerReceiver(expression.receiver),
    () => false,
  );
  relationOptionFold(resolvedName, () => {}, name => relationGate(
    receiverMatch,
    () => relationOptionFold(expressionArguments(expression), () => {}, args => {
      operations.push({ kind: 'provider_container_operation', name, arguments: args, source: expression.source });
    }),
    () => {},
  ));
  relationGate(Object.is(expression.kind, 'closure'), () => {
    relationGate(Object.is(expression.value.body.kind, 'expression_body'), () => {
      collectContainerOperations(expression.value.body.expression, operations);
    }, () => {
      const visit = (items: import('../../../types/upstream/collections').Sequence<import('../../../types/upstream/expression').ClosureStatement>): void => relationGate(
        Object.is(items.kind, 'empty'),
        () => {},
        () => { collectContainerOperationsFromClosureStatement(items.head, operations); visit(items.tail); },
      );
      visit(expression.value.body.statements.items);
    });
  }, () => {
    relationGate(relationAny([Object.is(expression.kind, 'method'), Object.is(expression.kind, 'nullsafe_method')]), () => {
      collectContainerOperations(expression.receiver, operations);
      const visitArgs = (items: import('../../../types/upstream/collections').ExpressionArguments['items']): void => relationGate(
        Object.is(items.kind, 'empty'),
        () => {},
        () => { collectContainerOperations(items.head.value, operations); visitArgs(items.tail); },
      );
      visitArgs(expression.arguments.items);
    }, () => {});
  });
}


function semanticBindingAttributeName(value: string): RelationOption<ProviderBindingAttribute['name']> {
  return relationLookup([
    ['Bind', 'bind'],
    ['BindWhen', 'bind_when'],
    ['Singleton', 'singleton'],
    ['Scoped', 'scoped'],
  ] as const, value);
}

function lastPathSegment(value: string): string {
  const parts = value.split('\\');
  return parts[relationAdvanceIndex(parts.length, -1)];
}

function expressionArgument(argument: import('../lexer/controllerAstTypes').ControllerParameterAttributeArgumentAst, file: string): ExpressionArgument {
  return relationGate(
    Object.is(argument.kind, 'named'),
    () => ({ kind: 'named', name: { kind: 'expression_argument_name', value: stringValue(argument.name.value) }, value: mapResourcePhpAstToUpstream(argument.value, file) }),
    () => relationGate(
      Object.is(argument.kind, 'unpacked'),
      () => ({ kind: 'unpacked', value: mapResourcePhpAstToUpstream(argument.value, file) }),
      () => ({ kind: 'positional', value: mapResourcePhpAstToUpstream(argument.value, file) }),
    ),
  );
}

function semanticBindingAttributes(source: ProviderSourceEvidence, _file: string): ProviderBindingAttributes {
  const accepted = relationSelect(source.attributes, attribute => relationIsPresent(semanticBindingAttributeName(attribute.name.value)));
  const items = relationProject(accepted, attribute => relationOptionFold(
    semanticBindingAttributeName(attribute.name.value),
    () => { throw Error('Provider binding attribute relation became absent after selection'); },
    name => ({
      kind: 'provider_binding_attribute',
      name,
      arguments: attribute.arguments,
      source: attribute.source,
    }),
  ));
  return { kind: 'provider_binding_attributes', items: sequence(items) };
}

function sourceSpanFromToken(token: { readonly line: string | number }, file: string): SourceSpan {
  const line = Number(token.line);
  return source(file, line);
}

function expressionArgumentList(value: RelationMaybe<ExpressionArgument>): ExpressionArguments {
  return relationGate(
    relationIsNone(value),
    () => ({ kind: 'expression_arguments', items: { kind: 'empty' } }),
    () => ({ kind: 'expression_arguments', items: { kind: 'cons', head: value, tail: { kind: 'empty' } } }),
  );
}

function argumentOption(items: import('../../../types/upstream/expression').ExpressionArguments['items'], offset: number): RelationMaybe<ExpressionArgument> {
  return relationGate(
    Object.is(items.kind, 'cons'),
    () => relationGate(Object.is(offset, 0), () => items.head, () => argumentOption(items.tail, relationAdvanceIndex(offset, -1))),
    () => RELATION_NONE,
  );
}

function parametersOption(items: import('../../../types/upstream/expression').ExpressionArguments['items']): ExpressionArgumentsOption {
  return relationGate(
    Object.is(items.kind, 'cons'),
    () => relationGate(Object.is(items.tail.kind, 'empty'), () => ({ kind: 'absent' }), () => ({ kind: 'present', value: { kind: 'expression_arguments', items: items.tail } })),
    () => ({ kind: 'absent' }),
  );
}

function isGiveName(name: ProviderContainerOperationName): boolean {
  return relationAny([
    Object.is(name, 'give'),
    Object.is(name, 'give_tagged'),
    Object.is(name, 'give_config'),
  ]);
}

function contextualBindingOption(operations: readonly ProviderContainerOperation[], index: number): RelationOption<{ readonly when: ProviderContainerOperation; readonly needs: ProviderContainerOperation; readonly give: ProviderContainerOperation }> {
  return relationGate(
    relationAll([
      relationAdvanceIndex(index, 2) < operations.length,
      Object.is(operations[index].name, 'when'),
      Object.is(operations[relationAdvanceIndex(index, 1)].name, 'needs'),
      isGiveName(operations[relationAdvanceIndex(index, 2)].name),
    ]),
    () => relationSome({ when: operations[index], needs: operations[relationAdvanceIndex(index, 1)], give: operations[relationAdvanceIndex(index, 2)] }),
    () => relationNone(),
  );
}

function bindingOption(operation: ProviderContainerOperation): RelationOption<ProviderContainerBinding> {
  const lifecycleNames: readonly ProviderContainerLifecycleHook['operation'][] = [
    'extend', 'resolving', 'after_resolving', 'rebinding', 'before_resolving', 'after_resolving_attribute', 'when_has_attribute',
  ];
  return relationGate(
    lifecycleNames.includes(operation.name as ProviderContainerLifecycleHook['operation']),
    () => relationSome({ kind: 'provider_container_lifecycle_hook', operation: operation.name as ProviderContainerLifecycleHook['operation'], arguments: operation.arguments, source: operation.source }),
    () => relationGate(
      relationAny([Object.is(operation.name, 'make'), Object.is(operation.name, 'make_with')]),
      () => relationSome({ kind: 'provider_container_resolution', operation: operation.name, target: expressionArgumentList(argumentOption(operation.arguments.items, 0)), parameters: parametersOption(operation.arguments.items), source: operation.source } satisfies ProviderContainerResolution),
      () => relationGate(
        Object.is(operation.name, 'alias'),
        () => relationSome({ kind: 'provider_container_alias', target: expressionArgumentList(argumentOption(operation.arguments.items, 0)), alias: expressionArgumentList(argumentOption(operation.arguments.items, 1)), source: operation.source } satisfies ProviderContainerAlias),
        () => relationGate(
          Object.is(operation.name, 'call'),
          () => relationSome({ kind: 'provider_container_invocation', operation: 'call', callable: expressionArgumentList(argumentOption(operation.arguments.items, 0)), parameters: parametersOption(operation.arguments.items), source: operation.source } satisfies ProviderContainerInvocation),
          () => relationGate(
            Object.is(operation.name, 'bound'),
            () => relationSome({ kind: 'provider_container_bound_check', target: expressionArgumentList(argumentOption(operation.arguments.items, 0)), source: operation.source } satisfies ProviderContainerBoundCheck),
            () => relationGate(
              Object.is(operation.name, 'tag'),
              () => relationSome({ kind: 'provider_container_tagging', services: expressionArgumentList(argumentOption(operation.arguments.items, 0)), tag: expressionArgumentList(argumentOption(operation.arguments.items, 1)), source: operation.source } satisfies ProviderContainerTagging),
              () => relationGate(
                Object.is(operation.name, 'tagged'),
                () => relationSome({ kind: 'provider_container_tagged_resolution', tag: expressionArgumentList(argumentOption(operation.arguments.items, 0)), source: operation.source } satisfies ProviderContainerTaggedResolution),
                () => relationGate(
                  relationAny([
                    Object.is(operation.name, 'when'), Object.is(operation.name, 'needs'), Object.is(operation.name, 'give'),
                    Object.is(operation.name, 'give_tagged'), Object.is(operation.name, 'give_config'), Object.is(operation.name, 'make'),
                    Object.is(operation.name, 'make_with'), Object.is(operation.name, 'alias'), Object.is(operation.name, 'call'), Object.is(operation.name, 'bound'),
                    Object.is(operation.name, 'tag'), Object.is(operation.name, 'tagged'), Object.is(operation.name, 'extend'), Object.is(operation.name, 'resolving'),
                    Object.is(operation.name, 'after_resolving'), Object.is(operation.name, 'rebinding'), Object.is(operation.name, 'before_resolving'),
                    Object.is(operation.name, 'after_resolving_attribute'), Object.is(operation.name, 'when_has_attribute'),
                  ]),
                  () => relationNone(),
                  () => relationSome({ kind: 'provider_container_registration', operation: operation.name, arguments: operation.arguments, source: operation.source } satisfies ProviderContainerRegistration),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

function semanticBindings(operations: readonly ProviderContainerOperation[]): ProviderContainerBindings {
  const build = (index: number, bindings: readonly ProviderContainerBinding[]): readonly ProviderContainerBinding[] => relationGate(
    index >= operations.length,
    () => bindings,
    () => relationOptionFold(
      contextualBindingOption(operations, index),
      () => relationOptionFold(
        bindingOption(operations[index]),
        () => build(relationAdvanceIndex(index, 1), bindings),
        binding => build(relationAdvanceIndex(index, 1), [...bindings, binding]),
      ),
      contextual => {
        const giveKind: ProviderContextualGive = relationGate(
          Object.is(contextual.give.name, 'give_tagged'),
          () => ({ kind: 'tagged', arguments: contextual.give.arguments }),
          () => relationGate(Object.is(contextual.give.name, 'give_config'), () => ({ kind: 'config', arguments: contextual.give.arguments }), () => ({ kind: 'implementation', arguments: contextual.give.arguments })),
        );
        return build(relationAdvanceIndex(index, 3), [...bindings, { kind: 'provider_contextual_binding', context: contextual.when.arguments, needs: contextual.needs.arguments, give: giveKind, source: contextual.when.source }]);
      },
    ),
  );
  return { kind: 'provider_container_bindings', items: sequence(build(0, [])) };
}

type ClosureStatementHandler = (statement: import('../../../types/upstream/expression').ClosureStatement, operations: ProviderContainerOperation[]) => void;

const collectClosureList = (items: Extract<import('../../../types/upstream/expression').ClosureStatement, { readonly kind: 'if' }>['thenBlock']['items'], operations: ProviderContainerOperation[]): void =>
  relationResolve(
    Object.is(items.kind, 'cons'),
    () => { collectContainerOperationsFromClosureStatement(items.head, operations); collectClosureList(items.tail, operations); },
    () => {},
  );

const CLOSURE_STATEMENT_HANDLERS: Readonly<Record<import('../../../types/upstream/expression').ClosureStatement['kind'], ClosureStatementHandler>> = {
  expression: (statement, operations) => collectContainerOperations(statement.expression, operations),
  return_value: (statement, operations) => collectContainerOperations(statement.expression, operations),
  assignment: (statement, operations) => collectContainerOperations(statement.value.expression, operations),
  throw: (statement, operations) => collectContainerOperations(statement.expression, operations),
  'if': (statement, operations) => { collectContainerOperations(statement.condition, operations); collectClosureList(statement.thenBlock.items, operations); },
  foreach: (statement, operations) => { collectContainerOperations(statement.iterable, operations); collectClosureList(statement.body.items, operations); },
  'for': () => {},
  try: (statement, operations) => collectClosureList(statement.body.items, operations),
  return_void: () => {},
};

function collectContainerOperationsFromClosureStatement(statement: import('../../../types/upstream/expression').ClosureStatement, operations: ProviderContainerOperation[]): void {
  CLOSURE_STATEMENT_HANDLERS[statement.kind](statement, operations);
}

export function buildProviderSemanticResultFromSource(sourceAst: ProviderSourceEvidence, fileValue: import('../../../types/upstream/provenance').SourceFile, span: SourceSpan): { readonly definition: ProviderDefinition; readonly ast: ProviderAst } {
  const register = relationFirstOption(sourceAst.methods, method => Object.is(method.name, 'register'));
  const boot = relationFirstOption(sourceAst.methods, method => Object.is(method.name, 'boot'));
  return relationOptionFold(register, () => { throw Error(`Provider register method not found: ${fileValue.value.value}`); }, registerMethod => relationOptionFold(boot, () => { throw Error(`Provider boot method not found: ${fileValue.value.value}`); }, bootMethod => {
    const registerExpression = methodExpression(registerMethod);
    const bootExpression = methodExpression(bootMethod);
    const operations: ProviderContainerOperation[] = [];
    collectContainerOperations(registerExpression, operations);
    collectContainerOperations(bootExpression, operations);
    const bindings = semanticBindings(operations);
    const bindingAttributes = semanticBindingAttributes(sourceAst, fileValue.value.value);
    const definition: ProviderDefinition = {
      kind: 'provider',
      name: { kind: 'class_name', value: sourceAst.className.value },
      file: fileValue,
      register: registerExpression,
      boot: bootExpression,
      bindings,
      bindingAttributes,
      source: span,
    };
    return { definition, ast: createDomainAstJudgment({ kind: 'provider_ast', semantic: definition, source: span }) };
  }));
}

export function buildProviderAstFromSource(sourceAst: ProviderSourceEvidence, fileValue: import('../../../types/upstream/provenance').SourceFile, span: SourceSpan): ProviderAst {
  return buildProviderSemanticResultFromSource(sourceAst, fileValue, span).ast;
}

export interface ProviderScanBundle {
  readonly asts: readonly ProviderAst[];
  readonly definitions: readonly ProviderDefinition[];
}

export async function scanProviderBundle(sourceProject: SourceProjectIdentity): Promise<ProviderScanBundle> {
  const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'app', 'Providers');
  const files = await collectPhpFiles(directory);
  const { providerProducer } = await import('./providerProducer');
  const scan = async (index: number, results: readonly { readonly definition: ProviderDefinition; readonly ast: ProviderAst }[]): Promise<readonly { readonly definition: ProviderDefinition; readonly ast: ProviderAst }[]> => relationGate(
    index >= files.length,
    () => Object.freeze(results),
    async () => {
      const file = files[index];
      const text = await readSourceText(file);
      const tokens = LaravelSourceLexer.tokenize(text);
      const name = className(tokens);
      const declaration = LaravelSourceLexer.parseControllerDeclaration(text, tokens, createAstIdentifier(name));
      const span = source(file, Number(declaration.source.line));
      const sourceAst: ProviderSourceEvidence = {
        kind: 'provider_source_evidence',
        attributes: declaration.attributes.map(attribute => ({
          kind: 'provider_attribute_evidence',
          name: { kind: 'class_name', value: lastPathSegment(attribute.name.value) },
          arguments: {
            kind: 'expression_arguments',
            items: sequence(attribute.arguments.map(argument => ({
              kind: Object.is(argument.kind, 'named') ? 'named' : Object.is(argument.kind, 'unpacked') ? 'unpacked' : 'positional',
              ...(Object.is(argument.kind, 'named') ? { name: { kind: 'expression_argument_name', value: stringValue(argument.name.value) } } : {}),
              value: mapResourcePhpAstToUpstream(argument.value, file),
            }))),
          },
          source: source(file, Number(attribute.source.line)),
        })),
        className: { kind: 'class_name', value: name },
        methods: declaration.methods.map(method => ({
          kind: 'provider_method_evidence',
          name: { kind: 'method_name', value: method.name },
          body: {
            kind: 'closure',
            value: {
              kind: 'closure',
              parameters: { kind: 'variable_names', items: { kind: 'empty' } },
              captures: { kind: 'closure_captures', items: { kind: 'empty' } },
              body: resolveClosureBody(method.body.statements, file, mapResourcePhpAstToUpstream),
              source: source(file, Number(method.source.line)),
            },
            source: source(file, Number(method.source.line)),
          },
          source: source(file, Number(method.source.line)),
        })),
        source: span,
      };
      const result = providerProducer.produceResult({
        source: sourceAst,
        file: { kind: 'source_file', value: stringValue(file) },
        sourceSpan: span,
      });
      return scan(relationAdvanceIndex(index, 1), [...results, result]);
    },
  );
  const results = await scan(0, Object.freeze([]));
  return {
    asts: Object.freeze(relationProject(results, result => result.ast)),
    definitions: Object.freeze(relationProject(results, result => result.definition)),
  };
}


export async function scanProviderAsts(sourceProject: SourceProjectIdentity): Promise<readonly ProviderAst[]> {
  return (await scanProviderBundle(sourceProject)).asts;
}
