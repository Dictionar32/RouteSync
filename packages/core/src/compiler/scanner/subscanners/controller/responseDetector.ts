/* Relational response descriptor boundary. */
import type { Token } from '../lexer/types';
import { ResponseDescriptor, ModelResponseDescriptor, InlineResponseDescriptor } from '../../../../types/route';
import { ResourceFieldSemanticBinding } from '../../../../types/domain/resourceFieldSemanticBinding';
import { LaravelSourceLexer } from '../../LaravelSourceLexer';
import { toPascalCase } from '../../../../utils/resource-naming';
import { ResourceScanner } from '../ResourceScanner';
import { ErrorType } from '../../../types/SemanticType';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import { BoundSemanticFactory } from '../../../../types/domain/boundAst';
import { DetectedResourceInvocation, detectResourceInvocation } from './resourceInvocationDetector';
import { relationGate, relationFold, relationProject, relationAdvanceIndex, relationOptionFold, relationSome, relationNone, relationLookup, relationIsSome, type RelationOption } from '../../../../semantic/kernel/relationalSequence';
import { relationAll, relationAny, relationEqual } from '../../../../semantic/kernel/semanticRelations';
import { tokenKindAt, tokenValueAt } from '../../lexer/tokenEvidence';
import { solveRewriteCandidate, requirement } from '../../../../semantic/kernel/semanticDecisionRewriteEngine';

export { DetectedResourceInvocation, detectResourceInvocation };

export function detectResourceResponse(tokens: readonly Token[], k: number): RelationOption<ResponseDescriptor> {
  return relationOptionFold(detectResourceInvocation(tokens, k), () => relationNone(), invocation => relationSome(invocation.descriptor));
}

const modelCollectionMethods = Object.freeze([['all', true], ['paginate', true], ['get', true], ['cursor', true]] as const);
const modelSingleMethods = Object.freeze([['find', true], ['findOrFail', true], ['first', true], ['firstOrFail', true], ['create', true]] as const);

export function detectModelResponse(tokens: readonly Token[], k: number): RelationOption<ResponseDescriptor> {
  const modelIndex = relationAdvanceIndex(k, 1);
  const separatorIndex = relationAdvanceIndex(k, 2);
  const methodIndex = relationAdvanceIndex(k, 3);
  const modelName = relationOptionFold(tokenValueAt(tokens, modelIndex), () => '', value => value);
  const method = relationOptionFold(tokenValueAt(tokens, methodIndex), () => '', value => value);
  const modelKind = relationOptionFold(tokenKindAt(tokens, modelIndex), () => '', value => value);
  const separator = relationOptionFold(tokenValueAt(tokens, separatorIndex), () => '', value => value);
  const returned = relationOptionFold(tokenValueAt(tokens, k), () => '', value => value);
  return solveRewriteCandidate([
    { id: 'collection', rewrite: () => ModelResponseDescriptor.collection(modelName), requirements: [requirement('return', relationEqual(returned, 'return')), requirement('model', relationEqual(modelKind, 'IDENTIFIER')), requirement('separator', relationEqual(separator, '::')), requirement('method', relationIsSome(relationLookup(modelCollectionMethods, method)))], exclusions: [], dependencies: [] },
    { id: 'single', rewrite: () => ModelResponseDescriptor.single(modelName), requirements: [requirement('return', relationEqual(returned, 'return')), requirement('model', relationEqual(modelKind, 'IDENTIFIER')), requirement('separator', relationEqual(separator, '::')), requirement('method', relationIsSome(relationLookup(modelSingleMethods, method)))], exclusions: [], dependencies: [] },
  ]);
}

export function detectInlineResponse(source: string, tokens: readonly Token[], k: number, controllerName: string, actionName: string): RelationOption<ResponseDescriptor> {
  const shape = relationAll([
    relationEqual(relationOptionFold(tokenValueAt(tokens, k), () => '', value => value), 'return'),
    relationEqual(relationOptionFold(tokenValueAt(tokens, relationAdvanceIndex(k, 1)), () => '', value => value), 'response'),
    relationEqual(relationOptionFold(tokenValueAt(tokens, relationAdvanceIndex(k, 2)), () => '', value => value), '('),
  ]);
  const json = relationFold(tokens, { index: k, found: false, parsed: { entries: [] } as ReturnType<typeof LaravelSourceLexer.parseArray> }, (state, token, index) =>
    relationGate(state.found, () => state, () => relationGate(relationAll([
      relationEqual(token.value, 'json'),
      relationEqual(relationOptionFold(tokenValueAt(tokens, relationAdvanceIndex(index, 1)), () => '', value => value), '(')
    ]), () => ({ index, found: true, parsed: LaravelSourceLexer.parseArray(source, tokens, relationAdvanceIndex(index, 1)) }), () => state))
  );
  const fields: ResourceFieldSemanticBinding[] = relationProject(json.parsed.entries, entry => {
    const mapped = ResourceScanner.resolveAstValueToExpression(entry.value);
    const semanticType = relationGate(relationEqual(mapped.semantic.kind, 'known'), () => mapped.semantic.type, () => ErrorType('Inline response field requires verified semantic binding'));
    return ResourceFieldSemanticBinding.fromExpression(entry.key, mapped.expression, semanticType, entry.key, BoundSemanticFactory.unsupported('parser_gap'));
  });
  const domain = resolveInlineDomain(controllerName, actionName);
  return relationGate(relationAll([shape, json.found, json.parsed.entries.length > 0]), () => relationSome(InlineResponseDescriptor.create({ domain, baseName: toPascalCase(domain), typeName: `${toPascalCase(domain)}Transformed`, fields, shape: 'single', origin: { kind: 'inferred', sourceFile: SemanticValueFactory.sourceFilePath('<inline>'), trace: Object.freeze([]) }, semanticContract: { kind: 'object', name: `${toPascalCase(domain)}Transformed`, shape: 'single', fields: Object.freeze([]) } })), () => relationNone());
}

function resolveInlineDomain(controllerName: string, actionName: string): string {
  const conventional = Object.freeze([['index', true], ['show', true], ['store', true], ['update', true], ['destroy', true]] as const);
  return relationGate(relationIsSome(relationLookup(conventional, actionName)), () => {
    const baseCtrl = controllerName.replace(/Controller$/, '');
    const mapped = relationLookup(Object.freeze([['Category', 'Categories'], ['ProductReview', 'ProdukReviews'], ['Order', 'Orders']] as const), baseCtrl);
    return relationOptionFold(mapped, () => baseCtrl, value => value);
  }, () => relationGate(actionName.length > 0, () => toPascalCase(actionName), () => 'Inline'));
}
