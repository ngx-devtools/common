import { resolve, join, isAbsolute, relative } from 'path';
import { existsSync } from 'fs';

import { readFileAsync, writeFileAsync } from './file';
import { isProcess } from './check-args';
import { buildSass } from './inline-sources';
import { PassThrough } from 'stream';

const trumpet = require('trumpet');

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
  const devtoolsPath = join(process.env.APP_ROOT_PATH, '.devtools.json');
  const DEVTOOLS_CONFIG = existsSync(devtoolsPath) ? require(devtoolsPath): {};
  const title = DEVTOOLS_CONFIG['title'];
  return Promise.resolve(content.replace('<!-- title -->', title ? title : 'NGX AppSeed Application'));
}

async function inlineLinkStyle(content: string) {
  const tr = trumpet();
  const streamContent = (content: string) => {
    const passThrough = new PassThrough();
    passThrough.write(content);
    passThrough.end();
    return passThrough;
  }
  tr.selectAll('link[href]', async function (node) {
    function urlResolver(p) {
      return (isAbsolute(p)) 
        ? resolve(process.env.APP_ROOT_PATH, relative('/', p))
        : resolve(process.env.APP_ROOT_PATH, p);
    }
    const href = node.getAttribute('href').toLowerCase();
    const w = node.createWriteStream({ outer: true });
    const filePath = urlResolver(join('src', href));
    const contents = await readFileAsync(filePath, 'utf8').then(content => {
      return buildSass(content, filePath)
        .replace(/([\n\r]\s*)+/gm," ")
        .replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\//gm, '')
    });
    w.write('<style>' + contents + '</style>');
    w.end();
  });
  return new Promise((resolve, reject) => {
    const stream = streamContent(content).pipe(tr), chunks = [];
    stream.on('data', chunk => chunks.push(chunk.toString()));
    stream.on('end', () => resolve(chunks.join('')))
    stream.on('error', reject);
  });
}

async function injectHtml(html): Promise<void> {
  return readFileAsync(html, 'utf8')
    .then(content => isProcess(liveReloadParams) ? injectLivereload(content) : Promise.resolve(content))
    .then(content => injectShims(content))
    .then(content => injectSystemjsScript(content))
    .then(content => injectTitle(content))
    .then(content => inlineLinkStyle(content))
    .then(content => writeFileAsync(html, content))
};

export { injectLivereload, injectShims, injectSystemjsScript, injectTitle, injectHtml, trumpet, inlineLinkStyle }