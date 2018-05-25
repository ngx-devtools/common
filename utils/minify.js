
const uglify = require('uglify-es');
const { readFileAsync } = require('./file');

const minify = (file) => {
  return readFileAsync(file, 'utf8')
    .then(content => Promise.resolve(uglify.minify(content)))
};

module.exports = minify;