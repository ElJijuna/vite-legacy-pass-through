import type { Plugin } from 'vite'

/**
 * Options for the {@link legacyPassThrough} plugin.
 */
export interface LegacyPassThroughOptions {
  /**
   * List of library names to mark as external.
   *
   * Each entry must match the package name exactly as it appears in import
   * statements. Only subpath imports (`lib/...`) are matched — bare imports
   * (`lib` without a subpath) are left untouched.
   *
   * Empty strings are silently ignored. At least one valid entry is required.
   *
   * @example
   * ```ts
   * libs: ['lib-legacy', 'another-old-lib']
   * ```
   */
  libs: string[]

  /**
   * List of file extensions to exclude from pass-through.
   *
   * Imports whose path ends with any of these extensions are ignored by the
   * plugin and left for Vite to handle normally (e.g. CSS, assets).
   *
   * Extensions must include the leading dot.
   *
   * @defaultValue `['.css', '.scss', '.sass', '.less', '.styl', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2', '.ttf', '.eot', '.json', '.html']`
   *
   * @example
   * ```ts
   * excludeExtensions: ['.css', '.svg']
   * ```
   */
  excludeExtensions?: string[]

  /**
   * Controls when the plugin is applied.
   *
   * - `'build'` — only during `vite build` (default). Prevents the plugin from
   *   interfering with dev tools that use Vite's dev server, such as Storybook.
   * - `'serve'` — only during `vite dev` / `vite preview`.
   *
   * @defaultValue `'build'`
   */
  apply?: 'build' | 'serve'

  /**
   * When `true`, logs each resolved import path to the console.
   *
   * Useful during development to verify which imports are being bypassed.
   *
   * @defaultValue `false`
   *
   * @example
   * ```
   * [vite-legacy-pass-through] Resolving: lib-legacy/components/Button
   * [vite-legacy-pass-through] Resolving: lib-legacy/utils/format
   * ```
   */
  showLog?: boolean
}

/**
 * Vite plugin that marks legacy libraries as external, preventing Rolldown
 * from bundling them and causing CommonJS interop errors at runtime.
 *
 * The plugin hooks into both the `options` phase (to register externals with
 * Rolldown natively, covering transitive imports inside node_modules) and the
 * `resolveId` phase with `enforce: 'pre'` (to catch any remaining direct
 * imports that bypass the options-level check). Rolldown then skips those
 * imports entirely, leaving them as bare import statements in the output.
 *
 * @remarks
 * Rolldown does **not** recommend marking packages as external in library
 * builds. Doing so shifts the module resolution responsibility to the consumer.
 * Use this plugin only when the legacy library is guaranteed to be available
 * in the target environment.
 *
 * @param options - Plugin configuration options.
 * @returns A Vite {@link Plugin} instance.
 * @throws {Error} If `libs` is empty or contains only empty strings.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite'
 * import { legacyPassThrough } from 'vite-legacy-pass-through'
 *
 * export default defineConfig({
 *   plugins: [
 *     legacyPassThrough({
 *       libs: ['lib-legacy'],
 *       showLog: true,
 *     }),
 *   ],
 * })
 * ```
 */
export const DEFAULT_EXCLUDE_EXTENSIONS = new Set([
  '.css', '.scss', '.sass', '.less', '.styl',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
  '.woff', '.woff2', '.ttf', '.eot',
  '.json', '.html',
])

export function legacyPassThrough({ libs, excludeExtensions, apply = 'build', showLog }: LegacyPassThroughOptions = { libs: [] }): Plugin {
  const validLibs = libs.filter(lib => lib.trim() !== '')

  if (!validLibs.length) {
    throw new Error('The "libs" option must be a non-empty array for the legacyPassThrough plugin.')
  }

  const prefixes = validLibs.map(lib => `${lib}/`)
  const skipExtensions = excludeExtensions ? new Set(excludeExtensions) : DEFAULT_EXCLUDE_EXTENSIONS

  function isPassThrough(id: string): boolean {
    const dotIndex = id.lastIndexOf('.')
    if (dotIndex !== -1 && skipExtensions.has(id.slice(dotIndex))) return false
    return prefixes.some(prefix => id.startsWith(prefix))
  }

  return {
    name: 'vite-legacy-pass-through',
    enforce: 'pre',
    apply,
    /**
     * Register externals at the Rolldown options level so that transitive
     * imports inside node_modules are also intercepted — Rolldown's native
     * resolver may bypass `resolveId` plugin hooks for deps-of-deps.
     */
    options(rollupOptions) {
      const existingExternal = rollupOptions.external
      return {
        external(id: string, parentId: string | undefined, isResolved: boolean): boolean {
          if (!isResolved && isPassThrough(id)) {
            if (showLog) {
              console.log(`[vite-legacy-pass-through] Resolving: ${id}`)
            }
            return true
          }
          if (!existingExternal) return false
          if (typeof existingExternal === 'function') {
            return !!(existingExternal as (id: string, importer: string | undefined, isResolved: boolean) => boolean | null | void)(id, parentId, isResolved)
          }
          const exts = Array.isArray(existingExternal) ? existingExternal : [existingExternal]
          return exts.some((ext: string | RegExp) =>
            typeof ext === 'string' ? id === ext : (ext as RegExp).test(id)
          )
        },
      }
    },
    /**
     * Fallback resolveId hook for imports that reach the plugin pipeline
     * directly (e.g. not intercepted by the options-level external check).
     * Logging is handled in `options` to avoid double-logging.
     */
    resolveId(source: string) {
      if (isPassThrough(source)) {
        return { id: source, external: true }
      }
      return null
    },
  }
}

export default legacyPassThrough
