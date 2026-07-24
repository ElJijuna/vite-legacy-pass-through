import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'vite';
import { afterEach, describe, expect, it } from 'vitest';
import { legacyPassThrough } from './index';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('legacyPassThrough Vite integration', () => {
  it('keeps configured subpath imports external in a Vite library build', async () => {
    const root = await mkdtemp(join(tmpdir(), 'vite-legacy-pass-through-'));

    temporaryDirectories.push(root);

    const sourceDirectory = join(root, 'src');

    await mkdir(sourceDirectory);
    await writeFile(
      join(sourceDirectory, 'index.ts'),
      "export { Button } from 'legacy-library/components/Button';\n",
    );

    await build({
      root,
      logLevel: 'silent',
      plugins: [legacyPassThrough({ libs: ['legacy-library'] })],
      build: {
        lib: {
          entry: join(sourceDirectory, 'index.ts'),
          fileName: 'library',
          formats: ['es'],
        },
        outDir: join(root, 'dist'),
      },
    });

    const output = await readFile(join(root, 'dist', 'library.mjs'), 'utf8');

    expect(output).toContain('from "legacy-library/components/Button"');
  });
});
