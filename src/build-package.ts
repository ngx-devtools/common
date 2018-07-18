import { resolve, join, dirname, basename } from 'path';

import { readFileAsync, writeFileAsync, mkdirp } from './file';
import { rollup } from 'rollup';

const depsResolve = require('rollup-plugin-node-resolve');
const typescript = require('rollup-plugin-typescript2');
const multiEntry = require('rollup-plugin-multi-entry');

if (!(process.env.APP_ROOT_PATH)) {
  process.env.APP_ROOT_PATH = resolve();
}

interface RollupOutputOptions {
  file: string;
  format: string;
  name?: string;
  sourcemap?: boolean;
  globals?: any;
  exports?: string;
  dir?: string;
}

interface RollupOptions {
  input: string | string[];
  tsconfig?: string;
  external?: string[];
  overrideExternal?: boolean;
  plugins?: string[];
  output: RollupOutputOptions;
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
  'rollup-plugin-typescript2',
  'rollup-plugin-multi-entry'
];

function rollupExternals(options: RollupOptions) {
  return (options.external && Array.isArray(options.external))
    ? [].concat(options.external.filter(value => defaultExternals.find(external => external !== value)))
        .concat(defaultExternals)
    : defaultExternals;
}

function createRollupConfig(options: RollupOptions) {
  const tsOptions: any = {
    check: false,
    cacheRoot: join(process.env.APP_ROOT_PATH, 'node_modules/.tmp/.rts2_cache'), 
    useTsconfigDeclarationDir: false
  };

  if (options.tsconfig) {
    tsOptions.tsconfig = options.tsconfig
  }

  return {
    inputOptions: {
      input: options.input,
      treeshake: true,
      plugins: options.plugins || [
        multiEntry(),
        typescript({ ...tsOptions }),
        depsResolve()
      ],
      external: options.overrideExternal ? options.external: rollupExternals(options),
      onwarn (warning) {
        if (warning.code === 'THIS_IS_UNDEFINED') { return; }
        console.log("Rollup warning: ", warning.message);
      }
    },
    outputOptions: {
      sourcemap: options.output.sourcemap || false,
      ...options.output
    }
  }
}

async function rollupBuild({ inputOptions, outputOptions }): Promise<any> {
  return rollup(inputOptions).then(bundle => bundle.write(outputOptions));
}

async function rollBuildDev({ inputOptions, outputOptions }) {
  return rollup(inputOptions)
  .then(bundle => bundle.generate(outputOptions))
  .then(({ code, map }) => {
    mkdirp(dirname(outputOptions.file));
    return Promise.all([ 
      writeFileAsync(outputOptions.file, code + `\n//# sourceMappingURL=${basename(outputOptions.file)}.map`),
      writeFileAsync(outputOptions.file + '.map', map.toString())
    ])
  });
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

export { buildCopyPackageFile, rollupBuild, RollupOptions, RollupOutputOptions, createRollupConfig, rollBuildDev } 