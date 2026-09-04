import fs from 'fs-extra'
import path from 'path'
import { RouteManifest, ParsedModel, camelCase, PrimitiveKind, DatabaseColumnKind, DATABASE_COLUMN_KIND_REGISTRY, matchRelation } from '@routesync/core'

export class ModelGenerator {
  static async generate(manifest: RouteManifest, outputDir: string): Promise<void> {
    if (!manifest.models || manifest.models.length === 0) return

    const coreDir = path.join(outputDir, 'core')
    await fs.ensureDir(coreDir)

    const lines: string[] = []
    lines.push(`// Auto-generated TypeScript Eloquent Models. Do not edit manually.`)
    lines.push(``)

    for (const model of manifest.models) {
      const interfaceName = model.shortName
      lines.push(`export interface ${interfaceName} {`)

      const hidden = Array.isArray(model.hidden) ? model.hidden : []

      // 1. Database Columns (SSOT: propertyName & semanticType)
      for (const col of model.columns) {
        const rawName = col.propertyName || col.name
        if (!rawName) continue
        const isHidden = col.name ? hidden.includes(col.name) : false
        const isOptional = isHidden ? '?' : ''
        const propName = col.propertyName || camelCase(rawName)

        let tsType = 'string'
        if (col.enumValues && col.enumValues.length > 0) {
          tsType = col.enumValues.map(v => `'${v}'`).join(' | ')
        } else if (col.semanticType) {
          tsType = col.semanticType === PrimitiveKind.NUMBER ? 'number'
            : col.semanticType === PrimitiveKind.BOOLEAN ? 'boolean'
            : 'string'
        } else {
          tsType = this.mapColumnKindToTs(col.columnKind)
        }

        const nullable = col.nullable ? ' | null' : ''
        lines.push(`  ${propName}${isOptional}: ${tsType}${nullable}`)
      }

      // 2. Appended Accessor Attributes (SSOT: accessors)
      if (model.accessors && model.accessors.length > 0) {
        for (const acc of model.accessors) {
          const rawName = acc.propertyName || acc.name
          if (!rawName) continue
          const propName = acc.propertyName || camelCase(rawName)
          const tsType = acc.semanticType === PrimitiveKind.NUMBER ? 'number'
            : acc.semanticType === PrimitiveKind.BOOLEAN ? 'boolean'
            : 'string'
          const nullable = acc.nullable ? ' | null' : ''
          lines.push(`  ${propName}?: ${tsType}${nullable}`)
        }
      } else {
        const appends = Array.isArray(model.appends) ? model.appends : []
        for (const append of appends) {
          if (!append) continue
          lines.push(`  ${camelCase(append)}?: unknown`)
        }
      }

      // 3. Eloquent Relations (SSOT: relations)
      if (model.relations && model.relations.length > 0) {
        for (const rel of model.relations) {
          const relType = matchRelation(rel, {
            one: (r) => r.modelName,
            many: (r) => `${r.modelName}[]`
          })
          lines.push(`  ${rel.name}?: ${relType}`)
        }
      }

      lines.push(`}`)
      lines.push(``)
    }

    await fs.writeFile(path.join(coreDir, 'models.ts'), lines.join('\n'))
  }

  private static mapColumnKindToTs(kind: DatabaseColumnKind): string {
    return DATABASE_COLUMN_KIND_REGISTRY[kind]?.tsType ?? 'unknown'
  }
}
