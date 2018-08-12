import { basename, join } from 'path';

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

interface NgRollupConfigOptions {
  tmpSrc: string;
  dest: string;
  format: string;
  minify?: boolean;
  options: NgRollupOptions;
}

function createNgRollupConfig(configs: NgRollupConfigOptions) {
  const { format, dest, options, tmpSrc, minify } = configs;

  const folder = basename(tmpSrc); 

  const inputFile = (!(format.includes('umd'))) 
    ? join('.tmp', folder, format, `${folder}.js`) 
    : join('.tmp', folder, 'esm5', `${folder}.js`)

  const fileName = (minify && minify === true) ? `${folder}.umd.min.js` : `${folder}.umd.js`;

  const file = (!(format.includes('umd'))) 
    ? inputFile.replace('.tmp', dest)
    : join(dest, folder, 'bundles', fileName);

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
}

export { NgRollupConfigOptions, NgRollupInputOptions, NgRollupOutputOptions, NgRollupOptions, createNgRollupConfig }