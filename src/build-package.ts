import { resolve, join, dirname } from 'path';

import { readFileAsync, writeFileAsync, mkdirp } from './file';
import { rollup, OutputChunk } from 'rollup';

const depsResolve = require('rollup-plugin-node-resolve');
const typescript = require('rollup-plugin-typescript2');

if (!(process.env.APP_ROOT_PATH)) {
  process.env.APP_ROOT_PATH = resolve();
}

interface RollupOptions {
  input: string;
  file: string;
  tsconfig?: string;
  format: string;
  external?: string[];
  plugins?: string[];
}

const defaultExternals: string[] = [ 
  'fs', 
  'util', 
  'path', 
  'tslib', 
  'node-sass', 
  'terser', 
  'livereload', 
  'chokidar', 
  'rollup', 
  'rollup-plugin-node-resolve',
  'rollup-plugin-typescript2'
];

function rollupExternals(options: RollupOptions): string[] {
  return (options.external && Array.isArray(options.external))
    ? [].concat(options.external.filter(value => defaultExternals.find(external => external !== value)))
        .concat(defaultExternals)
    : defaultExternals;
}

function createRollupConfig(options: RollupOptions) {
  return {
    inputOptions: {
      input: options.input,
      treeshake: true,
      plugins: options.plugins || [
        typescript({
          tsconfig: options.tsconfig || 'src/tsconfig.json',
          check: false,
          cacheRoot: join(process.env.APP_ROOT_PATH, 'node_modules/.tmp/.rts2_cache'), 
          useTsconfigDeclarationDir: false
        }),
        depsResolve()
      ],
      external: rollupExternals(options),
      onwarn (warning) {
        if (warning.code === 'THIS_IS_UNDEFINED') { return; }
        console.log("Rollup warning: ", warning.message);
      }
    },
    outputOptions: {
      sourcemap: false,
      file: options.file,
      format: options.format
    }
  }
}

async function rollupBuild({ inputOptions, outputOptions }): Promise<OutputChunk> {
  return rollup(inputOptions).then(bundle => bundle.write(outputOptions));
}

async function buildCopyPackageFile(name: string) {
  const pkgFilePath = join(process.env.APP_ROOT_PATH, 'package.json');
  return readFileAsync(pkgFilePath, 'utf8')
    .then(contents => {
      const destPath = join(process.env.APP_ROOT_PATH, 'dist', 'package.json');
      mkdirp(dirname(destPath));
      const pkgContent = JSON.parse(contents);
      delete(pkgContent.scripts);
      delete(pkgContent.devDependencies);
      const pkg = { 
        ...pkgContent,  
        ...{ module: `./esm2015/${name}.js` },
        ...{ esm2015: `./esm2015/${name}.js` },
        ...{ typings: `${name}.d.ts` },
        ...{ main: `${name}.js` }
      };
      return writeFileAsync(destPath, JSON.stringify(pkg, null, 2));
    });
}

export { buildCopyPackageFile, rollupBuild, RollupOptions, createRollupConfig } 