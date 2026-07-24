import vitestConfig from 'super-configs/vitest';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(vitestConfig, {
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});
