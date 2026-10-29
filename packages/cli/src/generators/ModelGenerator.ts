import fs from 'fs-extra'
import path from 'path'
import {
  type RouteManifest,
  type ModelSemanticProperty,
  type ModelAst,
  typeExpressionToSemanticType,
} from '@routesync/core'

type SemanticPropertySequence<T> =
  | Readonly<{ readonly kind: 'empty' }>
  | Readonly<{ readonly kind: 'cons'; readonly head: T; readonly tail: SemanticPropertySequence<T> }>

type CanonicalSemanticType = ReturnType<typeof typeExpressionToSemanticType>

export interface ModelTypeScriptProjectionInterface {
  readonly project: (semanticType: CanonicalSemanticType) => string
}

const semanticTypeScriptProjection: ModelTypeScriptProjectionInterface = Object.freeze({
  project: (semanticType: CanonicalSemanticType): string => semanticType.accept({
    primitive: value => ({
      string: 'string',
      number: 'number',
      boolean: 'boolean',
      datetime: 'string',
      file: 'File',
      indeterminate: 'unknown',
      unspecified: 'unknown',
    }[value.type]),
    jsonValue: () => 'unknown',
    optional: value => `${semanticTypeScriptProjection.project(value.innerType)} | undefined`,
    nullable: value => `${semanticTypeScriptProjection.project(value.innerType)} | null`,
    never: () => 'never',
    error: () => 'unknown',
    reference: value => value.emittedName,
    union: value => value.members.map(semanticTypeScriptProjection.project).join(' | '),
    intersection: value => value.members.map(semanticTypeScriptProjection.project).join(' & '),
    readonlyCollection: value => `ReadonlyArray<${semanticTypeScriptProjection.project(value.elementType)}>`,
    mutableCollection: value => `Array<${semanticTypeScriptProjection.project(value.elementType)}>`,
    generic: value => `${value.base.emittedName}<${value.parameters.map(parameter => semanticTypeScriptProjection.project(parameter.type)).join(', ')}>`,
    object: value => `{ ${value.properties.map(property => `${property.name.value.value}: ${semanticTypeScriptProjection.project(property.type)}`).join('; ')} }`,
  }),
})

const sequenceToArray = <T>(sequence: SemanticPropertySequence<T>): readonly T[] => {
  const values: T[] = []
  let cursor: SemanticPropertySequence<T> = sequence
  while (cursor.kind === 'cons') {
    values.push(cursor.head)
    cursor = cursor.tail
  }
  return Object.freeze(values)
}

const semanticPropertyType = (property: ModelSemanticProperty): string =>
  semanticTypeScriptProjection.project(typeExpressionToSemanticType(property.traversal.semanticType))

const modelLines = (model: ModelAst): readonly string[] => {
  const properties = sequenceToArray(model.definition.semanticProperties)
  return [
    `export interface ${model.definition.identity.shortName.value.value} {`,
    ...properties.map(property => `  ${property.property.value.value}: ${semanticPropertyType(property)}`),
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
