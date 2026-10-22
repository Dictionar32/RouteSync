import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const readSource = (relativePath: string): string =>
  readFileSync(path.resolve(sourceRoot, relativePath), 'utf8');

describe('controller action source-span publication phase 2218', () => {
  it('makes the exact method span part of canonical action semantic knowledge', () => {
    const contract = readSource('types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');

    expect(contract).toContain('readonly methodSource: SourceSpan;');
    expect(contract).toContain('readonly source: SourceSpan;');
    expect(contract).toContain('readonly controllerName: ControllerName;');
    expect(contract).toContain("readonly publishedKnowledge: readonly ['controllerName', 'source', 'actionName'");
    expect(contract).toContain("readonly methodSourceCorrelation: 'canonical-action-judgment-retains-the-exact-method-source-span-and-correlates-it-to-the-invocation-source-file';");
    expect(contract).toContain("readonly publishedKnowledge: readonly ['controllerName', 'source', 'actionName'");
  });

  it('projects the parser method span into the same action judgment and publication', () => {
    const scanner = readSource('compiler/scanner/wiring/laravelControllerScanner.ts');
    const dependencies = readSource('compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
    const publication = readSource('types/upstream/laravelControllerScannerInterface.ts');

    expect(scanner).toContain('methodSource: Object.freeze({');
    expect(scanner).toContain('start: numberValue(method.source.startOffset)');
    expect(scanner).toContain('end: numberValue(method.source.endOffset)');
    expect(scanner).toContain('sourceFile: semanticJudgment.semantic.source.file');
    expect(scanner).toContain('source: semanticJudgment.semantic.source');
    expect(dependencies).toContain('controllerName: input.controller');
    expect(dependencies).toContain('source: input.methodSource');
    expect(publication).toContain('readonly source: SourceSpan;');
  });
});
