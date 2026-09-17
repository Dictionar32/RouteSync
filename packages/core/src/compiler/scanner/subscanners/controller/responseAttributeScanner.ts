import fs from 'fs-extra';
import path from 'path';
import type { DeclaredResponseAttributeAst } from '../../lexer/controllerAstTypes';
import type { ResponseDescriptor, ResourceFieldDescriptor } from '../../../../types/route';
import { InlineResponseDescriptor } from '../../../../types/route';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
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
  const trace = [
    { kind: 'class_resolution' as const, className: SemanticValueFactory.className(className), sourceFile: SemanticValueFactory.sourceFilePath(classFile) },
    { kind: 'property_extraction' as const, propertyCount: fields.length },
    { kind: 'semantic_resolution' as const, resolvedCount: analysis.contractFields.length }
  ];
  const responseTypeName = SemanticValueFactory.responseTypeName(className);
  return new InlineResponseDescriptor({
    domain: SemanticValueFactory.domainName(className),
    baseName: SemanticValueFactory.resourceName(className),
    typeName: responseTypeName,
    fields,
    shape: attribute.collection ? 'collection' : 'single',
    origin: { kind: 'attribute', className: SemanticValueFactory.className(className), sourceFile: SemanticValueFactory.sourceFilePath(classFile), trace },
    semanticContract: {
      kind: 'object',
      name: responseTypeName,
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

