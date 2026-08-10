/**
 * @file CodeGenerationEngine.test.ts
 * @description Unit tests untuk CodeGenerationEngine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CodeGenerationEngine, PipelineBuilder } from '../CodeGenerationEngine';
import { MemoryWriter } from '../../writers/MemoryWriter';
import type { IGenerator } from '../../generators/IGenerator';
import type { IFormatter } from '../../formatting/IFormatter';
import type { IEmitter } from '../../emitters/IEmitter';
import type { ITargetNode } from '../../target/ITargetNode';
import type { GeneratedArtifact } from '../../writers/IWriter';

/**
 * Mock implementations untuk testing
 */

// Mock Target Node
interface MockTargetNode extends ITargetNode {
    readonly kind: 'MockNode';
    readonly value: string;
    accept<R>(visitor: { visitMock?: (node: MockTargetNode) => R; defaultResult?: () => R }): R;
}

// Mock Input
interface MockInput {
    readonly data: string;
}

// Mock Generator
class MockGenerator implements IGenerator<MockInput, MockTargetNode> {
    generate(input: MockInput): MockTargetNode {
        const node: MockTargetNode = {
            kind: 'MockNode',
            value: `Generated: ${input.data}`,
            accept<R>(visitor: { visitMock?: (node: MockTargetNode) => R; defaultResult?: () => R }): R {
                if (visitor.visitMock) {
                    return visitor.visitMock(node);
                }
                if (visitor.defaultResult) {
                    return visitor.defaultResult();
                }
                throw new Error('No visitor method or default result');
            }
        };
        return node;
    }
}

// Mock Formatter
class MockFormatter implements IFormatter<MockTargetNode> {
    format(ast: MockTargetNode): MockTargetNode {
        const node: MockTargetNode = {
            kind: ast.kind,
            value: `Formatted: ${ast.value}`,
            accept<R>(visitor: { visitMock?: (node: MockTargetNode) => R; defaultResult?: () => R }): R {
                if (visitor.visitMock) {
                    return visitor.visitMock(node);
                }
                if (visitor.defaultResult) {
                    return visitor.defaultResult();
                }
                throw new Error('No visitor method or default result');
            }
        };
        return node;
    }
}

// Mock Emitter
class MockEmitter implements IEmitter<MockTargetNode> {
    emit(ast: MockTargetNode): string {
        return `// Mock Code\n${ast.value}\n`;
    }
}

