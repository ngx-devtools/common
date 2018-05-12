const fs = require('fs');
const path = require('path');
const strip = require('strip-comments');

const { readFileAsync, writeFileAsync } = require('./file');
const mkdirp = require('./mkdirp');

const concatAsync = async (src = [], destFolder, destFileName) => {
  const results = [];
  mkdirp(path.resolve(destFolder));
  for (const file of src) {
    const value = await readFileAsync(file, 'utf8');
    results.push(strip(value));
  }
  const filePath =  path.resolve(path.join(destFolder, destFileName));
  await writeFileAsync(filePath, results.join('\n'));
};

const concat = (src = [], dest) => {
  mkdirp(path.dirname(dest));
  return Promise.all(src.map(async file => {
    const value = await readFileAsync(file, 'utf8');
    return Promise.resolve(strip(value).replace(/\n/g, ''))
  }))
  .then(values => {
    let result = '';
    values.forEach(value => result = result + value);
    return writeFileAsync(dest, result); 
  })
};

exports.concatAsync = concatAsync;
exports.concat = concat;