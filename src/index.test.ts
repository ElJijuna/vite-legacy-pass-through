import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { legacyPassThrough, DEFAULT_EXCLUDE_EXTENSIONS } from './index'
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
      expect(resolveId.call({} as never, 'my-lib/utils', undefined, opts)).toEqual({ id: 'my-lib/utils', external: true })
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

  describe('apply', () => {
    it('defaults to build', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'] })
      expect(plugin.apply).toBe('build')
    })

    it('accepts serve', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'], apply: 'serve' })
      expect(plugin.apply).toBe('serve')
    })

    it('accepts build explicitly', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'], apply: 'build' })
      expect(plugin.apply).toBe('build')
    })
  })

  describe('resolveId', () => {
    it('marks a matching lib as external', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'] })
      const resolveId = getResolveId(plugin)
      const result = resolveId.call({} as never, 'my-lib/utils', undefined, opts)
      expect(result).toEqual({ id: 'my-lib/utils', external: true })
    })

    it('marks deep paths as external', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'] })
      const resolveId = getResolveId(plugin)
      const result = resolveId.call({} as never, 'my-lib/components/Button', undefined, opts)
      expect(result).toEqual({ id: 'my-lib/components/Button', external: true })
    })

    it('returns null for non-matching sources', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'] })
      const resolveId = getResolveId(plugin)
      const result = resolveId.call({} as never, 'other-lib/utils', undefined, opts)
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
      const result = resolveId.call({} as never, 'my-lib-extra/utils', undefined, opts)
      expect(result).toBeNull()
    })

    it('handles multiple libs', () => {
      const plugin = legacyPassThrough({ libs: ['lib-a', 'lib-b', 'lib-c'] })
      const resolveId = getResolveId(plugin)
      expect(resolveId.call({} as never, 'lib-a/index', undefined, opts)).toEqual({ id: 'lib-a/index', external: true })
      expect(resolveId.call({} as never, 'lib-b/utils', undefined, opts)).toEqual({ id: 'lib-b/utils', external: true })
      expect(resolveId.call({} as never, 'lib-c/foo/bar', undefined, opts)).toEqual({ id: 'lib-c/foo/bar', external: true })
      expect(resolveId.call({} as never, 'lib-d/index', undefined, opts)).toBeNull()
    })
  })

  describe('excludeExtensions', () => {
    it('skips CSS imports by default', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'] })
      const resolveId = getResolveId(plugin)
      expect(resolveId.call({} as never, 'my-lib/styles/button.css', undefined, opts)).toBeNull()
    })

    it('skips all DEFAULT_EXCLUDE_EXTENSIONS entries', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'] })
      const resolveId = getResolveId(plugin)
      for (const ext of DEFAULT_EXCLUDE_EXTENSIONS) {
        expect(resolveId.call({} as never, `my-lib/assets/file${ext}`, undefined, opts)).toBeNull()
      }
    })

    it('uses custom excludeExtensions instead of default', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'], excludeExtensions: ['.css'] })
      const resolveId = getResolveId(plugin)
      expect(resolveId.call({} as never, 'my-lib/styles/button.css', undefined, opts)).toBeNull()
      // .svg is in the default but not in custom list — should now be external
      expect(resolveId.call({} as never, 'my-lib/assets/icon.svg', undefined, opts)).toEqual({ id: 'my-lib/assets/icon.svg', external: true })
    })

    it('marks matching import as external when extension is not excluded', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'], excludeExtensions: [] })
      const resolveId = getResolveId(plugin)
      expect(resolveId.call({} as never, 'my-lib/styles/button.css', undefined, opts)).toEqual({ id: 'my-lib/styles/button.css', external: true })
    })

    it('does not skip excluded extension from a non-matching lib', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'] })
      const resolveId = getResolveId(plugin)
      // other-lib is not in libs, but extension check fires first — still null
      expect(resolveId.call({} as never, 'other-lib/styles/button.css', undefined, opts)).toBeNull()
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
      resolveId.call({} as never, 'my-lib/utils', undefined, opts)
      expect(console.log).toHaveBeenCalledWith(
        '[vite-legacy-pass-through] Resolving: my-lib/utils'
      )
    })

    it('does not log when showLog is false', () => {
      const plugin = legacyPassThrough({ libs: ['my-lib'], showLog: false })
      const resolveId = getResolveId(plugin)
      resolveId.call({} as never, 'my-lib/utils', undefined, opts)
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
