import { PHP_STATEMENT_KINDS } from '../phpAstStatementKinds';
import { solveRewriteCandidate, requirement, variantRewriteCandidate } from '../../../../semantic/kernel/semanticDecisionRewriteEngine';
import { relationGate, relationProject, relationExpand, relationLookup, relationOptionFold, relationAdvanceIndex, relationAll, relationFold } from '../../../../semantic/relations/relationalSequence';
import { relationEqual } from '../../../../semantic/relations/semanticRelations';
import type { Expression } from '../../../../types/upstream/expression';
import type { PhpAstValue } from '../phpAstExpressionTypes';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { PhpAstExpressionSemanticAuthorityInterface } from '../../../../types/upstream/phpAstExpressionSemanticAuthorityInterface';
import { matchPhpAstValue } from '../../../scanner/LaravelSourceLexer';
import { sourceFileIdentityFactory, stringValue } from '../../../../types/upstream/names';
import {
  variable, className, resource, cardinality, expressions, expressionArguments, functionName, method, resolveStaticReceiver, resolveStaticAction, constantName,
  phpAstExpressionMappingOperations,
} from './phpAstExpressionMappings';
import { phpAstExpressionClosureOperations } from './phpAstExpressionClosure';
import type { SourceStatement, SourceStatements } from '../../../../types/upstream/sourceStatements';
import type { ResolvedExpression, AnonymousClassMember } from '../../../../types/upstream/expression';
import type { PhpStatement, PhpAssignmentTarget, PhpIfAlternative, PhpForClause } from '../phpAstStatementTypes';




function mapFunctionCall(
  name: string,
  nameEvidence: import('../phpAstExpressionTypes').PhpFunctionNameSourceEvidence,
  arguments_: readonly import('../phpAstExpressionTypes').PhpArgument[],
  source: SourceSpan,
  resolveChild: (value: PhpAstValue, file: string) => Expression,
  file: string,
): Expression {
  const resolvedArguments = expressionArguments(phpAstExpressionMappingOperations.resolveArguments(arguments_, resolveChild, file));
  const lexicalName = nameEvidence.tokens.map(token => token.value).join('');
  return Object.freeze({
    kind: 'call',
    function: functionName(lexicalName.length === 0 ? name : lexicalName),
    arguments: resolvedArguments,
    source,
  });
}

