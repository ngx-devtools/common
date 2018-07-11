
const terser = require('terser');
const { readFileAsync } = require('./file');

const minify = (file, options = {}) => {
  return readFileAsync(file, 'utf8').then(content => minifyContent(content, options));
};

const minifyContent = (content, options) => {
  return Promise.resolve(terser.minify(content, options));
};

exports.minifyContent = minifyContent;
exports.minify = minify;