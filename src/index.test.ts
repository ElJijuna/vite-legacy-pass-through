import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { legacyPassThrough } from './index'
import type { Plugin } from 'vite'

const opts = { isEntry: false }

function getResolveId(plugin: Plugin) {
  const hook = plugin.resolveId
  if (typeof hook === 'function') return hook
  if (hook && typeof hook === 'object' && 'handler' in hook) return hook.handler
  throw new Error('resolveId hook not found')
}

describe('legacyPassThrough', () => {
  describe('validation', () => {
    it('throws when libs is empty array', () => {
      expect(() => legacyPassThrough({ libs: [] })).toThrow(
        'The "libs" option must be a non-empty array'
      )
    })

    it('throws when called with default options', () => {
      expect(() => legacyPassThrough()).toThrow(
        'The "libs" option must be a non-empty array'
      )
    })

    it('throws when libs contains only empty strings', () => {
      expect(() => legacyPassThrough({ libs: ['', '', ''] })).toThrow(
        'The "libs" option must be a non-empty array'
      )
    })

    it('ignores empty strings and uses valid entries', () => {
      const plugin = legacyPassThrough({ libs: ['', 'my-lib', ''] })
      const resolveId = getResolveId(plugin)
      expect(resolveId.call({} as never, 'my-lib/utils.js', undefined, opts)).toEqual({ id: 'my-lib/utils.js', external: true })
    })
  })

  describe('plugin metadata', () => {
    it('has the correct name', () => {
      const plugin = legacyPassThrough({ libs: ['foo'] })
      expect(plugin.name).toBe('vite-legacy-pass-through')
    })

    it('enforces pre order', () => {
      const plugin = legacyPassThrough({ libs: ['foo'] })
      expect(plugin.enforce).toBe('pre')
    })
  })

  describe('resolveId', () => {
    it('marks a matching lib as external', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'] })
      const resolveId = getResolveId(plugin)
      const result = resolveId.call({} as never, 'my-lib/utils.js', undefined, opts)
      expect(result).toEqual({ id: 'my-lib/utils.js', external: true })
    })

    it('marks deep paths as external', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'] })
      const resolveId = getResolveId(plugin)
      const result = resolveId.call({} as never, 'my-lib/components/Button.js', undefined, opts)
      expect(result).toEqual({ id: 'my-lib/components/Button.js', external: true })
    })

    it('returns null for non-.js sources', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'] })
      const resolveId = getResolveId(plugin)
      expect(resolveId.call({} as never, 'my-lib/utils', undefined, opts)).toBeNull()
      expect(resolveId.call({} as never, 'my-lib/utils.ts', undefined, opts)).toBeNull()
    })

    it('returns null for non-matching sources', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'] })
      const resolveId = getResolveId(plugin)
      const result = resolveId.call({} as never, 'other-lib/utils.js', undefined, opts)
      expect(result).toBeNull()
    })

    it('does not match exact lib name without slash', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'] })
      const resolveId = getResolveId(plugin)
      const result = resolveId.call({} as never, 'my-lib', undefined, opts)
      expect(result).toBeNull()
    })

    it('does not match partial lib name prefix', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'] })
      const resolveId = getResolveId(plugin)
      const result = resolveId.call({} as never, 'my-lib-extra/utils.js', undefined, opts)
      expect(result).toBeNull()
    })

    it('handles multiple libs', () => {
      const plugin = legacyPassThrough({ libs: ['lib-a', 'lib-b', 'lib-c'] })
      const resolveId = getResolveId(plugin)
      expect(resolveId.call({} as never, 'lib-a/index.js', undefined, opts)).toEqual({ id: 'lib-a/index.js', external: true })
      expect(resolveId.call({} as never, 'lib-b/utils.js', undefined, opts)).toEqual({ id: 'lib-b/utils.js', external: true })
      expect(resolveId.call({} as never, 'lib-c/foo/bar.js', undefined, opts)).toEqual({ id: 'lib-c/foo/bar.js', external: true })
      expect(resolveId.call({} as never, 'lib-d/index.js', undefined, opts)).toBeNull()
    })
  })

  describe('showLog', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('logs when showLog is true and source matches', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'], showLog: true })
      const resolveId = getResolveId(plugin)
      resolveId.call({} as never, 'my-lib/utils.js', undefined, opts)
      expect(console.log).toHaveBeenCalledWith(
        '[vite-legacy-pass-through] Resolving: my-lib/utils.js'
      )
    })

    it('does not log when showLog is false', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'], showLog: false })
      const resolveId = getResolveId(plugin)
      resolveId.call({} as never, 'my-lib/utils.js', undefined, opts)
      expect(console.log).not.toHaveBeenCalled()
    })

    it('does not log when source does not match', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'], showLog: true })
      const resolveId = getResolveId(plugin)
      resolveId.call({} as never, 'other/utils', undefined, opts)
      expect(console.log).not.toHaveBeenCalled()
    })
  })
})