function projectPhpAstExpressionToUpstream(value: PhpAstValue, file: string, classContext?: import('../../../../types/upstream/phpTypeAtomInterface').PhpTypeClassContext): Expression {
  const source: SourceSpan = { kind: 'source_span', file: sourceFileIdentityFactory.create(stringValue.create(file)), start: { kind: 'number_value', value: value.source.startOffset }, end: { kind: 'number_value', value: value.source.endOffset } };
  const resolveChild = (child: PhpAstValue, _file: string): Expression => projectPhpAstExpressionToUpstream(child, file, classContext);
  return matchPhpAstValue(value, {
    literal: node => phpAstExpressionMappingOperations.resolveLiteral(node, source),
    interpolatedString: node => ({
      kind: 'interpolated_string',
      parts: {
        kind: 'interpolated_string_parts',
        items: sequence(relationProject(node.parts, part => relationGate(relationEqual(part.kind, 'text'), () => ({ kind: 'text', value: { kind: 'string_value', value: part.value } }), () => ({ kind: 'expression', value: resolveChild(part.value, file) }))))
      },
      source
    }),
    resourceSingle: node => ({ kind: 'resource_reference', resource: resource(node.resourceName), cardinality: cardinality('single'), argument: resolveChild(node.argument, file), source }),
    resourceCollection: node => ({ kind: 'resource_reference', resource: resource(node.resourceName), cardinality: cardinality('collection'), argument: resolveChild(node.argument, file), source }),
    variableReference: node => ({ kind: 'variable', name: variable(node.name), source }),
    magicConstant: node => ({ kind: 'magic_constant', value: node.value.kind, source }),
    constantReference: node => ({ kind: 'constant_reference', reference: { kind: 'constant_reference', name: constantName(node.name) }, source }),
    propertyAccess: node => phpAstExpressionMappingOperations.memberExpression(node.receiver, node.target, node.property, node.access, resolveChild, file, source),
    methodChain: node => phpAstExpressionMappingOperations.methodExpression(node.receiver, node.target, node.property, node.arguments, node.access, resolveChild, file, source),
    arrayAccess: node => ({ kind: 'index', receiver: resolveChild(node.target, file), key: resolveChild(node.index, file), source }),
    functionCall: node => mapFunctionCall(node.functionName, node.functionNameEvidence, node.arguments, source, resolveChild, file),
    callableCall: node => ({ kind: 'callable_call', callable: resolveChild(node.callable, file), arguments: expressionArguments(phpAstExpressionMappingOperations.resolveArguments(node.arguments, resolveChild, file)), source }),
    ternaryExpression: node => ({ kind: 'conditional', condition: resolveChild(node.condition, file), branches: { kind: 'then_else', whenTrue: resolveChild(node.trueBranch, file), whenFalse: resolveChild(node.falseBranch, file) }, source }),
    shortTernary: node => ({ kind: 'short_conditional', condition: resolveChild(node.condition, file), whenFalse: resolveChild(node.falseBranch, file), source }),
    nullCoalesce: node => ({ kind: 'coalesce', left: resolveChild(node.left, file), right: resolveChild(node.right, file), source }),
    binaryExpression: node => ({ kind: 'binary', operator: phpAstExpressionMappingOperations.resolveBinaryOperator(node.operator.kind), left: resolveChild(node.left, file), right: resolveChild(node.right, file), source }),
    unaryExpression: node => ({ kind: 'unary', operator: phpAstExpressionMappingOperations.resolveUnaryOperator(node.operator.kind), operand: resolveChild(node.operand, file), source }),
    castExpression: node => ({ kind: 'cast', target: phpAstExpressionMappingOperations.resolveCastType(node.castType.kind), expression: resolveChild(node.operand, file), source }),
    nestedArray: node => ({ kind: 'array', entries: sequence(relationProject(node.entries, (entry, index) => phpAstExpressionMappingOperations.resolveArrayEntry(entry, index, resolveChild, file, source))), source }),
    staticCall: node => ({ kind: 'static_method', receiver: resolveStaticReceiver(className(node.className)), action: relationGate(relationAll([relationEqual(node.className, 'Attribute'), relationEqual(node.method, 'make')]), () => mapAttributeFactoryAction(node.arguments, resolveChild, file), () => resolveStaticAction(className(node.className), method(node.method))), arguments: expressionArguments(phpAstExpressionMappingOperations.resolveArguments(node.arguments, resolveChild, file)), source }),
    classReference: node => ({ kind: 'class_reference', className: className(node.className), source }),
    classConstant: node => ({ kind: 'class_constant', reference: { kind: 'class_constant_reference', owner: mapClassConstantOwner(node.owner), name: constantName(node.name) }, source }),
    construct: node => ({ kind: 'construct', className: className(node.className), arguments: expressionArguments(phpAstExpressionMappingOperations.resolveArguments(node.arguments, resolveChild, file)), source }),
    assignmentExpression: node => {
      const target = phpAstExpressionMappingOperations.resolveAssignmentTarget(node.target, resolveChild, file);
      const expression = resolveChild(node.value, file);
      return { kind: 'assignment_expression', value: { kind: 'assignment', target, expression, operator: phpAstExpressionMappingOperations.resolveAssignmentOperator(node.operator.kind), reference: phpAstExpressionMappingOperations.assignmentReferenceMode(node.reference.kind), source }, source };
    },
    dynamicConstruct: node => ({ kind: 'dynamic_construct', classExpression: resolveChild(node.classExpression, file), arguments: expressionArguments(phpAstExpressionMappingOperations.resolveArguments(node.arguments, resolveChild, file)), source }),
    anonymousClassConstruct: node => ({
      kind: 'anonymous_class',
      value: {
        kind: 'anonymous_class',
        extendsClass: relationGate(relationEqual(typeof node.class.extendsClass, 'string'), () => className(node.class.extendsClass as string), () => ({ kind: 'absent' })),
        members: relationProject(node.class.members, member => {
          const anonymousClassContext: import('../../../../types/upstream/phpTypeAtomInterface').PhpTypeClassContext = typeof node.class.extendsClass === 'string' ? { parentClass: node.class.extendsClass } : {};
          const resolveAnonymousClassExpression = (child: PhpAstValue, childFile: string): Expression => projectPhpAstExpressionToUpstream(child, childFile, anonymousClassContext);
          return mapAnonymousClassMember(member, file, resolveAnonymousClassExpression, anonymousClassContext);
        }),
      },
      arguments: expressionArguments(phpAstExpressionMappingOperations.resolveArguments(node.arguments, resolveChild, file)),
      source,
    }),
    instanceOf: node => ({ kind: 'instance_of', expression: resolveChild(node.expression, file), className: className(node.className), source }),
    closure: node => ({ kind: 'closure', value: { kind: 'closure', parameters: { kind: 'closure_parameters', items: sequence(relationProject(node.parameters, item => phpAstExpressionMappingOperations.resolveClosureParameter(item, resolveChild, file, classContext))) }, captures: { kind: 'closure_captures', items: sequence(relationProject(node.captures, item => ({ kind: item.kind, variable: variable(item.variable) }))) }, returnType: relationGate<import('../../../../types/upstream/expression').ClosureReturnType>(relationEqual(node.returnType.kind, 'absent'), () => ({ kind: 'absent' }), () => ({ kind: 'present', value: phpAstExpressionMappingOperations.resolveParameterType(node.returnType.type, undefined, undefined, classContext) })), body: phpAstExpressionClosureOperations.resolveClosureBody(node.body.statements, file, resolveChild), source }, source }),
    arrowFunction: node => ({ kind: 'arrow_function', parameters: { kind: 'closure_parameters', items: sequence(relationProject(node.parameters, item => phpAstExpressionMappingOperations.resolveClosureParameter(item, resolveChild, file, classContext))) }, body: resolveChild(node.body, file), source }),
    matchExpression: node => ({
      kind: 'match',
      subject: resolveChild(node.subject, file),
      arms: {
        kind: 'match_arms',
        items: sequence(relationProject(node.arms, arm => relationGate<import('../../../../types/upstream/expression').MatchArm>(relationEqual(arm.kind, 'conditional'), () => ({ kind: 'conditional', conditions: expressions(relationProject(arm.conditions, item => resolveChild(item, file))), result: resolveChild(arm.value, file), source }), () => ({ kind: 'default', result: resolveChild(arm.value, file), source }))))
      },
      source
    }),
    unsupported: node => ({ kind: 'unsupported_expression', reason: mapUnsupportedReason(node.reason), source }),
  });
}


