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
    results.push(value);
  }
  const filePath =  path.resolve(path.join(destFolder, destFileName));
  await writeFileAsync(filePath, strip(results.join('\n')));
};

module.exports = concatAsync;