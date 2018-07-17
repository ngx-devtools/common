import { clean } from './src/file';
import { buildCopyPackageFile, rollupBuild, createRollupConfig } from './src/build-package';

const PKG_NAME = 'common';

const rollupConfig = createRollupConfig({
  input: `src/${PKG_NAME}.ts`,
  tsconfig: 'src/tsconfig.json',
  output: {
    file: `dist/${PKG_NAME}.js`,
    format: 'cjs'
  }
})

Promise.all([ clean('dist') ]).then(() => {
  return Promise.all([ buildCopyPackageFile(PKG_NAME), rollupBuild(rollupConfig) ])
});