/**
 * Transitional implementation of the upstream-owned semantic authority.
 * The contract is now the public boundary; remaining direct mapper consumers
 * are intentionally tracked for subsequent migrations rather than hidden.
 */
/** Parser-local operation contract for AST-to-upstream projection. */
export interface PhpAstExpressionProjectionOperationsInterface {
  readonly projectExpression: (
    value: PhpAstValue,
    file: string,
    classContext?: import('../../../../types/upstream/phpTypeAtomInterface').PhpTypeClassContext,
  ) => Expression;
  readonly projectStatements: (
    values: readonly PhpStatement[],
    file: string,
    classContext?: import('../../../../types/upstream/phpTypeAtomInterface').PhpTypeClassContext,
  ) => SourceStatements;
}

export const phpAstExpressionProjectionOperations: PhpAstExpressionProjectionOperationsInterface = Object.freeze({
  projectExpression: projectPhpAstExpressionToUpstream,
  projectStatements: projectPhpStatementsToSourceStatements,
});

export const phpAstExpressionSemanticAuthority: PhpAstExpressionSemanticAuthorityInterface<PhpAstValue> = Object.freeze({
  kind: 'php_ast_expression_semantic_authority',
  derive(input) {
    return relationOptionFold<import('../../../../types/upstream/phpTypeAtomInterface').PhpTypeClassContext, Expression>(
      input.classContext,
      () => projectPhpAstExpressionToUpstream(input.evidence, input.sourceFile.value.value),
      classContext => projectPhpAstExpressionToUpstream(input.evidence, input.sourceFile.value.value, classContext),
    );
  },
});

