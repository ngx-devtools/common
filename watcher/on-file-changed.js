
const path = require('path');
const fs = require('fs');
const util = require('util');

const { reloadPage } = require('./live-reload');

const verifyFunction = (onChanged, file) => {
  return (onChanged && util.isFunction(onChanged)) ? onChanged(file) : Promise.resolve(file);
};

const onFileChanged = (options, filePaths) => {
  return (event, file) => { 
    const filePath = path.resolve(file);
    return (filePaths[filePath] && (filePaths[filePath] === fs.statSync(filePath).size)) 
      ? Promise.resolve()
      : (() => {
          Object.assign(filePaths, { [filePath]: fs.statSync(filePath).size });
          return Promise.all([ 
              verifyFunction(options.onClientFileChanged, file), 
              verifyFunction(options.onServerFileChanged, file) ])
            .then(() => reloadPage(file));
        })();
  };
}

module.exports = onFileChanged