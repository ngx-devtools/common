const livereload = require('gulp-livereload');

const liveReloadParams = [ '--livereload',  '--livereload=true',  '--livereload true'  ];

const { isProcess  } = require('../utils/check-args');

const reloadPage = (file) => {
  if (isProcess(liveReloadParams)) livereload.changed(file);
  return Promise.resolve();
};

const liveReload = () => {
  const injectLiveReload = require('../utils/inject-livereload');
  const injectReload = () => injectLiveReload().then(() => {
    livereload.listen();
    return Promise.resolve();
  });
  return isProcess(liveReloadParams) ? injectReload() : Promise.resolve();
};

exports.reloadPage = reloadPage;
exports.liveReload = liveReload;