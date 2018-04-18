const fs = require('fs');
const path = require('path');

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

const getFiles = src => 
  getDir(src).map(directory => walkSync({ 
    dir: directory.dir, 
    isRecursive: directory.isRecursive, 
    includes: directory.includes 
  }));

exports.getFiles = getFiles;