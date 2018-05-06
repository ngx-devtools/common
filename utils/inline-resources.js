const fs = require('fs');
const path = require('path');

const promisify = require('util').promisify;

const readFileAsync = promisify(fs.readFile);
const writeFileAsync  = promisify(fs.writeFile);

const { walkSync } = require('./walk-dir');
const { getFiles, getSource } = require('./file');
const { inlineStyle } = require('./inline-style');
const { isProcess } = require('./check-args');

const inlineTemplate = require('./inline-html-template');
const mkdirp = require('./mkdirp');

const prodModeParams = [ '--prod',  '--prod=true',  '--prod true'  ];

const inlineResourcesFromString = (content, urlResolver) => {
  const envMode = isProcess(prodModeParams);
  return [ 
    inlineTemplate(envMode), 
    inlineStyle(envMode) ]
  .reduce((content, fn) => fn(content, urlResolver), content);
};

const getTempPath = (file, pkgName) => {
  const tempSource = `.tmp\/${pkgName}\/src`;
  return file.replace(path.resolve() + path.sep, '') 
    .replace('src' + path.sep, '')
    .replace(pkgName, tempSource)
    .replace(argv.libs + path.sep, '')
    .replace(`app`, tempSource);
}


const copyFileAsync = (file, dest) => {
  const destPath = file.replace('src', dest);  
  return readFileAsync(file, 'utf8')
    .then(content => inlineResourcesFromString(content, url => path.join(path.dirname(file), url)))
    .then(content => {
      mkdirp(path.dirname(destPath))
      return writeFileAsync(destPath, content)
        .then(() => Promise.resolve(content))
    });
};

const copyFilesAsync = (files, dest) => Promise.all(files.map(file => copyFileAsync(file, dest)));

exports.copyFilesAsync = copyFilesAsync;
exports.copyFileAsync = copyFileAsync;
exports.inlineResourcesFromString = inlineResourcesFromString;

exports.inlineResources = (src, dest) => {
  const files = getFiles(src);
  return Promise.all(files.map(file => copyFilesAsync(file, dest)));
};
