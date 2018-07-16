import { clean } from './src/file';
import { buildCopyPackageFile, rollupBuild, createRollupConfig } from './src/build-package';

const PKG_NAME = 'common';

Promise.all([ clean('dist') ]).then(() => {
  return Promise.all([ 
    buildCopyPackageFile(PKG_NAME),  
    rollupBuild(createRollupConfig({ input: `src/${PKG_NAME}.ts`, file: `dist/${PKG_NAME}.js`, format: 'cjs' }))
  ])
});