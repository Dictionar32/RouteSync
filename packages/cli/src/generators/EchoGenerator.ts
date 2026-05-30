import fs from 'fs-extra'
import path from 'path'
import { ParsedChannel } from '@routesync/core'
import { toIdentifier, toTypeName } from './names'

export class EchoGenerator {
  static async generate(channels: ParsedChannel[], outputDir: string): Promise<void> {
    if (channels.length === 0) return

    const lines: string[] = []

    lines.push(`// Auto-generated Laravel Echo Hooks. Do not edit manually.`)
    lines.push(`import { useEffect } from 'react'`)
    lines.push(`import Echo from 'laravel-echo'`)
    lines.push(``)
    lines.push(`// Ensure you have configured window.Echo somewhere in your app`)
    lines.push(``)

    for (const channel of channels) {
      // channel.name could be 'order.{id}'
      // We want to generate 'useListenOrder'
      const nameParts = channel.name.replace(/\\{[^}]+\\}/g, '').split('.').filter(Boolean)
      const hookName = 'useListen' + toTypeName(nameParts.join(' ')) + 'Channel'
      
      // Extract parameters from path, e.g. 'order.{id}' -> 'id: string | number'
      const params = [...channel.name.matchAll(/\\{([^}]+)\\}/g)].map(m => m[1])
      const paramArgs = params.length > 0 
        ? params.map(p => p + ': string | number').join(', ') + ', ' 
        : ''
      
      const runtimeChannelName = channel.name.replace(/\\{([^}]+)\\}/g, '${$1}')

      lines.push('export function ' + hookName + '(' + paramArgs + 'eventName: string, callback: (event: any) => void) {')
      lines.push(`  useEffect(() => {`)
      lines.push(`    if (typeof window === 'undefined' || !(window as any).Echo) return`)
      lines.push(`    `)
      lines.push(`    const echo: Echo = (window as any).Echo`)
      
      const channelMethod = channel.isPrivate ? 'private' : 'channel'
      lines.push('    const channelInstance = echo.' + channelMethod + '(`' + runtimeChannelName + '`)')
      lines.push(`    channelInstance.listen(eventName, callback)`)
      lines.push(`    `)
      lines.push(`    return () => {`)
      lines.push(`      channelInstance.stopListening(eventName, callback)`)
      lines.push(`      // Optionally echo.leave(...)`)
      lines.push(`    }`)
      
      // Add dependencies array for useEffect
      const deps = params.join(', ')
      const allDeps = deps ? '[' + deps + ', eventName, callback]' : '[eventName, callback]'
      
      lines.push('  }, ' + allDeps + ')')
      lines.push(`}`)
      lines.push(``)
    }

    await fs.writeFile(path.join(outputDir, 'echo.ts'), lines.join('\n'))
  }
}