function mapAnonymousClassMember(member: import('../phpAstExpressionTypes').PhpAnonymousClassMember, file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression, classContext?: import('../../../../types/upstream/phpTypeAtomInterface').PhpTypeClassContext): AnonymousClassMember {
  return relationOptionFold(solveRewriteCandidate<AnonymousClassMember>([
    variantRewriteCandidate({ id: 'property', subject: member, variant: 'property', requirements: [requirement('property', relationEqual(member.kind, 'property'))], exclusions: [], dependencies: [], rewrite: value => ({
      kind: 'property',
      name: { kind: 'property_name', value: { kind: 'string_value', value: value.value.name } },
      value: relationGate(relationEqual(value.value.initialization.kind, 'absent'), () => ({ kind: 'absent' }), () => ({ kind: 'present', value: resolveExpression(value.value.initialization.value, file) })),
    }) }),
    variantRewriteCandidate({ id: 'method', subject: member, variant: 'method', requirements: [requirement('method', relationEqual(member.kind, 'method'))], exclusions: [], dependencies: [], rewrite: value => ({
      kind: 'method',
      name: method(value.value.name),
      parameters: { kind: 'closure_parameters', items: sequence(relationProject(value.value.parameters, item => mapAnonymousClassParameter(item, resolveExpression, file, classContext))) },
      returnType: relationGate(relationEqual(value.value.declaredReturnType.kind, 'absent'), () => ({ kind: 'absent' }), () => ({ kind: 'present', value: phpAstExpressionMappingOperations.resolveParameterType(value.value.declaredReturnType.type, undefined, undefined, classContext) })),
      body: projectPhpStatementsToSourceStatements(value.value.body, file, classContext),
    }) }),
  ]), () => { throw Error('unresolved anonymous class member'); }, value => value);
}

function mapAnonymousClassParameter(parameter: import('../phpMethodAstTypes').PhpParameterAst, resolveExpression: (value: PhpAstValue, file: string) => Expression, file: string, classContext?: import('../../../../types/upstream/phpTypeAtomInterface').PhpTypeClassContext): import('../../../../types/upstream/expression').ClosureParameter {
  return {
    kind: 'closure_parameter',
    name: variable(parameter.name),
    type: { kind: 'present', value: phpAstExpressionMappingOperations.resolveParameterType(parameter.type, undefined, undefined, classContext) },
    passing: { kind: 'by_value' },
    variadic: { kind: 'fixed' },
    defaultValue: relationGate(relationEqual(parameter.defaultValue.kind, 'absent'), () => ({ kind: 'absent' }), () => ({ kind: 'present', value: resolveExpression(parameter.defaultValue.value, file) })),
  };
}

function projectPhpStatementsToSourceStatements(values: readonly PhpStatement[], file: string, classContext?: import('../../../../types/upstream/phpTypeAtomInterface').PhpTypeClassContext): SourceStatements {
  const resolveExpression = (value: PhpAstValue, sourceFile: string): Expression => projectPhpAstExpressionToUpstream(value, sourceFile, classContext);
  return { kind: 'source_statements', items: sequence(relationProject(values, value => mapAnonymousClassStatement(value, file, resolveExpression, classContext))) };
}

function resolved(value: PhpAstValue, file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression): ResolvedExpression {
  return { kind: 'resolved_expression', expression: resolveExpression(value, file), result: { kind: 'unresolved', reason: 'external' } };
}

