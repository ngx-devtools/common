import { readFileSync } from 'fs';
import { join, dirname, resolve, sep } from 'path';
import { globFiles, readFileAsync, mkdirp, writeFileAsync } from './file';
import * as sass from 'node-sass';

if (!(process.env.APP_ROOT_PATH)) {
  process.env.APP_ROOT_PATH = resolve();
}

const uglifycss = require('uglifycss');

function stripSpaces(value: string) {
  return uglifycss.processString(value).replace(/@custom-media/g, (match, i) => ' ' + match + ' ');
}

function buildSass(content: string, srcFile: string): string {
  return srcFile.endsWith('.scss') 
    ? sass.renderSync({ data: content, file: srcFile, outputStyle: 'compressed' }).css.toString() 
    : content;
}

function getStyleContent(styleUrl: string, urlResolver: Function): string {
  const styleFile = urlResolver(styleUrl);
  const originContent = readFileSync(styleFile, 'utf8');
  const styleContent = buildSass(originContent, styleFile);
  return stripSpaces(styleContent);
}

function inlineStyle(content: string, urlResolver: Function): string {
  return content.replace(/styleUrls\s*:\s*(\[[\s\S]*?\])/gm, function(m, styleUrls) {
    const urls = JSON.parse(JSON.stringify(styleUrls).replace(/"/g, "").replace(/'/g, '"'))
    return 'styles: ['
    + urls.map(styleUrl => '`' + getStyleContent(styleUrl, urlResolver) + '`')
        .join(',\n')
        .replace('\n', ' ')
    + ']';
  })
}

function inlineHtmlTemplate(content: string, urlResolver: Function): string {
  return content.replace(/templateUrl:\s*'([^']+?\.html)'/g, function (m, templateUrl) {
    const templateFile = urlResolver(templateUrl);
    const shortenedTemplate = readFileSync(templateFile, 'utf8').replace(/([\n\r]\s*)+/g, ' ').replace(/"/g, '\\"');
    return 'template: ' + '`' + `${shortenedTemplate}` + '`';
  });
}

const inlineCustomElementsStyle = (content, urlResolver) => {
  return content.replace(/styleUrl\s*:\s*'([^']+?\.*css)'/g,  (m, styleUrl) => {
    return m.replace('styleUrl', 'style').replace(styleUrl, getStyleContent(styleUrl, urlResolver))
  });
};

const inlineResourcesFromString = (content, urlResolver) => {
  return [ inlineHtmlTemplate, inlineStyle, inlineCustomElementsStyle ].reduce((content, fn) => fn(content, urlResolver), content);
}

function getDestPath(file: string, dest: string): string {
  const srcRootDir = file.replace(process.env.APP_ROOT_PATH + sep, '').split(sep)[0];
  return file.replace(srcRootDir, dest);
}

async function inlineResource(file: string, dest: string): Promise<string> {
  return readFileAsync(file, 'utf8')
    .then(content => inlineResourcesFromString(content, url => join(dirname(file), url)))
    .then(content => {
      mkdirp(dirname(dest));
      return writeFileAsync(dest, content).then(() => {
        return Promise.resolve(dest);
      })
    })
}

async function inlineSources(src: string | string[], dest: string) {
  return globFiles(src).then(files => {
    return Promise.all(files.map(file => {
      return inlineResource(file, getDestPath(file, dest))
    })) 
  })
}

export { inlineSources, inlineHtmlTemplate, buildSass, getStyleContent, inlineStyle, inlineResource, inlineResourcesFromString, stripSpaces  } 