import { createAstIdentifier, type AstIdentifier, type TokenDescriptor } from './phpAstTypes';
import type { ControllerDeclarationAst } from './controllerAstTypes';
import { relationGate, relationIndexOf, relationProject, relationExpand, relationOptionFold, relationEqual, relationAll, relationSlice, relationSelect } from '../../../semantic/relations/relationalSequence';
import { relationAny } from '../../../semantic/relations/semanticRelations';
import { tokenAt } from './tokenEvidence';
import { phpQualifiedClassNameFactory, type PhpClassNameResolution } from '../../../types/upstream/phpClassNameResolutionInterface';
import { phpClassNameResolutionAuthority } from '../../../types/upstream/phpClassNameResolutionAuthority';
import type { PhpClassNameResolutionRuleInterface } from '../../../types/upstream/phpClassNameResolutionInterface';
import { createClassName } from '../../../types/upstream/names';
import { controllerMethodParser } from './controllerMethodParser';
import type { LaravelControllerAstProjectionContext, LaravelControllerInvocationSemanticJudgmentInterface, LaravelControllerAstProjectionSemanticAuthorityInterface } from '../../../types/upstream/laravelControllerInvocationSemanticJudgmentInterface';
import { laravelControllerAstProjectionSemanticAuthority } from '../../../types/upstream/laravelControllerAstProjectionSemanticAuthority';


import { joinPhpNameTokens, phpClassNameResolutionContextAt } from './phpClassNameContextParser';

const resolveParentClassName = (sourceName: string, context: import('../../../types/upstream/phpClassNameResolutionInterface').PhpClassNameResolutionContext, authority: PhpClassNameResolutionRuleInterface): PhpClassNameResolution => authority.judge(Object.freeze({
  kind: 'php_class_name_resolution_input',
  sourceName: createClassName(sourceName),
  context,
}));

const parseDeclaredInterfaces = (tokens: readonly TokenDescriptor[], classIndex: number): readonly AstIdentifier[] => {
  const relativeBodyIndex = relationIndexOf(relationSlice(tokens, Math.max(0, classIndex + 1), tokens.length), token => relationEqual(token.value, '{'));
  const bodyIndex = relativeBodyIndex < 0 ? tokens.length : classIndex + 1 + relativeBodyIndex;
  const classHeader = relationSlice(tokens, Math.max(0, classIndex + 1), bodyIndex);
  const implementsIndex = relationIndexOf(classHeader, token => relationEqual(token.value, 'implements'));
  return relationGate(implementsIndex < 0, () => Object.freeze([]), () => {
    const tail = relationSlice(classHeader, implementsIndex + 1, classHeader.length);
    const candidates = relationSelect(tail, token => relationAll([
      relationEqual(token.type, 'IDENTIFIER'),
      relationEqual(token.value, 'HasMiddleware'),
    ]));
    return Object.freeze(relationProject(candidates, token => createAstIdentifier(token.value)));
  });
};

