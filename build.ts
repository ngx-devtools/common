import { join, resolve, dirname } from 'path';

import { rollup, OutputChunk  } from 'rollup';
import { clean, writeFileAsync, mkdirp, readFileAsync } from './src/file';

const depsResolve = require('rollup-plugin-node-resolve');
const typescript = require('rollup-plugin-typescript2');

function createRollupConfig (formats: string[]) {
  return formats.map(format => {
    return {
      inputOptions: {
        input: 'src/common.ts',
        treeshake: true,
        plugins: [
          typescript({
            tsconfig: 'src/tsconfig.json',
            check: false,
            cacheRoot: join(resolve(), 'node_modules/.tmp/.rts2_cache'), 
            useTsconfigDeclarationDir: false
          }),
          depsResolve()
        ],
        external: [ 'fs', 'util', 'path', 'tslib', 'node-sass', 'terser', 'livereload', 'chokidar' ],
        onwarn (warning) {
          if (warning.code === 'THIS_IS_UNDEFINED') { return; }
          console.log("Rollup warning: ", warning.message);
        }
      },
      outputOptions: {
        sourcemap: false,
        file: 'dist/common.js',
        format: 'cjs'
      }
    }
  });
}

async function rollupBuild({ inputOptions, outputOptions }): Promise<OutputChunk> {
  return rollup(inputOptions).then(bundle => bundle.write(outputOptions));
}

async function copyPkgFile() {
  const pkgFilePath = resolve('package.json');
  return readFileAsync(pkgFilePath, 'utf8')
    .then(contents => {
      const destPath = resolve('dist/package.json');
      mkdirp(dirname(destPath));
      const pkgContent = JSON.parse(contents);
      delete(pkgContent.scripts);
      delete(pkgContent.devDependencies);
      const pkg = { 
        ...pkgContent,  
        ...{ module: `./esm2015/common.js` },
        ...{ esm2015: `./esm2015/common.js` },
        ...{ typings: 'common.d.ts' },
        ...{ main: 'common.js' }
      };
      return writeFileAsync(destPath, JSON.stringify(pkg, null, 2));
    });
}

Promise.all([ clean('dist') ]).then(() => {
  const formats = [ 'esm2015' ]
  return Promise.all([ copyPkgFile(), Promise.all(createRollupConfig(formats).map(config => rollupBuild(config)))])
});