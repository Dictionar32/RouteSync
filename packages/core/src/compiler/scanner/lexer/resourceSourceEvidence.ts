import { sourceFileAcquisition } from '../sourceFiles';
import path from 'path';
import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import type { PhpArrayEntry } from './PhpAst';
import type { PhpStatement } from './phpAstTypes';
import type { PhpMethodAst } from './phpMethodAstTypes';
import type { PhpClassPropertyAst } from './phpAstDeclarationTypes';
import type { ClassName, ResourceName, SourceFile, VariableName } from '../../../types/upstream/names';
import type { ModelReference } from '../../../types/upstream/semanticReferences';
import type { ResourceWrapping, ResourceCollectionFeatures } from '../../../types/upstream/resource';
import type { TruthValue } from '../../../types/upstream/valueObjects';
import type { ResourceRelationBindingEvidence } from '../../../types/upstream/laravelScannerSemanticJudgment';
import type { LaravelResourceSourceEvidence, ResourceSourceEvidenceScannerInterface } from '../../../types/upstream/laravelResourceScannerInterface';
import type { PhpAstValue, PhpArrayKey } from './phpAstTypes';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { classifyPhpBlock } from './astClassifier';
import { parsePhpMethodOrThrow } from './phpMethodParser';
import { sourceAstSyntaxParser } from '../../semantic/sourceAstSyntaxParser';
import { relationAsyncFold, relationProject, relationExpand, relationOptionFold, relationAdvanceIndex, relationFirstOption, relationFold, relationIndexOf, relationSlice, relationSome, relationNone, relationVariantFold } from '../../../semantic/relations/relationalSequence';
import { relationEqual, relationGate, relationAll, relationAny } from '../../../semantic/relations/semanticRelations';

export interface ResourceScanIdentityEvidence {
  readonly kind: 'resource_scan_identity';
  readonly resourceName: ResourceName;
  readonly sourceFile: SourceFile;
  readonly sourceLine: number;
  readonly sourceLength: number;
}

export interface ResourceScanSyntaxEvidence {
  readonly kind: 'resource_scan_syntax';
  readonly entries: readonly PhpArrayEntry[];
  readonly assignments: readonly PhpStatement[];
  readonly method: PhpMethodAst;
  readonly baseClass: ClassName;
  readonly wrapping: ResourceWrapping;
  readonly requestParameter: VariableName;
  readonly documentationMixins: readonly ModelReference[];
  readonly methods: readonly PhpMethodAst[];
  readonly properties: readonly PhpClassPropertyAst[];
  readonly preserveKeys: TruthValue;
  readonly forceWrapping: TruthValue;
  readonly usesRequestQueryString: TruthValue;
  readonly includesPreviouslyLoadedRelationships: TruthValue;
  readonly jsonAttributes: readonly PhpArrayEntry[];
  readonly jsonRelationships: readonly PhpArrayEntry[];
  readonly collectsResource: ResourceCollectionFeatures['collects'];
}

export interface ResourceScanEvidence extends LaravelResourceSourceEvidence<ResourceScanIdentityEvidence, ResourceScanSyntaxEvidence> {}