describe('CodeGenerationEngine', () => {
    let generator: MockGenerator;
    let formatter: MockFormatter;
    let emitter: MockEmitter;
    let writer: MemoryWriter;

    beforeEach(() => {
        generator = new MockGenerator();
        formatter = new MockFormatter();
        emitter = new MockEmitter();
        writer = new MemoryWriter();
    });

    describe('Pipeline Execution', () => {
        it('should execute complete pipeline successfully', async () => {
            const engine = new CodeGenerationEngine({
                generator,
                formatter,
                emitter,
                writer,
                config: { verbose: false }
            });

            const input: MockInput = { data: 'Test Input' };
            const result = await engine.execute(input);

            expect(result.artifacts).toHaveLength(1);
            expect(result.warnings).toHaveLength(0);
            expect(result.metrics.totalTimeMs).toBeGreaterThan(0);
        });

        it('should write generated code to memory writer', async () => {
            const engine = new CodeGenerationEngine({
                generator,
                formatter,
                emitter,
                writer,
                config: { verbose: false }
            });

            const input: MockInput = { data: 'Test Input' };
            await engine.execute(input);

            // Check file was written
            const files = writer.getAllFiles();
            expect(files.size).toBe(1);

            // Check content contains expected transformations
            const content = Array.from(files.values())[0];
            expect(content).toContain('// Mock Code');
            expect(content).toContain('Formatted: Generated: Test Input');
        });

        it('should track stage metrics correctly', async () => {
            const engine = new CodeGenerationEngine({
                generator,
                formatter,
                emitter,
                writer,
                config: { verbose: false }
            });

            const input: MockInput = { data: 'Test Input' };
            const result = await engine.execute(input);

            // All stages should have timing metrics
            expect(result.metrics.stages.generationMs).toBeGreaterThan(0);
            expect(result.metrics.stages.formattingMs).toBeGreaterThan(0);
            expect(result.metrics.stages.emissionMs).toBeGreaterThan(0);
            expect(result.metrics.stages.writingMs).toBeGreaterThan(0);

            // Total time should be sum of all stages
            const stagesTotal =
                result.metrics.stages.generationMs +
                result.metrics.stages.formattingMs +
                result.metrics.stages.emissionMs +
                result.metrics.stages.writingMs;

            expect(result.metrics.totalTimeMs).toBeGreaterThanOrEqual(stagesTotal);
        });
    });

    describe('Configuration', () => {
        it('should skip formatting when disabled', async () => {
            const engine = new CodeGenerationEngine({
                generator,
                formatter,
                emitter,
                writer,
                config: {
                    stages: { formatting: false },
                    verbose: false
                }
            });

            const input: MockInput = { data: 'Test Input' };
            const result = await engine.execute(input);

            // Formatting time should be 0
            expect(result.metrics.stages.formattingMs).toBe(0);

            // Content should NOT have "Formatted:" prefix
            const files = writer.getAllFiles();
            const content = Array.from(files.values())[0];
            expect(content).not.toContain('Formatted:');
            expect(content).toContain('Generated: Test Input');
        });

        it('should use custom file naming strategy', async () => {
            const customNaming = {
                getFileName: (artifactType: string) => `custom-${artifactType.toLowerCase()}.ts`
            };

            const engine = new CodeGenerationEngine({
                generator,
                formatter,
                emitter,
                writer,
                config: {
                    fileNaming: customNaming,
                    verbose: false
                }
            });

            const input: MockInput = { data: 'Test Input' };
            await engine.execute(input);

            // Check custom filename was used
            const files = writer.getAllFiles();
            const filenames = Array.from(files.keys());
            expect(filenames[0]).toMatch(/^custom-.*\.ts$/);
        });
    });

    describe('Error Handling', () => {
        it('should throw PipelineError on generation failure', async () => {
            const failingGenerator: IGenerator<MockInput, MockTargetNode> = {
                async generate() {
                    throw new Error('Generation failed');
                }
            };

            const engine = new CodeGenerationEngine({
                generator: failingGenerator,
                formatter,
                emitter,
                writer,
                config: { verbose: false }
            });

            const input: MockInput = { data: 'Test Input' };

            await expect(engine.execute(input)).rejects.toThrow('Generation stage failed');
        });

        it('should throw PipelineError on formatting failure', async () => {
            const failingFormatter: IFormatter<MockTargetNode> = {
                async format() {
                    throw new Error('Formatting failed');
                }
            };

            const engine = new CodeGenerationEngine({
                generator,
                formatter: failingFormatter,
                emitter,
                writer,
                config: { verbose: false }
            });

            const input: MockInput = { data: 'Test Input' };

            await expect(engine.execute(input)).rejects.toThrow('Formatting stage failed');
        });

        it('should throw PipelineError on emission failure', async () => {
            const failingEmitter: IEmitter<MockTargetNode> = {
                async emit() {
                    throw new Error('Emission failed');
                }
            };

            const engine = new CodeGenerationEngine({
                generator,
                formatter,
                emitter: failingEmitter,
                writer,
                config: { verbose: false }
            });

            const input: MockInput = { data: 'Test Input' };

            await expect(engine.execute(input)).rejects.toThrow('Emission stage failed');
        });

        it('should throw PipelineError on writing failure', async () => {
            const failingWriter = {
                async write(_artifact: GeneratedArtifact): Promise<void> {
                    throw new Error('Write failed');
                },
                async writeAll(_artifacts: readonly GeneratedArtifact[]): Promise<void> {
                    throw new Error('Write all failed');
                }
            };

            const engine = new CodeGenerationEngine({
                generator,
                formatter,
                emitter,
                writer: failingWriter,
                config: { verbose: false }
            });

            const input: MockInput = { data: 'Test Input' };

            await expect(engine.execute(input)).rejects.toThrow('Writing stage failed');
        });
    });

    describe('PipelineBuilder', () => {
        it('should build engine with fluent API', async () => {
            const engine = PipelineBuilder.create<MockInput, MockTargetNode>()
                .withGenerator(generator)
                .withFormatter(formatter)
                .withEmitter(emitter)
                .withWriter(writer)
                .withVerbose(false)
                .build();

            const input: MockInput = { data: 'Builder Test' };
            const result = await engine.execute(input);

            expect(result.artifacts).toHaveLength(1);
        });

        it('should throw error when generator missing', () => {
            expect(() => {
                PipelineBuilder.create<MockInput, MockTargetNode>()
                    .withFormatter(formatter)
                    .withEmitter(emitter)
                    .withWriter(writer)
                    .build();
            }).toThrow('Generator is required');
        });

        it('should throw error when formatter missing', () => {
            expect(() => {
                PipelineBuilder.create<MockInput, MockTargetNode>()
                    .withGenerator(generator)
                    .withEmitter(emitter)
                    .withWriter(writer)
                    .build();
            }).toThrow('Formatter is required');
        });

        it('should throw error when emitter missing', () => {
            expect(() => {
                PipelineBuilder.create<MockInput, MockTargetNode>()
                    .withGenerator(generator)
                    .withFormatter(formatter)
                    .withWriter(writer)
                    .build();
            }).toThrow('Emitter is required');
        });

        it('should throw error when writer missing', () => {
            expect(() => {
                PipelineBuilder.create<MockInput, MockTargetNode>()
                    .withGenerator(generator)
                    .withFormatter(formatter)
                    .withEmitter(emitter)
                    .build();
            }).toThrow('Writer is required');
        });

        it('should merge custom config with defaults', async () => {
            const engine = PipelineBuilder.create<MockInput, MockTargetNode>()
                .withGenerator(generator)
                .withFormatter(formatter)
                .withEmitter(emitter)
                .withWriter(writer)
                .withConfig({
                    stages: { formatting: false },
                    profiling: true
                })
                .build();

            const input: MockInput = { data: 'Config Test' };
            const result = await engine.execute(input);

            // Formatting should be skipped
            expect(result.metrics.stages.formattingMs).toBe(0);
        });
    });
});
