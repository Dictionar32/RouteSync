import fs from 'fs-extra';
import path from 'path';
import type { DeclaredResponseAttributeAst } from '../../lexer/controllerAstTypes';
import type { ResponseDescriptor, ResourceFieldDescriptor } from '../../../../types/route';
import { InlineResponseDescriptor } from '../../../../types/route';
import { readResponseDtoAnalysis } from './responseDtoReader';

export interface ResponseAttributeResolution {
  readonly descriptor: ResponseDescriptor;
  readonly trace: readonly ResponseTraceEntry[];
}

export interface ResponseTraceEntry {
  readonly stage: string;
  readonly rule: string;
  readonly input: string;
  readonly output: string;
}

export function resolveResponseAttributeAst(attribute: DeclaredResponseAttributeAst, projectRoot: string): ResponseDescriptor {
  const className = attribute.className;
  const classFile = resolveClassFile(projectRoot, className);
  const analysis = readResponseDtoAnalysis(classFile);
  const fields = analysis.fields;
  const trace: ResponseTraceEntry[] = [
    { stage: 'attribute', rule: 'Explicit Response attribute', input: className, output: `response: ${className}` }
  ];
  trace.push({ stage: 'identity', rule: 'Response class resolved from controller attribute', input: className, output: classFile });
  trace.push({ stage: 'shape', rule: 'Typed public properties extracted from response class', input: classFile, output: `${fields.length} fields` });
  return new InlineResponseDescriptor({
    domain: className,
    baseName: className,
    typeName: className,
    fields,
    shape: attribute.collection ? 'collection' : 'single',
    origin: { kind: 'attribute', className, sourceFile: classFile, trace },
    semanticContract: {
      kind: 'object',
      name: className,
      shape: attribute.collection ? 'collection' : 'single',
      fields: analysis.contractFields
    }
  });
}

function resolveClassFile(projectRoot: string, className: string): string {
  const relative = className.replace(/^App\\/, '').replace(/\\/g, '/');
  const file = path.join(projectRoot, 'app', `${relative}.php`);
  if (!fs.existsSync(file)) {
    throw new Error(`Response boundary violation: ${className} resolved from attribute but source file was not found: ${file}`);
  }
  return file;
}

