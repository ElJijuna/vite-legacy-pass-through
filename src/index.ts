import type { Plugin } from 'vite';

/**
 * Options for the {@link legacyPassThrough} plugin.
 */
export interface LegacyPassThroughOptions {
  /**
   * List of library names to mark as external.
   *
   * Each entry must match the package name exactly as it appears in import
   * statements. Subpath imports (`lib/...`) are always matched. Bare imports
   * (`lib` without a subpath) require {@link matchBareImports}.
   *
   * Whitespace is trimmed and empty entries are ignored. At least one valid
   * entry is required.
   *
   * @example
   * ```ts
   * libs: ['lib-legacy', 'another-old-lib']
   * ```
   */
  libs: string[];

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
  excludeExtensions?: string[];

  /**
   * Also mark an exact, bare library import as external.
   *
   * @defaultValue `false`
   */
  matchBareImports?: boolean;

  /**
   * Controls when the plugin is applied.
   *
   * - `'build'` — only during `vite build` (default). Prevents the plugin from
   *   interfering with dev tools that use Vite's dev server, such as Storybook.
   * - `'serve'` — only during `vite dev` / `vite preview`.
   *
   * @defaultValue `'build'`
   */
  apply?: 'build' | 'serve';

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
  showLog?: boolean;
}

/**
 * Vite plugin that marks legacy libraries as external, preventing Rolldown
 * from bundling them and causing CommonJS interop errors at runtime.
 *
 * The plugin hooks into the `resolveId` phase with `enforce: 'pre'` and marks
 * any import whose path starts with `<lib>/` as external. Rolldown then skips
 * those imports entirely, leaving them as bare import statements in the output.
 *
 * @remarks
 * Rolldown does **not** recommend marking packages as external in library
 * builds. Doing so shifts the module resolution responsibility to the consumer.
 * Use this plugin only when the legacy library is guaranteed to be available
 * in the target environment.
 *
 * @param options - Plugin configuration options.
 * @returns A Vite {@link Plugin} instance.
 * @throws {TypeError} If an option has an invalid runtime value.
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
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.styl',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.json',
  '.html',
]);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

export function legacyPassThrough(
  {
    libs = [],
    excludeExtensions,
    apply = 'build',
    matchBareImports = false,
    showLog,
  }: LegacyPassThroughOptions = { libs: [] },
): Plugin {
  if (!isStringArray(libs)) {
    throw new TypeError('The "libs" option must be an array of strings.');
  }

  if (
    excludeExtensions !== undefined &&
    (!isStringArray(excludeExtensions) ||
      excludeExtensions.some((extension) => !extension.trim().startsWith('.')))
  ) {
    throw new TypeError('The "excludeExtensions" option must be an array of extensions.');
  }

  if (apply !== 'build' && apply !== 'serve') {
    throw new TypeError('The "apply" option must be "build" or "serve".');
  }

  if (typeof matchBareImports !== 'boolean') {
    throw new TypeError('The "matchBareImports" option must be a boolean.');
  }

  if (showLog !== undefined && typeof showLog !== 'boolean') {
    throw new TypeError('The "showLog" option must be a boolean.');
  }

  const validLibs = libs.map((lib) => lib.trim()).filter((lib) => lib.length > 0);

  if (!validLibs.length) {
    throw new Error(
      'The "libs" option must be a non-empty array for the legacyPassThrough plugin.',
    );
  }

  const prefixes = validLibs.map((lib) => `${lib}/`);
  const bareLibraries = new Set(validLibs);
  const skipExtensions = excludeExtensions
    ? new Set(excludeExtensions.map((extension) => extension.trim().toLowerCase()))
    : DEFAULT_EXCLUDE_EXTENSIONS;

  return {
    name: 'vite-legacy-pass-through',
    enforce: 'pre',
    apply,
    resolveId(source) {
      const [sourcePath] = source.split(/[?#]/, 1);
      const dotIndex = sourcePath.lastIndexOf('.');

      if (dotIndex !== -1 && skipExtensions.has(sourcePath.slice(dotIndex).toLowerCase())) {
        return null;
      }

      if (
        prefixes.some((prefix) => source.startsWith(prefix)) ||
        (matchBareImports && bareLibraries.has(sourcePath))
      ) {
        if (showLog) {
          console.log(`[vite-legacy-pass-through] Resolving: ${source}`);
        }

        return { id: source, external: true };
      }

      return null;
    },
  };
}

export default legacyPassThrough;