function mapAnonymousClassStatement(value: PhpStatement, file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression, classContext?: import('../../../../types/upstream/phpTypeAtomInterface').PhpTypeClassContext): SourceStatement {
  const source: import('../../../../types/upstream/provenance').SourceSpan = {
    kind: 'source_span', file: sourceFileIdentityFactory.create(stringValue.create(file)),
    start: { kind: 'number_value', value: value.source.startOffset },
    end: { kind: 'number_value', value: value.source.endOffset },
  };
  const candidates = [
    variantRewriteCandidate({ id: 'expression', subject: value, variant: 'expression_statement', requirements: [requirement('expression_statement', relationEqual(value.kind, 'expression_statement'))], exclusions: [], dependencies: [], rewrite: statement => ({ kind: 'expression', value: resolved(statement.expression, file, resolveExpression), source }) }),
    variantRewriteCandidate({ id: 'return', subject: value, variant: 'return_with_value', requirements: [requirement('return_with_value', relationEqual(value.kind, 'return_with_value'))], exclusions: [], dependencies: [], rewrite: statement => ({ kind: 'return', expression: resolved(statement.expression, file, resolveExpression), source }) }),
    variantRewriteCandidate({ id: 'return_void', subject: value, variant: 'return_void', requirements: [requirement('return_void', relationEqual(value.kind, 'return_void'))], exclusions: [], dependencies: [], rewrite: () => ({ kind: 'return_void', source }) }),
    variantRewriteCandidate({ id: 'assignment', subject: value, variant: 'assignment', requirements: [requirement('assignment', relationEqual(value.kind, 'assignment'))], exclusions: [], dependencies: [], rewrite: assignment => {
      const target = phpAstExpressionMappingOperations.resolveAssignmentTarget(assignment.target, resolveExpression, file);
      return { kind: 'assignment', value: { kind: 'assignment', target, expression: resolveExpression(assignment.value, file), operator: phpAstExpressionMappingOperations.resolveAssignmentOperator(assignment.operator.kind), reference: phpAstExpressionMappingOperations.assignmentReferenceMode(assignment.reference.kind), source }, source };
    } }),
    variantRewriteCandidate({ id: 'conditional', subject: value, variant: 'if_statement', requirements: [requirement('conditional', relationEqual(value.kind, PHP_STATEMENT_KINDS.conditional))], exclusions: [], dependencies: [], rewrite: conditional => ({ kind: 'conditional', condition: resolved(conditional.condition, file, resolveExpression), branches: mapAnonymousClassBranches(conditional.alternative, conditional.thenBlock.statements, file, resolveExpression, classContext), source }) }),
    variantRewriteCandidate({ id: 'collection_recurrence', subject: value, variant: 'foreach_statement', requirements: [requirement('collection_recurrence', relationEqual(value.kind, PHP_STATEMENT_KINDS.collectionRecurrence))], exclusions: [], dependencies: [], rewrite: recurrence => ({ kind: 'for_each', iterable: resolved(recurrence.iterable, file, resolveExpression), target: relationGate(relationEqual(recurrence.target.kind, 'value'), () => ({ kind: 'value', variable: { kind: 'variable_name', value: { kind: 'string_value', value: recurrence.target.variable } } }), () => ({ kind: 'key_value', key: { kind: 'variable_name', value: { kind: 'string_value', value: recurrence.target.key } }, value: { kind: 'variable_name', value: { kind: 'string_value', value: recurrence.target.value } } })), body: projectPhpStatementsToSourceStatements(recurrence.body.statements, file, classContext), source }) }),
    variantRewriteCandidate({ id: 'counted_recurrence', subject: value, variant: 'for_statement', requirements: [requirement('counted_recurrence', relationEqual(value.kind, PHP_STATEMENT_KINDS.countedRecurrence))], exclusions: [], dependencies: [], rewrite: recurrence => ({ kind: 'for_loop', initializer: mapAnonymousClassForClause(recurrence.initializer, file, resolveExpression), condition: mapAnonymousClassForClause(recurrence.condition, file, resolveExpression), update: mapAnonymousClassForClause(recurrence.update, file, resolveExpression), body: projectPhpStatementsToSourceStatements(recurrence.body.statements, file, classContext), source }) }),
    variantRewriteCandidate({ id: 'try', subject: value, variant: 'try_statement', requirements: [requirement('try_statement', relationEqual(value.kind, 'try_statement'))], exclusions: [], dependencies: [], rewrite: statement => ({ kind: 'try', body: projectPhpStatementsToSourceStatements(statement.body.statements, file, classContext), catches: { kind: 'catch_handlers', items: sequence(relationProject(statement.catches, item => ({ kind: 'catch_handler', variable: { kind: 'variable_name', value: { kind: 'string_value', value: item.variable } }, exception: { kind: 'exception_name', value: { kind: 'string_value', value: item.exceptionType } }, body: projectPhpStatementsToSourceStatements(item.body.statements, file, classContext), source: sourceSpanFromToken(file, item.source) }))) }, source }) }),
    variantRewriteCandidate({ id: 'throw', subject: value, variant: 'throw_statement', requirements: [requirement('throw_statement', relationEqual(value.kind, 'throw_statement'))], exclusions: [], dependencies: [], rewrite: statement => ({ kind: 'throw', error: resolved(statement.expression, file, resolveExpression), source }) }),
    variantRewriteCandidate({ id: 'unset', subject: value, variant: 'unset_statement', requirements: [requirement('unset_statement', relationEqual(value.kind, 'unset_statement'))], exclusions: [], dependencies: [], rewrite: statement => ({ kind: 'unset', targets: { kind: 'source_unset_targets', items: relationExpand(statement.targets, target => mapAnonymousClassUnsetTargets(target, file, resolveExpression)) }, source }) }),
    variantRewriteCandidate({ id: 'include', subject: value, variant: 'include_statement', requirements: [requirement('include_statement', relationEqual(value.kind, 'include_statement'))], exclusions: [], dependencies: [], rewrite: statement => ({ kind: 'include', includeKind: statement.includeKind, expression: resolved(statement.expression, file, resolveExpression), source }) }),
  ];
  return relationOptionFold(solveRewriteCandidate(candidates), () => { throw Error('unresolved source statement relation'); }, selected => selected);
}

