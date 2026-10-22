import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Laravel response CLI projection provenance phase 2202', () => {
  it('retains exact method projection judgments in the response scanner bundle', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../compiler/scanner/subscanners/responseScanner.ts'),
      'utf8',
    );
    expect(source).toContain('readonly projectionJudgments: readonly LaravelControllerMethodResponseAstProjectionJudgment[]');
    expect(source).toContain('projectionJudgments,');
    expect(source).toContain("projection.kind === 'controller_method_response_ast_projection_complete'");
    expect(source).toContain('projection.definition, ast: projection.ast');
  });

  it('preserves response projection judgments in the CLI-facing SourceAsts aggregate', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../compiler/scanner/wiring/laravelSourceAstPipeline.ts'),
      'utf8',
    );
    expect(source).toContain('responseProjectionJudgments: responseBundle.projectionJudgments');
    expect(source).toContain('contractVersion: 5');
  });

  it('preserves the enriched SourceAsts aggregate through manifest construction', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../compiler/scanner/wiring/upstreamManifestBuilder.ts'),
      'utf8',
    );
    expect(source).toContain('ast: completeAst');
  });

  it('defines response projection retention at the existing upstream SourceAsts boundary', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../collections.ts'), 'utf8');
    const contract = fs.readFileSync(path.resolve(__dirname, '../laravelSourceAstPipelineInterface.ts'), 'utf8');
    const scannerContract = fs.readFileSync(path.resolve(__dirname, '../laravelSourceAstScannerInterface.ts'), 'utf8');
    expect(source).toContain('readonly responseProjectionJudgments: readonly import(\'./laravelControllerResponseSemanticJudgmentInterface\').LaravelControllerMethodResponseAstProjectionJudgment[]');
    expect(contract).toContain('readonly contractVersion: 5');
    expect(scannerContract).toContain('readonly contractVersion: 4');
  });
});
