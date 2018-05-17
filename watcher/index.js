const fs = require('fs');
const path = require('path');
const util = require('util');

const watchParams = [ '--watch', '--watch=true', '--watch true' ];

const chokidar = require('chokidar');
const defaultOptions = require('./default-options');
const getFiles = require('./get-files');

const { liveReload } = require('./live-reload');
const { isProcess } = require('../utils/check-args');

const WATCH_EVENT = require('./events');

const watcher = (options = defaultOptions) => {
  let isReady = false, filePaths = [], onFileChanged = null;

  const watch = chokidar.watch(options.files || 'src', { ignored: options.ignored })
    .on(WATCH_EVENT.READY, () => {
      isReady = true;
      onFileChanged = require('./on-file-changed')(options,  getFiles(watch.getWatched()));
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

const fileWatcher = (options = defaultOptions) => {
  return (isProcess(watchParams)) 
    ? Promise.all([ liveReload(), watcher(options) ]) 
    : Promise.resolve();
};

module.exports = fileWatcher;