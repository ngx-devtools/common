import { readFileAsync } from './file';

const terser = require('terser');

async function minifyContent(content: string, options: any) {
  return Promise.resolve(terser.minify(content, options));
}

async function minify(file: string, options: any) {
  return readFileAsync(file, 'utf8').then(content => {
    return minifyContent(content, options);
  })
}

export { minifyContent, minify, terser }



