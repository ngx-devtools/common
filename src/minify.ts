import { readFileAsync } from './file';

const terser = require('terser');

/**
 * This will minify string
 * @param content - string to minify or uglify
 * @param options - uglifyjs options
 * @return -  and return { code, map }
 */
async function minifyContent(content: string, options?: any) {
  return Promise.resolve(terser.minify(content, options || {}));
}

/**
 * Minify or uglify from a file.
 * @param file    - source file to minify
 * @param options - uglifyjs options
 * @return -  and return { code, map }
 */
async function minify(file: string, options?: any) {
  return readFileAsync(file, 'utf8').then(content => {
    return minifyContent(content, options);
  })
}

export { minifyContent, minify, terser }



