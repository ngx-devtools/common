import { createRollupConfig } from './src/build-package';

const PKG_NAME = 'common';

const getRollupConfig = (options = {}) => {
  const rollupOptions = {
    input: `.tmp/${PKG_NAME}.ts`,
    tsconfig: '.tmp/tsconfig.json',
    output: {
      file: `dist/${PKG_NAME}.js`,
      format: 'cjs'
    }
  }
  return createRollupConfig({ ...rollupOptions, ...options })
}

export { getRollupConfig }