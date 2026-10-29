import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Laravel response scanner interface closure phase 2203', () => {
  it('defines the response scan contract in the upstream owner', () => {
    const contract = fs.readFileSync(path.resolve(__dirname, '../laravelResponseScannerInterface.ts'), 'utf8');
    expect(contract).toContain('export interface LaravelResponseScannerInterface');
    expect(contract).toContain('readonly responsePipeline: LaravelControllerResponseSemanticPipelineInterface');
    expect(contract).toContain('readonly projectionJudgments: readonly LaravelControllerMethodResponseAstProjectionJudgment[]');
  });

  it('injects the response scanner through the source-AST pipeline composition contract', () => {
    const pipeline = fs.readFileSync(path.resolve(__dirname, '../../../compiler/scanner/wiring/laravelSourceAstPipeline.ts'), 'utf8');
    const pipelineContract = fs.readFileSync(path.resolve(__dirname, '../laravelSourceAstPipelineInterface.ts'), 'utf8');
    expect(pipelineContract).toContain('export interface LaravelSourceAstPipelineDependenciesInterface');
    expect(pipelineContract).toContain('readonly responseScanner: LaravelResponseScannerInterface');
    expect(pipeline).toContain('laravelSourceAstPipelineFactory: LaravelSourceAstPipelineFactoryInterface = Object.freeze({');
    expect(pipeline).toContain('responseScanner.scan(Object.freeze({');
    expect(pipeline).not.toContain('scanResponseBundle(sourceProject, controllerScan, resourceDefinitions)');
  });

  it('implements the upstream contract without introducing a second semantic authority', () => {
    const implementation = fs.readFileSync(path.resolve(__dirname, '../../../compiler/scanner/operations/responseScanner.ts'), 'utf8');
    expect(implementation).toContain('export interface LaravelResponseScannerOperationsInterface extends LaravelResponseScannerInterface');
    expect(implementation).toContain('export const laravelResponseScanner: LaravelResponseScannerOperationsInterface = Object.freeze({');
    expect(implementation).toContain('scan: scanResponseBundleImplementation');
    expect(implementation).toContain('scanBundle: scanResponseBundleImplementation');
    expect(implementation).toContain('scanAsts: scanResponseAstsImplementation');
    expect(implementation).not.toMatch(/export\s+async\s+function\s+scanResponse(?:Bundle|Asts)\b/);
  });
});
