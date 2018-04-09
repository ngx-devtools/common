const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

const promisify = require('util').promisify;

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const { walkSync } = require('./walk-dir');

const getDir = (src) => {
  const sourceFiles = (Array.isArray(src)) ? src : [ src ];
  return sourceFiles.map(file => {
    return { 
      dir: path.dirname(file).replace('/**', ''),
      isRecursive: file.includes('**'),
      includes: [ path.extname(file) ]
    };
  })
};

const getSource = (file) => {
  return file.replace(path.resolve() + '/', '').split('/')[0];
};

const copyFileAsync = (file, dest) => {
  const destPath = file.replace(getSource(file), dest);
  const dirBaseName = path.dirname(destPath);
  mkdirp.sync(dirBaseName);
  return readFileAsync(file)
    .then(fileBuffer => writeFileAsync(destPath, fileBuffer));
};

const copyFilesAsync = (files, dest) => {
  return Promise.all(files.map(file => copyFileAsync(file, dest)));
};

module.exports = (src = [], dest) => {
  const files = getDir(src).map(directory => walkSync({ 
    dir: directory.dir, 
    isRecursive: directory.isRecursive, 
    includes: directory.includes 
  }));
  return Promise.all(files.map(file => copyFilesAsync(file, dest)));
};