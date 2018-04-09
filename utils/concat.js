const fs = require('fs');
const path = require('path');
const strip = require('strip-comments');

const promisify = require('util').promisify;

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const readWriteAsync = (filePath) => {
  return readFileAsync(filePath)
    .then(fileBuffer => Promise.resolve(fileBuffer.toString('utf8'))); 
};

const concatAsync = async (src = [], destFolder, destFileName) => {
  const results = [];
  require('mkdirp').sync(path.resolve(destFolder));
  for (const file of src) {
    const value = await readWriteAsync(file);
    results.push(value);
  }
  const filePath =  path.resolve(path.join(destFolder, destFileName));
  await writeFileAsync(filePath, strip(results.join('\n')));
};

module.exports = concatAsync;