function mapAnonymousClassBranches(alternative: PhpIfAlternative, thenValues: readonly PhpStatement[], file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression, classContext?: import('../../../../types/upstream/phpTypeAtomInterface').PhpTypeClassContext) {
  return relationOptionFold(solveRewriteCandidate<import('../../../../types/upstream/sourceStatements').SourceConditionalBranches>([
    variantRewriteCandidate({ id: 'none', subject: alternative, variant: 'none', requirements: [requirement('none', relationEqual(alternative.kind, 'none'))], exclusions: [], dependencies: [], rewrite: () => ({ kind: 'then_only' as const, whenTrue: projectPhpStatementsToSourceStatements(thenValues, file, classContext) }) }),
    variantRewriteCandidate({ id: 'else_block', subject: alternative, variant: 'else_block', requirements: [requirement('else_block', relationEqual(alternative.kind, 'else_block'))], exclusions: [], dependencies: [], rewrite: value => ({ kind: 'then_else' as const, whenTrue: projectPhpStatementsToSourceStatements(thenValues, file, classContext), whenFalse: projectPhpStatementsToSourceStatements(value.block.statements, file, classContext) }) }),
    variantRewriteCandidate({ id: 'else_statement', subject: alternative, variant: 'else_statement', requirements: [requirement('else_statement', relationEqual(alternative.kind, 'else_statement'))], exclusions: [], dependencies: [], rewrite: value => ({ kind: 'then_else' as const, whenTrue: projectPhpStatementsToSourceStatements(thenValues, file, classContext), whenFalse: projectPhpStatementsToSourceStatements([value.statement], file, classContext) }) }),
  ]), () => { throw Error('unresolved branch relation'); }, value => value);
}

function mapAnonymousClassForClause(clause: PhpForClause, file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression) {
  return relationOptionFold(solveRewriteCandidate<import('../../../../types/upstream/sourceStatements').SourceForClause>([
    variantRewriteCandidate({ id: 'empty', subject: clause, variant: 'empty', requirements: [requirement('empty', relationEqual(clause.kind, 'empty'))], exclusions: [], dependencies: [], rewrite: () => ({ kind: 'empty' as const }) }),
    variantRewriteCandidate({ id: 'expression', subject: clause, variant: 'expression', requirements: [requirement('expression', relationEqual(clause.kind, 'expression'))], exclusions: [], dependencies: [], rewrite: value => ({ kind: 'expression' as const, value: resolved(value.value, file, resolveExpression) }) }),
    variantRewriteCandidate({ id: 'assignment', subject: clause, variant: 'assignment', requirements: [requirement('assignment', relationEqual(clause.kind, 'assignment'))], exclusions: [], dependencies: [], rewrite: assignment => {
      const target = phpAstExpressionMappingOperations.resolveAssignmentTarget(assignment.target, resolveExpression, file);
      return { kind: 'assignment' as const, value: { kind: 'assignment' as const, target, expression: resolveExpression(assignment.value, file), operator: phpAstExpressionMappingOperations.resolveAssignmentOperator(assignment.operator.kind), reference: phpAstExpressionMappingOperations.assignmentReferenceMode(assignment.reference.kind), source: sourceSpanFromToken(file, assignment.source) }};
    } }),
  ]), () => { throw Error('unresolved recurrence clause relation'); }, value => value);
}