const scanResourceSourceEvidence = async (sourceProject: SourceProjectIdentity): Promise<readonly ResourceScanEvidence[]> => {
  const sourceRoot = sourceProject.root.value.value;
  const resourceDirectory = path.join(sourceRoot, 'app', 'Http', 'Resources');
  const files = await sourceFileAcquisition.collectPhpFiles(resourceDirectory);
  const initialEvidence: ResourceScanEvidence[] = [];
  return relationAsyncFold(files, initialEvidence, async (parsedFiles, fullPath) => {
    const source = await sourceFileAcquisition.readSourceText(fullPath);
    const tokens = LaravelSourceLexer.tokenize(source);
    const resourceName = SemanticValueFactory.resourceName(path.basename(fullPath, '.php'));
    const returnIndex = findReturnIndex(tokens);
    const parsedArray = LaravelSourceLexer.parseArray(source, tokens, returnIndex);
    const method = parseToArrayMethod(tokens);
    const requestParameter = relationOptionFold(
      relationFirstOption(method.parameters, parameter => relationEqual(parameter.name, 'request')),
      () => 'request',
      parameter => parameter.name,
    );
    const identity: ResourceScanIdentityEvidence = Object.freeze({
      kind: 'resource_scan_identity',
      resourceName,
      sourceFile: SemanticValueFactory.sourceFilePath(fullPath),
      sourceLine: tokens[returnIndex].line,
      sourceLength: source.length,
    });
    const baseClass: ClassName = { kind: 'class_name', value: { kind: 'string_value', value: parseResourceBaseClass(tokens) } };
    const requestParameterEvidence: VariableName = { kind: 'variable_name', value: { kind: 'string_value', value: requestParameter } };
    const syntax: ResourceScanSyntaxEvidence = Object.freeze({
      kind: 'resource_scan_syntax',
      entries: parsedArray.entries,
      assignments: parseMethodAssignments(tokens, returnIndex),
      method,
      baseClass,
      wrapping: parseResourceWrapping(tokens),
      requestParameter: requestParameterEvidence,
      documentationMixins: parseResourceDocumentationMixins(source),
      methods: parseResourceMethods(tokens),
      properties: sourceAstSyntaxParser.parseProperties(tokens),
      preserveKeys: parseBooleanProperty(tokens, 'preserveKeys'),
      forceWrapping: parseBooleanProperty(tokens, 'forceWrapping'),
      usesRequestQueryString: parseBooleanProperty(tokens, 'usesRequestQueryString'),
      includesPreviouslyLoadedRelationships: parseBooleanProperty(tokens, 'includesPreviouslyLoadedRelationships'),
      jsonAttributes: parseClassArrayProperty(source, tokens, 'attributes'),
      jsonRelationships: parseClassArrayProperty(source, tokens, 'relationships'),
      collectsResource: parseCollectsResource(tokens),
    });
    const evidence: ResourceScanEvidence = Object.freeze({
      kind: 'resource_scan_evidence',
      identity,
      syntax,
      relations: resourceRelationEvidence(resourceName, parsedArray.entries, SemanticValueFactory.sourceFilePath(fullPath), source.length),
    });
    return [...parsedFiles, evidence];
  });
};

export const resourceSourceEvidenceScanner: ResourceSourceEvidenceScannerInterface<ResourceScanEvidence> = Object.freeze({
  kind: 'laravel_resource_source_evidence_scanner',
  closed: true,
  contractVersion: 1,
  scan: scanResourceSourceEvidence,
});

function resourceRelationEvidence(
  parentName: ResourceName,
  entries: readonly PhpArrayEntry[],
  sourceFile: SourceFile,
  sourceLength: number,
): readonly ResourceRelationBindingEvidence[] {
  const source: import('../../../types/upstream/provenance').SourceSpan = { kind: 'source_span', file: sourceFile, start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: sourceLength } };
  return relationExpand(entries, entry => relationVariantFold<PhpArrayEntry, 'keyed', readonly ResourceRelationBindingEvidence[]>(entry, 'keyed',
    () => [],
    keyed => relationVariantFold<PhpArrayKey, 'string', readonly ResourceRelationBindingEvidence[]>(keyed.key, 'string',
      () => [],
      key => relationVariantFold<PhpAstValue, 'resource_single', readonly ResourceRelationBindingEvidence[]>(keyed.value, 'resource_single',
        rest => relationVariantFold<Exclude<PhpAstValue, { readonly kind: 'resource_single' }>, 'resource_collection', readonly ResourceRelationBindingEvidence[]>(rest, 'resource_collection',
          () => [],
          collection => [{ kind: 'resource_relation_binding_evidence', parent: { kind: 'resource_reference', name: parentName }, child: { kind: 'resource_reference', name: SemanticValueFactory.resourceName(collection.resourceName) }, relation: SemanticValueFactory.relationName(key.value), source }],
        ),
        single => [{ kind: 'resource_relation_binding_evidence', parent: { kind: 'resource_reference', name: parentName }, child: { kind: 'resource_reference', name: SemanticValueFactory.resourceName(single.resourceName) }, relation: SemanticValueFactory.relationName(key.value), source }],
      ),
    ),
  ));
}

