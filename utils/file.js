const fs = require('fs');
const path = require('path');

const promisify = require('util').promisify;
const unlinkAsync = promisify(fs.unlink);

const { walkSync } = require('./walk-dir');

const getDir = (src) => {
  return (Array.isArray(src) ? src : [ src ])
    .map(file => {
      return { 
        dir: path.dirname(file).replace('/**', ''),
        isRecursive: file.includes('**'),
        includes: [ path.extname(file) ]
      };
    })
};

const getSource = (file) => file.replace(/\/$/, '').replace(path.resolve() + '/', '').split('/')[0];

const deleteFileAsync = (file) => (fs.existsSync(file)) ? unlinkAsync(file) : Promise.resolve();

const getFiles = src => 
  getDir(src).map(directory => walkSync({ 
    dir: directory.dir, 
    isRecursive: directory.isRecursive, 
    includes: directory.includes 
  }));

exports.deleteFileAsync = deleteFileAsync;
exports.getFiles = getFiles;
exports.getSource = getSource;
exports.readFileAsync = promisify(fs.readFile);
exports.writeFileAsync = promisify(fs.writeFile);
exports.readdirAsync = promisify(fs.readdir);