function mapAnonymousClassUnsetTargets(target: PhpAssignmentTarget, file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression): readonly import('../../../../types/upstream/sourceStatements').SourceUnsetTarget[] {
  return relationOptionFold(solveRewriteCandidate<readonly import('../../../../types/upstream/sourceStatements').SourceUnsetTarget[]>([
    variantRewriteCandidate({ id: 'variables', subject: target, variant: 'variables', requirements: [requirement('variables', relationEqual(target.kind, 'variables'))], exclusions: [], dependencies: [], rewrite: value => [{ kind: 'variables', names: { kind: 'variable_names', items: relationProject(value.names, name => ({ kind: 'variable_name', value: { kind: 'string_value', value: name } })) } }] }),
    variantRewriteCandidate({ id: 'destructuring', subject: target, variant: 'destructuring', requirements: [requirement('destructuring', relationEqual(target.kind, 'destructuring'))], exclusions: [], dependencies: [], rewrite: value => relationExpand(value.pattern.entries, entry => mapDestructuringUnsetTargets(entry)) }),
    { id: 'other', requirements: [requirement('other', relationAll([!relationEqual(target.kind, 'variables'), !relationEqual(target.kind, 'destructuring')]))], exclusions: [], dependencies: [], rewrite: () => [mapAnonymousClassUnsetTarget(target, file, resolveExpression)] },
  ]), () => { throw Error('unresolved unset target relation'); }, value => value);
}

function mapDestructuringUnsetTargets(entry: import('../phpAstStatementTypes').PhpAssignmentDestructuringEntry): readonly import('../../../../types/upstream/sourceStatements').SourceUnsetTarget[] {
  return relationOptionFold(solveRewriteCandidate<readonly import('../../../../types/upstream/sourceStatements').SourceUnsetTarget[]>([
    variantRewriteCandidate({ id: 'variable', subject: entry, variant: 'variable', requirements: [requirement('variable', relationEqual(entry.kind, 'variable'))], exclusions: [], dependencies: [], rewrite: value => [{ kind: 'variable', name: { kind: 'variable_name', value: { kind: 'string_value', value: value.name } } }] }),
    variantRewriteCandidate({ id: 'reference_variable', subject: entry, variant: 'reference_variable', requirements: [requirement('reference_variable', relationEqual(entry.kind, 'reference_variable'))], exclusions: [], dependencies: [], rewrite: value => [{ kind: 'variable', name: { kind: 'variable_name', value: { kind: 'string_value', value: value.name } } }] }),
    variantRewriteCandidate({ id: 'keyed', subject: entry, variant: 'keyed', requirements: [requirement('keyed', relationEqual(entry.kind, 'keyed'))], exclusions: [], dependencies: [], rewrite: value => mapDestructuringUnsetTargets(value.target) }),
    variantRewriteCandidate({ id: 'nested', subject: entry, variant: 'nested', requirements: [requirement('nested', relationEqual(entry.kind, 'nested'))], exclusions: [], dependencies: [], rewrite: value => relationExpand(value.pattern.entries, item => mapDestructuringUnsetTargets(item)) }),
    variantRewriteCandidate({ id: 'skipped', subject: entry, variant: 'skipped', requirements: [requirement('skipped', relationEqual(entry.kind, 'skipped'))], exclusions: [], dependencies: [], rewrite: () => [] }),
  ]), () => { throw Error('unresolved destructuring relation'); }, value => value);
}

