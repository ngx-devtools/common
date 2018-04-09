const chokidar = require('chokidar');
const livereload = require('gulp-livereload');
const util = require('util');

const liveReloadParams = [ '--livereload',  '--livereload=true',  '--livereload true'  ];
const watchParams = [ '--watch', '--watch=true', '--watch true' ];

const isProcess = (list) => {
  let result = false;
  const index = process.argv.findIndex(value => list.includes(value));
  const isBoolean = (process.argv[index + 1] === 'true' || process.argv[index + 1] === 'false');
  if (index >= 0) {
    if (isBoolean || process.argv[index + 1] !== 'false') result = true;
  }
  return result;
};

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
  let isReady = false;
  const defaultIgnores = ['node_modules', 'dist', '.git'];

  if (ignore & Array.isArray(ignore)) {
    ignore.forEach(value => {
      if (!(defaultIgnores.includes(value))) {
        defaultIgnores.push(value);
      }
    });
  }
   
  chokidar.watch(files || '.', { ignored: defaultIgnores })
    .on(WATCH_EVENT.READY, () => {
      isReady = true;
      console.log('> Initial scan complete. Ready for changes.'); 
    })
    .on('all', (event, path) => {
      if (isReady){
        switch(event) {
          case WATCH_EVENT.ADD:
          case WATCH_EVENT.CHANGE: 
            Promise.all([ verifyFunction(onClientFileChanged, path), verifyFunction(onServerFileChanged, path) ])
              .then(() => reloadPage(path))
              .catch(error => console.log(error)); 
          break;
          case WATCH_EVENT.DELETE:
            console.log(`> ${event}: ${path}.`); break;
        }
      } 
    });
};

module.exports = (options) => {
  return (isProcess(watchParams)) ? Promise.all([ liveReload(), watcher(options) ]) : Promise.resolve();
};