function parseControllerDeclarationImpl(
  source: string, tokens: readonly TokenDescriptor[], className: AstIdentifier,
  context?: Extract<LaravelControllerAstProjectionContext, { readonly kind: 'syntax_only' }>,
  projectionAuthority?: LaravelControllerAstProjectionSemanticAuthorityInterface,
  classNameResolutionAuthority?: PhpClassNameResolutionRuleInterface,
): ControllerDeclarationAst<false>;
function parseControllerDeclarationImpl(
  source: string, tokens: readonly TokenDescriptor[], className: AstIdentifier,
  context: Extract<LaravelControllerAstProjectionContext, { readonly kind: 'invocation_semantic_judgment' }>,
  projectionAuthority?: LaravelControllerAstProjectionSemanticAuthorityInterface,
  classNameResolutionAuthority?: PhpClassNameResolutionRuleInterface,
): ControllerDeclarationAst<true>;
function parseControllerDeclarationImpl(
  source: string, tokens: readonly TokenDescriptor[], className: AstIdentifier, context: LaravelControllerAstProjectionContext,
  projectionAuthority?: LaravelControllerAstProjectionSemanticAuthorityInterface,
  classNameResolutionAuthority?: PhpClassNameResolutionRuleInterface,
): ControllerDeclarationAst<boolean>;
function parseControllerDeclarationImpl(
  source: string, tokens: readonly TokenDescriptor[], className: AstIdentifier,
  context: LaravelControllerAstProjectionContext = Object.freeze({ kind: 'syntax_only' }),
  projectionAuthority: LaravelControllerAstProjectionSemanticAuthorityInterface = laravelControllerAstProjectionSemanticAuthority,
  classNameResolutionAuthority: PhpClassNameResolutionRuleInterface = phpClassNameResolutionAuthority,
): ControllerDeclarationAst<boolean> {
  const classIndex = relationIndexOf(tokens, token => relationEqual(token.value, 'class'));
  const attributeStart = relationGate(classIndex >= 0, () => relationIndexOf(relationSlice(tokens, 0, classIndex), token => relationEqual(token.value, '#')), () => -1);
  const interfaces = parseDeclaredInterfaces(tokens, classIndex);
  const relativeBodyIndex = relationIndexOf(relationSlice(tokens, Math.max(0, classIndex + 1), tokens.length), token => relationEqual(token.value, '{'));
  const bodyIndex = relativeBodyIndex < 0 ? tokens.length : classIndex + 1 + relativeBodyIndex;
  const classHeader = relationSlice(tokens, Math.max(0, classIndex + 1), bodyIndex);
  const inheritanceIndex = relationIndexOf(classHeader, token => relationEqual(token.value, 'extends'));
  const nameContext = phpClassNameResolutionContextAt(tokens, classIndex);
  const classIdentity = phpQualifiedClassNameFactory.create([nameContext.namespaceName.value.value, className].filter(Boolean).join('\\'));
  const inheritance = relationGate(inheritanceIndex < 0,
    () => ({ kind: 'none' as const }),
    () => relationOptionFold(tokenAt(classHeader, inheritanceIndex + 1),
      () => ({ kind: 'none' as const }),
      parent => {
        const parentTokens = relationSlice(classHeader, inheritanceIndex + 1, relationIndexOf(relationSlice(classHeader, inheritanceIndex + 1, classHeader.length), token => relationEqual(token.value, 'implements')) < 0 ? classHeader.length : inheritanceIndex + 1 + relationIndexOf(relationSlice(classHeader, inheritanceIndex + 1, classHeader.length), token => relationEqual(token.value, 'implements')));
        const nameTokens = parentTokens.filter(token => token.value !== '{' && token.value !== ',');
        const sourceName = joinPhpNameTokens(nameTokens);
        const simpleName = sourceName.split('\\').filter(Boolean).at(-1) ?? parent.token.value;
        const identity = resolveParentClassName(sourceName, nameContext, classNameResolutionAuthority);
        return { kind: 'class' as const, name: createAstIdentifier(simpleName), identity, source: parent.token };
      }));
  const attributes = relationGate(attributeStart >= 0, () => controllerMethodParser.parseParameterAttributes(tokens, Math.max(0, attributeStart)).attributes, () => Object.freeze([]));
  const classBody = locateClassBody(tokens, classIndex);
  const functionIndexes = classBody.kind === 'controller_class_body_complete'
    ? collectFunctionIndexes(tokens, classBody.openIndex + 1, classBody.closeIndex, 0, [])
    : Object.freeze([]);
  const methodCandidates = relationExpand(functionIndexes, index => relationOptionFold(tokenAt(tokens, index), () => [], evidence => [evidence.token]));
  const methodResolutionContext = nameContext;
  const methods = relationExpand(functionIndexes, index => relationOptionFold(controllerMethodParser.parse(source, tokens, index, context, projectionAuthority), () => [], value => [Object.freeze({ ...value, classNameResolutionContext: methodResolutionContext })]));
  const methodDeclarationInventory = classBody.kind === 'controller_class_body_blocked'
    ? Object.freeze({ kind: 'controller_method_declaration_inventory_blocked' as const, candidates: Object.freeze([classBody.candidate]) })
    : methods.length === functionIndexes.length
      ? Object.freeze({ kind: 'controller_method_declaration_inventory_complete' as const, declarations: Object.freeze(methods) })
      : Object.freeze({ kind: 'controller_method_declaration_inventory_blocked' as const, candidates: Object.freeze(methodCandidates) });
  return relationOptionFold(tokenAt(tokens, 0), () => { throw Error('Controller declaration requires source token evidence'); }, evidence => Object.freeze({ attributes, className, classIdentity, inheritance, interfaces, methods: Object.freeze(methods), methodDeclarationInventory, source: evidence.token }));
}

/**
 * Parser-owned runtime contract. These methods preserve the semantic distinction between
 * syntax-only projection and projection backed by the canonical invocation judgment.
 * The interface stays in the PHP frontend because its input/output types are frontend-owned.
 */
export interface ControllerDeclarationParserInterface {
  readonly parseSyntaxOnly: (
    source: string,
    tokens: readonly TokenDescriptor[],
    className: AstIdentifier,
    context?: Extract<LaravelControllerAstProjectionContext, { readonly kind: 'syntax_only' }>,
    projectionAuthority?: LaravelControllerAstProjectionSemanticAuthorityInterface,
    classNameResolutionAuthority?: PhpClassNameResolutionRuleInterface,
  ) => ControllerDeclarationAst<false>;
  readonly parseWithInvocationJudgment: (
    source: string,
    tokens: readonly TokenDescriptor[],
    className: AstIdentifier,
    invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface,
    projectionAuthority?: LaravelControllerAstProjectionSemanticAuthorityInterface,
    classNameResolutionAuthority?: PhpClassNameResolutionRuleInterface,
  ) => ControllerDeclarationAst<true>;
}