function mapAnonymousClassUnsetTarget(target: PhpAssignmentTarget, file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression): import('../../../../types/upstream/sourceStatements').SourceUnsetTarget {
  return relationOptionFold(solveRewriteCandidate<import('../../../../types/upstream/sourceStatements').SourceUnsetTarget>([
    variantRewriteCandidate({ id: 'variable', subject: target, variant: 'variable', requirements: [requirement('variable', relationEqual(target.kind, 'variable'))], exclusions: [], dependencies: [], rewrite: value => ({ kind: 'variable', name: { kind: 'variable_name', value: { kind: 'string_value', value: value.name } } }) }),
    variantRewriteCandidate({ id: 'property', subject: target, variant: 'property', requirements: [requirement('property', relationEqual(target.kind, 'property'))], exclusions: [], dependencies: [], rewrite: value => ({ kind: 'property', receiver: resolveExpression(value.receiver, file), name: { kind: 'property_name', value: { kind: 'string_value', value: value.property } } }) }),
    variantRewriteCandidate({ id: 'static_property', subject: target, variant: 'static_property', requirements: [requirement('static_property', relationEqual(target.kind, 'static_property'))], exclusions: [], dependencies: [], rewrite: value => ({ kind: 'static_property', owner: relationGate(relationEqual(value.owner.kind, 'named_class'), () => ({ kind: 'named_class', name: className(value.owner.name) }), () => ({ kind: value.owner.kind })), name: { kind: 'property_name', value: { kind: 'string_value', value: value.property } } }) }),
    variantRewriteCandidate({ id: 'array_element', subject: target, variant: 'array_element', requirements: [requirement('array_element', relationEqual(target.kind, 'array_element'))], exclusions: [], dependencies: [], rewrite: value => ({ kind: 'index', receiver: resolveExpression(value.target, file), key: resolveExpression(value.index, file) }) }),
  ]), () => { throw Error('unresolved unset target'); }, value => value);
}

function sourceSpanFromToken(file: string, token: { readonly startOffset: number; readonly endOffset: number }): import('../../../../types/upstream/provenance').SourceSpan {
  return { kind: 'source_span', file: sourceFileIdentityFactory.create(stringValue.create(file)), start: { kind: 'number_value', value: token.startOffset }, end: { kind: 'number_value', value: token.endOffset } };
}

function mapClassConstantOwner(value: string): import('../../../../types/upstream/expression').ClassConstantOwner {
  const owners = {
    self: { kind: 'self' },
    static: { kind: 'static' },
    parent: { kind: 'parent' },
  } as const;
  return relationOptionFold(relationLookup(Object.entries(owners) as readonly (readonly [string, import('../../../../types/upstream/expression').ClassConstantOwner])[], value), () => ({ kind: 'named_class', name: className(value) }), owner => owner);
}

const sequence = <T>(items: readonly T[], index = 0): import('../../../../types/upstream/collections').Sequence<T> =>
  relationGate<import('../../../../types/upstream/collections').Sequence<T>>(index >= items.length, () => ({ kind: 'empty' }), () => ({ kind: 'cons', head: items[index], tail: sequence(items, relationAdvanceIndex(index, 1)) }));


function mapUnsupportedReason(reason: import('../phpAstExpressionTypes').PhpUnsupportedExpressionReason): import('../../../../types/upstream/expression').UnsupportedExpressionReason {
  return relationOptionFold(solveRewriteCandidate<import('../../../../types/upstream/expression').UnsupportedExpressionReason>([
    { id: 'unclassified_expression', requirements: [requirement('unclassified_expression', relationEqual(reason, 'unclassified_expression'))], exclusions: [], dependencies: [], rewrite: () => ({ kind: 'unsupported_syntax' }) },
    { id: 'unsupported_statement', requirements: [requirement('unsupported_statement', relationEqual(reason, 'unsupported_statement'))], exclusions: [], dependencies: [], rewrite: () => ({ kind: 'unsupported_syntax' }) },
  ]), () => { throw Error('unresolved unsupported reason relation'); }, value => value);
}

function mapAttributeFactoryAction(arguments_: readonly import('../phpAstExpressionTypes').PhpArgument[], resolveExpression: (value: import('../phpAstExpressionTypes').PhpAstValue, file: string) => Expression, file: string): import('../../../../types/upstream/expression').StaticMethodAction {
  const state = relationFold(arguments_, { get: { kind: 'absent' } as import('../../../../types/upstream/expression').AttributeFactoryCallback, set: { kind: 'absent' } as import('../../../../types/upstream/expression').AttributeFactoryCallback }, (accumulator, argument) => relationGate(relationEqual(argument.kind, 'named'), () => {
    const value = { kind: 'present' as const, expression: resolveExpression(argument.value, file) };
    return relationGate(relationEqual(argument.name, 'get'), () => ({ get: value, set: accumulator.set }), () => relationGate(relationEqual(argument.name, 'set'), () => ({ get: accumulator.get, set: value }), () => accumulator));
  }, () => accumulator));
  return { kind: 'attribute_make', definition: { kind: 'attribute_factory', get: state.get, set: state.set, configuration: { kind: 'attribute_factory_configuration', caching: { kind: 'default' } } } };
}
