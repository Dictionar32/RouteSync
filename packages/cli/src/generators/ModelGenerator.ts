import fs from 'fs-extra'
import path from 'path'
import { RouteManifest, ParsedModel } from '@routesync/core'

export class ModelGenerator {
  static async generate(manifest: RouteManifest, outputDir: string): Promise<void> {
    if (!manifest.models || manifest.models.length === 0) return

    const coreDir = path.join(outputDir, 'core')
    await fs.ensureDir(coreDir)

    const lines: string[] = []
    lines.push(`/* eslint-disable */`)
    lines.push(`// Auto-generated. Do not edit.`)
    lines.push(``)

    for (const model of manifest.models) {
      lines.push(`export interface ${model.name} {`)
      
      const hidden = Array.isArray(model.hidden) ? model.hidden : []
      const casts = model.casts || {}
      
      // 1. Database Columns
      for (const col of model.columns) {
        // If it's hidden, we can make it optional or omit it. Usually omitted or optional.
        // Let's make it optional so frontend devs can still type it if they somehow fetch it.
        const isHidden = hidden.includes(col.name)
        const isOptional = isHidden ? '?' : ''
        
        // Use cast if available, else SQL type
        const castType = casts[col.name]
        let tsType = this.mapSqlTypeToTs(col.type)
        if (castType) {
          tsType = this.mapCastToTs(castType, tsType)
        }
        
        const nullable = col.nullable ? ' | null' : ''
        
        lines.push(`  ${col.name}${isOptional}: ${tsType}${nullable}`)
      }

      // 2. Appended Attributes
      const appends = Array.isArray(model.appends) ? model.appends : []
      for (const append of appends) {
        lines.push(`  ${append}: any // appended attribute`)
      }
      
      lines.push(`}`)
      lines.push(``)
    }

    await fs.writeFile(path.join(coreDir, 'models.ts'), lines.join('\n'))
  }

  private static mapSqlTypeToTs(sqlType: string): string {
    const type = sqlType.toLowerCase()
    
    if (type.includes('int') || type.includes('float') || type.includes('double') || type.includes('decimal') || type.includes('numeric')) {
      return 'number'
    }
    
    if (type.includes('bool') || type.includes('tinyint(1)')) {
      return 'boolean'
    }
    
    if (type.includes('json')) {
      return 'any'
    }
    
    // Parse MySQL enum: enum('admin','user')
    const enumMatch = type.match(/^enum\((.*)\)$/);
    if (enumMatch && enumMatch[1]) {
      // enumMatch[1] is "'admin','user'"
      // Split by comma, but be careful with spaces, although MySQL usually doesn't have spaces inside enum values unless specified
      const values = enumMatch[1].split(',').map(v => v.trim().replace(/^'|'$/g, ""));
      // map to union type string: 'admin' | 'user'
      return values.map(v => `'${v}'`).join(' | ');
    }
    
    return 'string'
  }

  private static mapCastToTs(castType: string, defaultType: string): string {
    const type = castType.toLowerCase()
    if (type.includes('int') || type.includes('float') || type.includes('decimal') || type.includes('double')) {
      return 'number'
    }
    if (type.includes('bool')) {
      return 'boolean'
    }
    if (type.includes('array') || type.includes('json') || type.includes('collection') || type.includes('object')) {
      return 'any'
    }
    if (type.includes('date') || type.includes('datetime') || type.includes('string')) {
      return 'string'
    }
    return defaultType
  }
}
