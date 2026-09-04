import { describe, it, expect } from 'vitest'
import {
  ScannedModelDescriptor,
  ScannedRouteDescriptor,
  RouteParameterType,
  PrimitiveKind,
  BroadcastChannelKind
} from '@routesync/core'
import { ModelGenerator } from '../../cli/src/generators/ModelGenerator'
import { EchoGenerator } from '../../cli/src/generators/EchoGenerator'
import { MswGenerator } from '../../cli/src/generators/MswGenerator'

describe('Eloquent & Generator Audited Explicit SSOT', () => {
  it('1. ScannedRouteDescriptor should parse Laravel custom route model binding {post:slug}', () => {
    const route = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/posts/{post:slug}',
      resourceName: 'PostResource',
      actionName: 'show',
      actionKind: 'read',
      isMutating: false
    })

    expect(route.pathParameters.length).toBe(1)
    const param = route.pathParameters[0]
    expect(param.name).toBe('post')
    expect(param.propertyName).toBe('post')
    expect(param.bindingField).toBe('slug')
    expect(param.type).toBe(RouteParameterType.String)
  })

  it('2. ScannedModelDescriptor should detect softDeletes and timestamps from columns', () => {
    const model = ScannedModelDescriptor.create({
      name: 'App\\Models\\User',
      shortName: 'User',
      columns: [
        { name: 'id', propertyName: 'id', type: 'bigint', semanticType: PrimitiveKind.NUMBER, nullable: false, columnKind: 'integer' },
        { name: 'created_at', propertyName: 'createdAt', type: 'datetime', semanticType: PrimitiveKind.DATETIME, nullable: false, columnKind: 'datetime' },
        { name: 'updated_at', propertyName: 'updatedAt', type: 'datetime', semanticType: PrimitiveKind.DATETIME, nullable: false, columnKind: 'datetime' },
        { name: 'deleted_at', propertyName: 'deletedAt', type: 'datetime', semanticType: PrimitiveKind.DATETIME, nullable: true, columnKind: 'datetime' }
      ]
    })

    expect(model.softDeletes).toBe(true)
    expect(model.timestamps).toBe(true)
    expect(model.shortName).toBe('User')
  })

  it('3. ModelGenerator should emit shortName, typed accessors, and typed relations', async () => {
    const manifest: any = {
      models: [
        {
          name: 'App\\Models\\Order',
          shortName: 'Order',
          columns: [
            { name: 'id', propertyName: 'id', type: 'bigint', semanticType: PrimitiveKind.NUMBER, nullable: false },
            { name: 'total_minor', propertyName: 'totalMinor', type: 'int', semanticType: PrimitiveKind.NUMBER, nullable: false }
          ],
          accessors: [
            { name: 'formatted_total', propertyName: 'formattedTotal', semanticType: PrimitiveKind.STRING, nullable: false }
          ],
          relations: [
            { name: 'items', modelName: 'OrderItem', isCollection: true, type: 'hasMany' }
          ]
        }
      ]
    }

    let writtenContent = ''
    const originalWriteFile = (await import('fs-extra')).default.writeFile
    ;(await import('fs-extra')).default.writeFile = (async (_path: any, data: any) => {
      writtenContent = data.toString()
    }) as any

    try {
      await ModelGenerator.generate(manifest, '/tmp')
      expect(writtenContent).toContain('export interface Order {')
      expect(writtenContent).not.toContain('export interface App\\Models\\Order')
      expect(writtenContent).toContain('id: number')
      expect(writtenContent).toContain('totalMinor: number')
      expect(writtenContent).toContain('formattedTotal?: string')
      expect(writtenContent).toContain('items?: OrderItem[]')
    } finally {
      ;(await import('fs-extra')).default.writeFile = originalWriteFile
    }
  })

  it('4. EchoGenerator should emit join() for presence channels and typed parameter signatures', async () => {
    const channels: any[] = [
      {
        name: 'room.{roomId}',
        kind: BroadcastChannelKind.Presence,
        isPresence: true,
        isPrivate: false,
        parameters: [
          { name: 'roomId', propertyName: 'roomId', type: 'number', required: true }
        ]
      }
    ]

    let writtenContent = ''
    const originalWriteFile = (await import('fs-extra')).default.writeFile
    ;(await import('fs-extra')).default.writeFile = (async (_path: any, data: any) => {
      writtenContent = data.toString()
    }) as any

    try {
      await EchoGenerator.generate(channels, '/tmp')
      expect(writtenContent).toContain('roomId: number')
      expect(writtenContent).toContain('echo.join(`room.${roomId}`)')
    } finally {
      ;(await import('fs-extra')).default.writeFile = originalWriteFile
    }
  })

  it('5. MswGenerator should consume route.runtimePath without regex replacement', async () => {
    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: [
        {
          method: 'GET',
          path: '/posts/{post}',
          runtimePath: '/posts/:post',
          name: 'posts.show',
          response: { readTypeName: 'PostResourceTransformed', shape: 'single' }
        }
      ]
    }

    let writtenContent = ''
    const originalWriteFile = (await import('fs-extra')).default.writeFile
    ;(await import('fs-extra')).default.writeFile = (async (_path: any, data: any) => {
      writtenContent = data.toString()
    }) as any

    try {
      await MswGenerator.generate(manifest, '/tmp')
      expect(writtenContent).toContain("http.get('http://localhost/api/posts/:post'")
    } finally {
      ;(await import('fs-extra')).default.writeFile = originalWriteFile
    }
  })
})
