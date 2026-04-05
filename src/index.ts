import type { Plugin } from 'vite'

export interface LegacyPassThroughOptions {
  libs: string[]
  showLog?: boolean
}

export function legacyPassThrough({ libs, showLog }: LegacyPassThroughOptions = { libs: [] }): Plugin {
  const validLibs = libs.filter(lib => lib.trim() !== '')

  if (!validLibs.length) {
    throw new Error('The "libs" option must be a non-empty array for the legacyPassThrough plugin.')
  }

  const prefixes = validLibs.map(lib => `${lib}/`)

  return {
    name: 'vite-legacy-pass-through',
    enforce: 'pre',
    resolveId(source) {
      if (prefixes.some(prefix => source.startsWith(prefix))) {
        if (showLog) {
          console.log(`[vite-legacy-pass-through] Resolving: ${source}`)
        }
        return { id: source, external: true }
      }
      return null
    },
  }
}

export default legacyPassThrough