function findReturnIndex(tokens: readonly { readonly value: string; readonly type?: string }[]): number {
  const toArrayIndex = relationIndexOf(tokens, (token, index) => relationAll([
    relationEqual(token.value, 'toArray'),
    relationEqual(tokens[relationAdvanceIndex(index, -1)]?.value, 'function'),
  ]));
  const returnAfterToArray = relationFirstOption(tokens, (token, index) => relationAll([
    index > toArrayIndex,
    relationEqual(token.value, 'return'),
  ]));
  const returnAny = relationFirstOption(tokens, token => relationEqual(token.value, 'return'));
  return relationOptionFold(
    relationGate(toArrayIndex >= 0, () => returnAfterToArray, () => relationNone()),
    () => relationOptionFold(returnAny, () => { throw Error('Resource source must contain a return statement at the semantic boundary'); }, (_, index = relationIndexOf(tokens, token => relationEqual(token.value, 'return'))) => index),
    token => relationIndexOf(tokens, candidate => relationEqual(candidate, token)),
  );
}

function parseCollectsResource(tokens: readonly import('./PhpAst').TokenDescriptor[]): ResourceCollectionFeatures['collects'] {
  const propertyIndex = relationIndexOf(tokens, token => relationAny([relationEqual(token.value, '$collects'), relationEqual(token.value, 'collects')]));
  const equalsIndex = relationIndexOf(tokens, (token, index) => relationAll([index > propertyIndex, relationEqual(token.value, '=')]));
  const name = relationGate(equalsIndex >= 0, () => relationSome(tokens[relationAdvanceIndex(equalsIndex, 1)]), () => relationNone());
  return relationOptionFold(name,
    () => ({ kind: 'collection_resource_inference' }),
    value => relationGate(relationEqual(value.type, 'IDENTIFIER'), () => ({ kind: 'resource_reference', name: { kind: 'resource_name', value: { kind: 'string_value', value: value.value } } }), () => ({ kind: 'collection_resource_inference' })));
}

function parseResourceMethods(tokens: readonly import('./PhpAst').TokenDescriptor[]): readonly PhpMethodAst[] {
  const initialState: { depth: number; methods: PhpMethodAst[] } = { depth: 0, methods: [] };
  const state = relationFold(tokens, initialState, (current, token, index) => {
    const nextDepth = relationGate(relationEqual(token.value, '{'), () => current.depth + 1, () => relationGate(relationEqual(token.value, '}'), () => current.depth - 1, () => current.depth));
    const isMethod = relationAll([relationEqual(token.value, 'function'), relationEqual(current.depth, 1)]);
    return relationGate(isMethod, () => ({ ...current, depth: nextDepth, methods: [...current.methods, parsePhpMethodOrThrow('', tokens, index)] }), () => ({ ...current, depth: nextDepth }));
  });
  return state.methods;
}

function parseBooleanProperty(tokens: readonly import('./PhpAst').TokenDescriptor[], name: string): TruthValue {
  const propertyIndex = relationIndexOf(tokens, token => relationAny([relationEqual(token.value, '$' + name), relationEqual(token.value, name)]));
  const equalsIndex = relationIndexOf(tokens, (token, index) => relationAll([index > propertyIndex, relationEqual(token.value, '=')]));
  const value = relationGate(equalsIndex >= 0, () => relationSome(tokens[relationAdvanceIndex(equalsIndex, 1)]), () => relationNone());
  return { kind: 'truth_value', value: relationOptionFold(value, () => false, token => relationEqual(token.value, 'true')) };
}

function parseClassArrayProperty(source: string, tokens: readonly import('./PhpAst').TokenDescriptor[], name: string): readonly PhpArrayEntry[] {
  const propertyIndex = relationIndexOf(tokens, token => relationAny([relationEqual(token.value, '$' + name), relationEqual(token.value, name)]));
  const arrayIndex = relationIndexOf(tokens, (token, index) => relationAll([index > propertyIndex, relationEqual(token.value, '[')]));
  return relationGate(arrayIndex < 0, () => [], () => LaravelSourceLexer.parseArray(source, tokens, arrayIndex).entries);
}

