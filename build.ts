import { clean, globFiles } from './src/file';
import { buildCopyPackageFile, rollupBuild, createRollupConfig } from './src/build-package';

(async function(){
  const PKG_NAME = 'common';
  const files = await globFiles('src/**/*.ts');

  const rollupConfig = createRollupConfig({
    input: files,
    tsconfig: 'src/tsconfig.json',
    output: {
      file: `dist/${PKG_NAME}.js`,
      format: 'cjs'
    }
  });
  
  Promise.all([ clean('dist') ]).then(() => {
    return Promise.all([ buildCopyPackageFile(PKG_NAME), rollupBuild(rollupConfig) ])
  }); 
})();