export const controllerDeclarationParser: ControllerDeclarationParserInterface = Object.freeze({
  parseSyntaxOnly: (
    source: string,
    tokens: readonly TokenDescriptor[],
    className: AstIdentifier,
    context: Extract<LaravelControllerAstProjectionContext, { readonly kind: 'syntax_only' }> = Object.freeze({ kind: 'syntax_only' }),
    projectionAuthority: LaravelControllerAstProjectionSemanticAuthorityInterface = laravelControllerAstProjectionSemanticAuthority,
    classNameResolutionAuthority: PhpClassNameResolutionRuleInterface = phpClassNameResolutionAuthority,
  ): ControllerDeclarationAst<false> => parseControllerDeclarationImpl(source, tokens, className, context, projectionAuthority, classNameResolutionAuthority) as ControllerDeclarationAst<false>,
  parseWithInvocationJudgment: (
    source: string,
    tokens: readonly TokenDescriptor[],
    className: AstIdentifier,
    invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface,
    projectionAuthority: LaravelControllerAstProjectionSemanticAuthorityInterface = laravelControllerAstProjectionSemanticAuthority,
    classNameResolutionAuthority: PhpClassNameResolutionRuleInterface = phpClassNameResolutionAuthority,
  ): ControllerDeclarationAst<true> => parseControllerDeclarationImpl(source, tokens, className, Object.freeze({ kind: 'invocation_semantic_judgment', judgment: invocationJudgment }), projectionAuthority, classNameResolutionAuthority) as ControllerDeclarationAst<true>,
});

type ControllerClassBodyBoundary =
  | Readonly<{ readonly kind: 'controller_class_body_complete'; readonly openIndex: number; readonly closeIndex: number }>
  | Readonly<{ readonly kind: 'controller_class_body_blocked'; readonly candidate: TokenDescriptor }>;

/** Locates the declared class body and refuses to claim inventory closure without its closing brace. */
function locateClassBody(tokens: readonly TokenDescriptor[], classIndex: number): ControllerClassBodyBoundary {
  return relationOptionFold(tokenAt(tokens, Math.max(0, classIndex)), () => { throw Error('Controller declaration requires class-token evidence'); }, classEvidence => relationGate(
    classIndex < 0,
    () => Object.freeze({ kind: 'controller_class_body_blocked' as const, candidate: classEvidence.token }),
    () => {
      const openIndex = relationIndexOf(relationSlice(tokens, classIndex + 1, tokens.length), token => relationAll([relationEqual(token.type, 'PUNCTUATION'), relationEqual(token.value, '{')]));
      const absoluteOpenIndex = relationGate(openIndex < 0, () => -1, () => classIndex + 1 + openIndex);
      return relationOptionFold(tokenAt(tokens, absoluteOpenIndex), () => Object.freeze({ kind: 'controller_class_body_blocked' as const, candidate: classEvidence.token }), evidence => {
        const closingIndex = findMatchingClassBrace(tokens, absoluteOpenIndex + 1, 1);
        return relationGate(closingIndex < 0, () => Object.freeze({ kind: 'controller_class_body_blocked' as const, candidate: evidence.token }), () => Object.freeze({ kind: 'controller_class_body_complete' as const, openIndex: absoluteOpenIndex, closeIndex: closingIndex }));
      });
    },
  ));
}

function findMatchingClassBrace(tokens: readonly TokenDescriptor[], index: number, depth: number): number {
  return relationGate(index >= tokens.length, () => -1, () => relationOptionFold(tokenAt(tokens, index), () => -1, evidence => {
    const opens = relationAll([relationEqual(evidence.token.type, 'PUNCTUATION'), relationEqual(evidence.token.value, '{')]);
    const closes = relationAll([relationEqual(evidence.token.type, 'PUNCTUATION'), relationEqual(evidence.token.value, '}')]);
    const nextDepth = relationGate(opens, () => depth + 1, () => relationGate(closes, () => depth - 1, () => depth));
    return relationGate(nextDepth === 0, () => index, () => findMatchingClassBrace(tokens, index + 1, nextDepth));
  }));
}

/** Enumerates named method candidates only at direct class-body depth; nested named functions are not class methods. */
function collectFunctionIndexes(tokens: readonly TokenDescriptor[], index: number, endIndex: number, depth: number, output: readonly number[]): readonly number[] {
  return relationGate(index >= endIndex, () => output, () => relationOptionFold(tokenAt(tokens, index), () => output, evidence => {
    const token = evidence.token;
    const opens = relationAll([relationEqual(token.type, 'PUNCTUATION'), relationEqual(token.value, '{')]);
    const closes = relationAll([relationEqual(token.type, 'PUNCTUATION'), relationEqual(token.value, '}')]);
    const nextDepth = relationGate(opens, () => depth + 1, () => relationGate(closes, () => depth - 1, () => depth));
    const next = relationGate(relationAll([relationEqual(token.value, 'function'), relationEqual(depth, 0)]), () => relationOptionFold(tokenAt(tokens, index + 1), () => output, name => relationGate(
      relationEqual(name.token.type, 'IDENTIFIER'),
      () => [...output, index],
      () => relationGate(relationEqual(name.token.value, '&'), () => relationOptionFold(tokenAt(tokens, index + 2), () => output, byReferenceName => relationGate(relationEqual(byReferenceName.token.type, 'IDENTIFIER'), () => [...output, index], () => output)), () => output),
    )), () => output);
    return collectFunctionIndexes(tokens, index + 1, endIndex, nextDepth, next);
  }));
}
