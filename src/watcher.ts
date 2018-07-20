import chokidar from 'chokidar';

import { isFunction } from 'util';
import { resolve, join } from 'path';
import { statSync } from 'fs';

import { isProcess } from './check-args';
import { injectHtml } from './inject-html';
import { copyFileAsync } from './file';

const liveReloadParams = [ '--livereload',  '--livereload=true',  '--livereload true'  ];
const watchParams = [ '--watch', '--watch=true', '--watch true' ];

const livereload =  require('gulp-livereload');

if (!(process.env.APP_ROOT_PATH)) {
  process.env.APP_ROOT_PATH = resolve();
}

const HTML_PATH = join(process.env.APP_ROOT_PATH, 'dist', 'index.html');

enum WATCH_EVENT {
  ADD = 'add', 
  CHANGE = 'change', 
  DELETE = 'unlink', 
  READY = 'ready',
  ALL = 'all'
}

interface OnClientFileChanged {
  (file: string): Promise<void>
}

interface OnServerFileChanged {
  (file: string): Promise<void>
}

interface WatcherOptions {
  file?: string;
  ignore?: string[];
  onClientFileChanged?: OnClientFileChanged;
  onServerFileChanged?: OnServerFileChanged;
}

async function liveReload() {
  return injectHtml(HTML_PATH)
    .then(async () => {
      return isProcess(liveReloadParams) 
        ? await livereload.listen() 
        : Promise.resolve();
  })
}

async function reloadPage(file: string): Promise<void> {
  return (isProcess(liveReloadParams)) 
    ? await livereload.changed(file)
    : Promise.resolve();
}

async function copyLivereloadFile() {
  return  copyFileAsync(
    join(process.env.APP_ROOT_PATH, 'node_modules/.tmp/livereload.js'),
    join(process.env.APP_ROOT_PATH, 'dist/livereload.js')
  ); 
}

function getFiles(directories) {
  const result = {};
  Object.keys(directories).forEach(directory => {
    const values = directories[directory].filter(value => {
      const file = join(directory, value);
      return (statSync(file).isFile());
    });
    values.forEach(value => { 
      const filePath = join(directory, value);
      Object.assign(result, { [filePath]: statSync(filePath).size });
    });
  });
  return result;
}

function fileWatcher(options: WatcherOptions) {
  let isReady = false; 
  let onFileChanged = null;

  function _verifyFunction(onChanged, file){
    return (onChanged && isFunction(onChanged)) 
      ? onChanged(file) 
      : Promise.resolve(file);
  };

  async function _onFileChanged(options: WatcherOptions, filePaths: any) {
    return function(event: any, file: string) {
      const filePath = join(process.env.APP_ROOT_PATH, file);
      return (filePaths[filePath] && (filePaths[filePath] === statSync(filePath).size)) 
        ? Promise.resolve()
        : (function() {
            Object.assign(filePaths, { [filePath]: statSync(filePath).size });
            return Promise.all([ 
                _verifyFunction(options.onClientFileChanged, file), 
                _verifyFunction(options.onServerFileChanged, file) 
              ]).then(() => reloadPage(file));
          })();
    } 
  }

  const watch = chokidar.watch(options.file || 'src', { ignored: options.ignore })
    .on(WATCH_EVENT.READY, async function() {
      isReady = true;
      onFileChanged = await _onFileChanged(options, getFiles(watch.getWatched()));
      console.log('> Initial scan complete. Ready for changes.'); 
    })
    .on(WATCH_EVENT.ALL, async function(event: any, path: string) {
      if (isReady) {
        switch(event) {
          case WATCH_EVENT.ADD: 
          case WATCH_EVENT.CHANGE:
            await onFileChanged(event, path); break;
          case WATCH_EVENT.DELETE:
            console.log(`> ${event}: ${path}.`); break;
        }
      }
    })
} 

async function watcher(options: WatcherOptions) {
  return (isProcess(watchParams)) 
    ? Promise.all([ fileWatcher(options), liveReload(), copyLivereloadFile() ])
    : injectHtml(HTML_PATH)
}

export { WATCH_EVENT, OnClientFileChanged, OnServerFileChanged, WatcherOptions, watcher }