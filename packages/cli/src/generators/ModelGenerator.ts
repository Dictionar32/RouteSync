import fs from 'fs-extra'
import path from 'path'
import {
  type RouteManifest,
  SemanticTypeResolver,
  toTypeScriptTypeExpression,
  typeExpressionToSemanticType,
  type ModelSemanticProperty,
  type ModelAst,
} from '@routesync/core'

const resolver = SemanticTypeResolver.default()

const sequenceToArray = <T>(sequence: { readonly kind: 'empty' } | { readonly kind: 'cons'; readonly head: T; readonly tail: typeof sequence }, output: readonly T[] = []): readonly T[] =>
  sequence.kind === 'empty' ? output : sequenceToArray(sequence.tail, [...output, sequence.head])

const semanticPropertyType = (property: ModelSemanticProperty): string =>
  toTypeScriptTypeExpression(resolver.resolve(typeExpressionToSemanticType(property.semanticType)))

const semanticPropertyName = (property: ModelSemanticProperty): string => property.property.value.value

const modelLines = (model: ModelAst): readonly string[] => {
  const semantic = model.definition.semantic
  const properties = sequenceToArray(semantic.surface.properties)
  return [
    `export interface ${semantic.identity.shortName.value.value} {`,
    ...properties.map(property => `  ${semanticPropertyName(property)}: ${semanticPropertyType(property)}`),
    `}`,
    ``,
  ]
}

export class ModelGenerator {
  static async generate(manifest: RouteManifest, outputDir: string): Promise<void> {
    const coreDir = path.join(outputDir, 'core')
    await fs.ensureDir(coreDir)
    const lines = manifest.models.flatMap(modelLines)
    await fs.writeFile(path.join(coreDir, 'models.ts'), ['// Auto-generated TypeScript Eloquent Models. Do not edit manually.', '', ...lines].join('\n'))
  }
}
