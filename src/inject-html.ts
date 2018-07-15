import { resolve, join } from 'path';

import { readFileAsync, writeFileAsync } from './file';
import { isProcess } from './check-args';

if (!(process.env.APP_ROOT_PATH)) {
  process.env.APP_ROOT_PATH = resolve();
}

const liveReloadParams = [ '--livereload',  '--livereload=true',  '--livereload true'  ];

const SHIMS = '<!-- shims  -->';
const SYSTEMJS = '<!-- systemjs -->';
const LIVERELOAD = '<!-- livereload -->';
const TITLE = '<!-- title -->';

async function injectLivereload(content): Promise<string> {
  const defaults = {
    port: 35729,
    host: 'http://\' + (location.host || "localhost").split(":")[0] + \'',
    script: 'livereload.js',
    snipver: 1
  },
  template = opts => {
    const scriptSrc = opts.host + ':' + opts.port + '/' + opts.script + '?snipver=' + opts.snipver;
    return '\n<script>document.write(\'<script src="' + scriptSrc + '"></\' + \'script>\');</script>';
  };
  return Promise.resolve(content.replace(LIVERELOAD, template(defaults)));
}

async function injectShims(content): Promise<string> {
  return Promise.resolve(content.replace(SHIMS, '<script src="node_modules/.tmp/shims.min.js"></script>'));
}

async function injectSystemjsScript(content): Promise<string> {
  return readFileAsync(join(process.env.APP_ROOT_PATH, 'node_modules/.tmp/systemjs-script.min.js'), 'utf8')
    .then(fileContent => content.replace(SYSTEMJS, `<script>${fileContent}</script>`));
}

async function injectTitle(content): Promise<string> {
  const DEVTOOLS_CONFIG = require('./devtools')
  const title = DEVTOOLS_CONFIG['title'];
  return Promise.resolve(content.replace('<!-- title -->', title ? title : 'NGX AppSeed Application'));
}

async function injectHtml(html): Promise<void> {
  return readFileAsync(html, 'utf8')
    .then(content => isProcess(liveReloadParams) ? injectLivereload(content) : Promise.resolve(content))
    .then(content => injectShims(content))
    .then(content => injectSystemjsScript(content))
    .then(content => injectTitle(content))
    .then(content => writeFileAsync(html, content));
};

export { injectLivereload, injectShims, injectSystemjsScript, injectTitle, injectHtml }