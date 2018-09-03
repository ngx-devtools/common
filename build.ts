import { createRollupConfig, ngxBuild } from './src/build-package';

(async function(){
  const PKG_NAME = 'common';

  const rollupConfig = createRollupConfig({
    input: `.tmp/${PKG_NAME}.ts`,
    tsconfig: '.tmp/tsconfig.json',
    output: {
      file: `dist/${PKG_NAME}.js`,
      format: 'cjs'
    }
  });

  await ngxBuild(PKG_NAME, rollupConfig);
})();

