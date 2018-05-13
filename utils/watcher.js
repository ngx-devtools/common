const chokidar = require('chokidar');
const livereload = require('gulp-livereload');
const util = require('util');
const fs = require('fs');
const path = require('path');

const liveReloadParams = [ '--livereload',  '--livereload=true',  '--livereload true'  ];
const watchParams = [ '--watch', '--watch=true', '--watch true' ];

const { isProcess } = require('./check-args');

const WATCH_EVENT = {
  ADD: 'add', CHANGE: 'change', DELETE: 'unlink', READY: 'ready'
};

const reloadPage = (file) => {
  if (isProcess(liveReloadParams)) livereload.changed(file);
  return Promise.resolve();
};

const liveReload = () => {
  const injectLiveReload = require('./inject-livereload');
  const injectReload = () => injectLiveReload().then(() => {
    livereload.listen();
    return Promise.resolve();
  });
  return isProcess(liveReloadParams) ? injectReload() : Promise.resolve();
};

const verifyFunction = (onChanged, file) => {
  return (onChanged && util.isFunction(onChanged)) ? onChanged(file) : Promise.resolve(file);
};

const watcher = ({ files, ignore, onClientFileChanged, onServerFileChanged }) => {
  let isReady = false, filePaths = [];
  const defaultIgnores = [
    'node_modules/**', 
    'node_modules/.tmp/**',
    'dist/**', 
    '.git/**', 
    '.DS_Store', 
    '.gitignore', 
    'README.md', 
    '.tmp/**', 
    'temp/**',
    '.rpt2_cache/**'
  ];

  if (ignore & Array.isArray(ignore)) {
    ignore.forEach(value => {
      if (!(defaultIgnores.includes(value))) {
        defaultIgnores.push(value);
      }
    });
  }

  const getFiles = (directories) => {
    const result = {};
    Object.keys(directories).forEach(directory => {
      const values = directories[directory].filter(value => {
        const file = path.join(directory, value);
        return (fs.statSync(file).isFile());
      });
      values.forEach(value => { 
        const filePath = path.join(directory, value);
        Object.assign(result, { [filePath]: fs.statSync(filePath).size });
      });
    });
    return result;
  };

  const onFileChanged = async (event, file) => { 
    const filePath = path.resolve(file);

    if (filePaths[filePath] && (filePaths[filePath] === fs.statSync(filePath).size)) {
      await Promise.resolve();
    } else {
      Object.assign(filePaths, { [filePath]: fs.statSync(filePath).size });
      await Promise.all([ verifyFunction(onClientFileChanged, file), verifyFunction(onServerFileChanged, file) ])
        .then(() => reloadPage(file))
        .catch(error => console.log(error)); 
    }
  };
   
  const watch = chokidar.watch(files || '.', { ignored: defaultIgnores })
    .on(WATCH_EVENT.READY, () => {
      filePaths = getFiles(watch.getWatched());
      isReady = true;
      console.log('> Initial scan complete. Ready for changes.'); 
    })
    .on('all', (event, path) => {
      if (isReady){
        switch(event) {
          case WATCH_EVENT.ADD:
          case WATCH_EVENT.CHANGE: 
            onFileChanged(event, path); break;
          case WATCH_EVENT.DELETE:
            console.log(`> ${event}: ${path}.`); break;
        }
      } 
    });
};

module.exports = (options) => {
  return (isProcess(watchParams)) ? Promise.all([ liveReload(), watcher(options) ]) : Promise.resolve();
};