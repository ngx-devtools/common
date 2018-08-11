import { resolve, join, dirname, basename, extname, sep } from 'path';

import { readFileAsync, writeFileAsync, mkdirp, copyFileAsync, globFiles, clean } from './file';
import { minifyContent } from './minify';
import { rollup } from 'rollup';
import { depsResolve, typescript, multiEntry } from './rollup-plugins';

if (!(process.env.APP_ROOT_PATH)) {
  process.env.APP_ROOT_PATH = resolve();
}

interface RollupOutputOptions {
  file?: string;
  format?: string;
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
  plugins?: any[];
  output: RollupOutputOptions;
}

interface NgRollupInputOptions {
  treeshake?: boolean;
  external?: string[];
  onwarn(warning: any): void;
}

interface NgRollupOutputOptions {
  sourcemap?: boolean;
  exports?: string;
  globals?: any;
}

interface NgRollupOptions {
  inputOptions?: NgRollupInputOptions;
  outputOptions?: NgRollupOutputOptions;
}

interface PkgOptions {
  module?: string;
  esm2015?: string;
  typings?: string;
  main?: string;
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
  'rollup-plugin-multi-entry',
  'rollup-plugin-commonjs',
  'stream'
];

function rollupExternals(options: RollupOptions) {
  return (options.external && Array.isArray(options.external))
    ? [].concat(options.external.filter(value => defaultExternals.find(external => external !== value)))
        .concat(defaultExternals)
    : defaultExternals;
}

function rollupPluginUglify(userOptions?: any){
  const options = Object.assign({ sourceMap: true }, userOptions);
  return {
    name: "uglify",
    transformBundle: async (code) => {
      const result = await minifyContent(code, options);
      if (result.error) {
        throw result.error;
      }
      return result;
    }
  };
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

  const plugins = [ 
    multiEntry(), 
    typescript({ ...tsOptions }), 
    depsResolve() 
  ];

  if (options.plugins) {
    options.plugins
      .filter(plugin => [ 'rpt2', 'node-resolve' ].find(value => plugin.name !== value))
      .forEach(value => plugins.push(value));
  }  

  return {
    inputOptions: {
      input: options.input,
      treeshake: true,
      plugins: plugins,
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

function createNgRollupConfig(tmpSrc: string, dest: string, options?: NgRollupOptions) {
  const formats = [ 'esm2015', 'esm5', 'umd' ];

  const folder = basename(tmpSrc);

  return formats.map(format => {
    const inputFile = (!(format.includes('umd'))) 
      ? join('.tmp', folder, format, `${folder}.js`) 
      : join('.tmp', folder, 'esm5', `${folder}.js`)

    const file = (!(format.includes('umd'))) 
      ? inputFile.replace('.tmp', dest)
      : join(dest, folder, 'bundles', `${folder}.umd.js`);

    const formatType = (format.includes('umd') ? 'umd' : 'es');

    return {
      inputOptions: {
        input: inputFile,
        ...options.inputOptions
      },
      outputOptions: {
        name: folder, 
        file: file, 
        format: formatType,
        ...options.outputOptions
      }
    }
  })
}

async function rollupBuild({ inputOptions, outputOptions }): Promise<any> {
  return rollup(inputOptions).then(bundle => bundle.write(outputOptions));
}

async function rollupGenerate({ inputOptions, outputOptions }): Promise<any> {
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

async function buildCopyPackageFile(name: string, pkgOptions?: PkgOptions) {
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
        ...{ main: `${name}.js` },
        ...pkgOptions
      };
      return writeFileAsync(destPath, JSON.stringify(pkg, null, 2));
    });
}

async function copyReadMe(file?: string){
  const pathFile = (file) ? resolve(file): join(process.env.APP_ROOT_PATH, 'README.md');
  return copyFileAsync(pathFile, join(process.env.APP_ROOT_PATH, 'dist', basename(pathFile)));
}

async function ngxBuild(pkgName: string, rollupConfig: any) {
  const ENTRY_FILE = `.tmp/${pkgName}.ts`;

  const files = await globFiles('src/**/*.*');

  const filter = file => extname(file) === '.ts';
  const map = file => `export * from '${file.replace(join(resolve(), sep, 'src', sep), './').replace('.ts', '')}';`;
  const sourceFiles = files.filter(filter).map(map).join('\n');

  await Promise.all([ clean('.tmp'), clean('dist') ]);

  await mkdirp('.tmp');

  await Promise.all([
    Promise.all(files.map(file => {
      const destPath = file.replace('src', '.tmp');
      return copyFileAsync(file, destPath);
    })),
    writeFileAsync(ENTRY_FILE, sourceFiles),
    buildCopyPackageFile(pkgName)
  ])

  await rollupBuild(rollupConfig);
}

export { 
  buildCopyPackageFile, 
  copyReadMe, 
  rollupBuild, 
  RollupOptions, 
  RollupOutputOptions, 
  createRollupConfig, 
  rollupGenerate, 
  PkgOptions, 
  rollupPluginUglify,
  ngxBuild,
  NgRollupOptions,
  NgRollupOutputOptions,
  NgRollupInputOptions,
  createNgRollupConfig
} 