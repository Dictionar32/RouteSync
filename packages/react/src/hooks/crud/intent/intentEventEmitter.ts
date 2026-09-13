/**
 * intentEventEmitter.ts
 *
 * Micro event emitter hook for aggregate collection intent lifecycle hooks.
 *
 * @module react/hooks/crud/intent
 */

import { useRef, useCallback } from 'react'

export interface IntentEventEmitter {
  readonly on: (event: string, cb: (...args: unknown[]) => void) => () => void
  readonly emit: (event: string, ...args: unknown[]) => void
}

export function useIntentEventEmitter(): IntentEventEmitter {
  const listenersRef = useRef(new Map<string, Array<(...args: unknown[]) => void>>())

  const on = useCallback((event: string, cb: (...args: unknown[]) => void) => {
    const listeners = listenersRef.current
    if (!listeners.has(event)) listeners.set(event, [])
    listeners.get(event)!.push(cb)
    return () => {
      const list = listeners.get(event)
      if (list) {
        const idx = list.indexOf(cb)
        if (idx !== -1) list.splice(idx, 1)
      }
    }
  }, [])

  const emit = useCallback((event: string, ...args: unknown[]) => {
    const list = listenersRef.current.get(event)
    if (list) {
      list.forEach(cb => {
        try { cb(...args) } catch (e) {}
      })
    }
  }, [])

  return { on, emit }
}