function parseToArrayMethod(tokens: readonly import('./PhpAst').TokenDescriptor[]): PhpMethodAst {
  const functionIndex = relationIndexOf(tokens, (token, index) => relationAll([relationEqual(token.value, 'function'), relationEqual(tokens[relationAdvanceIndex(index, 1)]?.value, 'toArray')]));
  return relationGate(functionIndex < 0, () => { throw Error('Resource source must contain toArray() at the AST boundary'); }, () => parsePhpMethodOrThrow('', tokens, functionIndex));
}

function parseResourceBaseClass(tokens: readonly import('./PhpAst').TokenDescriptor[]): string {
  const classIndex = relationIndexOf(tokens, token => relationEqual(token.value, 'class'));
  const extendsIndex = relationIndexOf(tokens, (token, index) => relationAll([index > classIndex, relationEqual(token.value, 'extends')]));
  const base = relationGate(extendsIndex >= 0, () => relationSome(tokens[relationAdvanceIndex(extendsIndex, 1)]), () => relationNone());
  return relationOptionFold(base, () => { throw Error('Resource class must declare its Laravel resource base class'); }, token => relationGate(relationEqual(token.type, 'IDENTIFIER'), () => token.value, () => { throw Error('Resource class base must be an identifier'); }));
}

function parseResourceWrapping(tokens: readonly import('./PhpAst').TokenDescriptor[]): ResourceWrapping {
  const wrapIndex = relationIndexOf(tokens, token => relationEqual(token.value, '$wrap'));
  const equalsIndex = relationIndexOf(tokens, (token, index) => relationAll([index > wrapIndex, relationEqual(token.value, '=')]));
  const value = relationGate(equalsIndex >= 0, () => relationSome(tokens[relationAdvanceIndex(equalsIndex, 1)]), () => relationNone());
  return relationGate(wrapIndex < 0, () => ({ kind: 'framework_default' }), () => relationOptionFold(value, () => { throw Error('Resource $wrap declaration could not be resolved at the AST boundary'); }, token => relationGate(relationEqual(token.value, 'null'), () => ({ kind: 'unwrapped' }), () => ({ kind: 'wrapped', key: { kind: 'string_value', value: token.value.replace(/^['"]|['"]$/g, '') } }))));
}

function parseResourceDocumentationMixins(source: string): readonly ModelReference[] {
  const pattern = /@mixin\s+\\?App\\Models\\([A-Za-z_][A-Za-z0-9_]*)/g;
  return relationProject(Array.from(source.matchAll(pattern)), match => ({ kind: 'model_reference', name: { kind: 'model_name', value: { kind: 'string_value', value: match[1] } } }));
}

function parseMethodAssignments(tokens: readonly import('./PhpAst').TokenDescriptor[], returnIndex: number): readonly PhpStatement[] {
  const prefix = relationSlice(tokens, 0, returnIndex);
  const functionIndex = relationIndexOf(prefix, (token, index) => relationAll([relationEqual(token.value, 'function'), relationEqual(prefix[relationAdvanceIndex(index, 1)]?.value, 'toArray')]));
  const bodySearch = relationSlice(prefix, relationAdvanceIndex(functionIndex, 1));
  const bodyOffset = relationIndexOf(bodySearch, token => relationEqual(token.value, '{'));
  const bodyStart = relationGate(bodyOffset >= 0, () => relationAdvanceIndex(functionIndex, relationAdvanceIndex(bodyOffset, 1)), () => -1);
  const body = relationGate(bodyStart >= 0, () => relationSlice(tokens, relationAdvanceIndex(bodyStart, 1), returnIndex), () => []);
  const state = relationFold(body, { depth: 0, close: -1 }, (current, token, index) => {
    const depth = relationGate(relationEqual(token.value, '{'), () => current.depth + 1, () => relationGate(relationEqual(token.value, '}'), () => current.depth - 1, () => current.depth));
    const close = relationGate(relationAll([current.close < 0, relationEqual(depth, 0)]), () => index, () => current.close);
    return { depth, close };
  });
  return relationGate(relationAny([functionIndex < 0, bodyStart < 0, state.close < 0]), () => [], () => classifyPhpBlock(relationSlice(body, 0, state.close)).statements);
}

