import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const readSource = (relativePath: string): string => readFileSync(path.resolve(sourceRoot, relativePath), 'utf8');

describe('canonical action publication phase 2221', () => {
  it('publishes route/action identity from semantic knowledge, not projection identity', () => {
    const scanner = readSource('compiler/scanner/wiring/laravelControllerScanner.ts');
    const correlation = readSource('types/upstream/laravelControllerActionRouteCorrelationAuthority.ts');

    expect(scanner).toContain('controller: semanticJudgment.semantic.controllerName');
    expect(scanner).toContain('action: semanticJudgment.semantic.actionName');
    expect(scanner).toContain('sourceFile: semanticJudgment.semantic.source.file');
    expect(scanner).toContain('source: semanticJudgment.semantic.source');
    expect(scanner).not.toContain('controller: semanticJudgment.projection.identity.controllerName');
    expect(scanner).not.toContain('action: semanticJudgment.projection.identity.actionName');
    expect(correlation).toContain('publication.controller.value.value === judgment.semantic.controllerName.value.value');
    expect(correlation).toContain('publication.action.value.value === judgment.semantic.actionName.value.value');
  });

  it('keeps integrated response ownership separate from per-action identity publication', () => {
    const scanner = readSource('compiler/scanner/wiring/laravelControllerScanner.ts');
    const dependencies = readSource('compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');

    expect(scanner).toContain('this.responseSemanticPipeline.judgeIntegratedResponse');
    expect(scanner).toContain('responseJudgment,');
    expect(dependencies).toContain('integratedResponseOwnership:');
    expect(dependencies).toContain('LaravelControllerResponseSemanticPipelineInterface');
    expect(dependencies).toContain('response-descriptor-derivation-is-retired-from-action-contract');
  });
});
