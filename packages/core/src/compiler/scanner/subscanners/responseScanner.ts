import { sourceFileAcquisition } from '../sourceFiles';
import path from 'path';
import fs from 'node:fs';
import type { ResponseAst } from '../../../types/upstream/ast';
import type { ResponseDefinition } from '../../../types/upstream/response';
import type { ResourceDefinition } from '../../../types/upstream/resource';
import type { ResponseProducerResult } from './responseProducer';
import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import type { ResponseDtoDeclarationAst } from '../lexer/responseDtoAstTypes';
import { responseProducer } from './responseProducer';
import type { SourceSpan } from '../../../types/upstream/provenance';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { createSourceFile, stringValue } from '../../../types/upstream/names';
import type { LaravelControllerScanJudgment, LaravelControllerScanArtifact } from '../../../types/upstream/laravelControllerScannerInterface';
import { laravelControllerResponseSemanticPipeline } from '../../../types/upstream/laravelControllerResponseSemanticPipeline';
import type { LaravelControllerMethodResponseAstProjectionJudgment, LaravelControllerResponseSemanticPipelineInterface } from '../../../types/upstream/laravelControllerResponseSemanticJudgmentInterface';
import type { LaravelResponseScannerInput, LaravelResponseScannerInterface, LaravelResponseScannerResult } from '../../../types/upstream/laravelResponseScannerInterface';
import type { LaravelFrameworkVersionCompatibility, LaravelFrameworkVersionLockEvidence } from '../../../types/upstream/laravelControllerResponseSemanticJudgmentInterface';

const span = (file: string, line: number): SourceSpan => ({
  kind: 'source_span',
  file: { kind: 'source_file', value: stringValue(file) },
  start: { kind: 'number_value', value: line },
  end: { kind: 'number_value', value: line },
});


function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function laravelFrameworkVersionLockEvidence(sourceProject: SourceProjectIdentity): LaravelFrameworkVersionLockEvidence {
  const lockFile = path.join(sourceProject.root.value.value, 'composer.lock');
  let contents: string;
  try {
    contents = fs.readFileSync(lockFile, 'utf8');
  } catch {
    return Object.freeze({ kind: 'laravel_framework_lock_unavailable' });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    return Object.freeze({ kind: 'laravel_framework_lock_invalid' });
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.packages)) {
    return Object.freeze({ kind: 'laravel_framework_lock_invalid' });
  }

  const frameworkPackage = parsed.packages.find((entry: unknown) => isRecord(entry) && entry.name === 'laravel/framework');
  if (!isRecord(frameworkPackage) || typeof frameworkPackage.version !== 'string') {
    return Object.freeze({ kind: 'laravel_framework_package_not_locked' });
  }

  return Object.freeze({
    kind: 'laravel_framework_version_candidate',
    version: stringValue(frameworkPackage.version),
    sourceFile: createSourceFile(lockFile),
  });
}

function definition(ast: ResponseDtoDeclarationAst, file: string): ResponseProducerResult {
  return responseProducer.produce({ kind: 'dto', declaration: ast, source: span(file, Number(ast.source.line)) });
}

function className(tokens: readonly { readonly value: string }[]): string {
  for (let index = 0; index + 1 < tokens.length; index += 1) {
    if (tokens[index].value === 'class') {
      return tokens[index + 1].value;
    }
  }
  throw Error('Response DTO class declaration not found');
}

async function scanFiles(files: readonly string[], results: readonly ResponseProducerResult[]): Promise<readonly ResponseProducerResult[]> {
  const collected: ResponseProducerResult[] = [...results];
  for (const file of files) {
    const source = await sourceFileAcquisition.readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(source);
    const ast = LaravelSourceLexer.parseResponseDtoDeclaration(tokens, createAstIdentifier(className(tokens)));
    collected.push(definition(ast, file));
  }
  return Object.freeze(collected);
}

function controllerResponseProjectionJudgments(
  controllerScan: LaravelControllerScanJudgment,
  resourceDefinitions: readonly ResourceDefinition[],
  frameworkVersion: LaravelFrameworkVersionCompatibility,
  responsePipeline: LaravelControllerResponseSemanticPipelineInterface,
): readonly LaravelControllerMethodResponseAstProjectionJudgment[] {
  return Object.freeze(controllerScan.controllers.flatMap((artifact: LaravelControllerScanArtifact) => {
    switch (artifact.responseJudgment.kind) {
      case 'controller_response_method_products_complete': {
        const products = Object.freeze([
          artifact.responseJudgment.product.firstMethod,
          ...artifact.responseJudgment.product.remainingMethods,
        ]);
        return Object.freeze(products.map(product => responsePipeline.methodResponseAstProjection.project(Object.freeze({
          kind: 'laravel_controller_method_response_ast_projection_input',
          product,
          actionJudgments: artifact.actionJudgments,
          resourceDefinitions,
          frameworkVersion,
        }))));
      }
      default:
        // Unresolved, blocked, rejected, and return-semantic-only judgments do not fabricate ResponseAst values.
        return Object.freeze([]);
    }
  }));
}

export type ResponseScannerBundle = LaravelResponseScannerResult;

export async function scanResponseBundle(sourceProject: SourceProjectIdentity, controllerScan: LaravelControllerScanJudgment, resourceDefinitions: readonly ResourceDefinition[], responsePipeline: LaravelControllerResponseSemanticPipelineInterface = laravelControllerResponseSemanticPipeline): Promise<ResponseScannerBundle> {
  const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'app', 'Http', 'DTOs');
  const files = await sourceFileAcquisition.collectPhpFiles(directory);
  const dtoResults = await scanFiles(files, Object.freeze([]));
  const frameworkVersionEvidence = laravelFrameworkVersionLockEvidence(sourceProject);
  const frameworkVersion = responsePipeline.paginationEnvelope.metadataProfile.frameworkVersionCompatibility.judge(Object.freeze({ kind: 'laravel_framework_version_compatibility_judgment_input', evidence: frameworkVersionEvidence }));
  const projectionJudgments = controllerResponseProjectionJudgments(controllerScan, resourceDefinitions, frameworkVersion, responsePipeline);
  const projectedResults: readonly ResponseProducerResult[] = Object.freeze(projectionJudgments.flatMap(projection => projection.kind === 'controller_method_response_ast_projection_complete' ? [Object.freeze({ definition: projection.definition, ast: projection.ast })] : []));
  const results = Object.freeze([...dtoResults, ...projectedResults]);
  return Object.freeze({
    definitions: Object.freeze(results.map(result => result.definition)),
    asts: Object.freeze(results.map(result => result.ast)),
    projectionJudgments,
  });
}

export async function scanResponseAsts(sourceProject: SourceProjectIdentity, controllerScan: LaravelControllerScanJudgment, resourceDefinitions: readonly ResourceDefinition[], responsePipeline: LaravelControllerResponseSemanticPipelineInterface = laravelControllerResponseSemanticPipeline): Promise<readonly ResponseAst[]> {
  return (await scanResponseBundle(sourceProject, controllerScan, resourceDefinitions, responsePipeline)).asts;
}

/** Interface-bound adapter consumed by the source-AST composition root. */
export const laravelResponseScanner: LaravelResponseScannerInterface = Object.freeze({
  kind: 'laravel_response_scanner',
  closed: true,
  contractVersion: 1,
  scan: (input: LaravelResponseScannerInput): Promise<LaravelResponseScannerResult> =>
    scanResponseBundle(input.sourceProject, input.controllerScan, input.resourceDefinitions, input.responsePipeline),
});
