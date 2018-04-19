const fs = require('fs');
const path = require('path');
const sass = require('node-sass');
const mime = require('mime');

const promisify = require('util').promisify;

const readFileAsync = promisify(fs.readFile);
const writeFileAsync  = promisify(fs.writeFile);

const { walkSync } = require('./walk-dir');
const { getFiles } = require('./file');

const mkdirp = require('./mkdirp');

const getSource = (file) => {
  return file.replace(path.resolve() + '/', '').split('/')[0];
};

const buildSass = (content, sourceFile) => {
  try {
    return sourceFile.endsWith('.scss') ? 
      sass.renderSync({ data: content, file: sourceFile })
        .css.toString() : content;
  } catch (e) {
    console.error('\x1b[41m');
    console.error('at ' + sourceFile + ':' + e.line + ":" + e.column);
    console.error(e.formatted);
    console.error('\x1b[0m');
    return "";
  }
}

const inlineTemplate = (content, urlResolver) => {
  return content.replace(/templateUrl:\s*'([^']+?\.html)'/g, function (m, templateUrl) {
    const templateFile = urlResolver(templateUrl);
    const templateContent = fs.readFileSync(templateFile, 'utf8');
    const shortenedTemplate = templateContent
      .replace(/([\n\r]\s*)+/gm, ' ')
      .replace(/"/g, '\\"');
    return `template: "${shortenedTemplate}"`;
  });
};

const inlineImage = (styleFile) => {  
  return (inlineExpr, quotedPath) => {
    const imagesPath = path.dirname(styleFile);
    const imagePath = quotedPath.replace(/['"]/g, '');
    const pathDir = path.join(imagesPath, imagePath.substr(1, imagePath.length - 2));
    const fileData = fs.readFileSync(pathDir);
    const fileBase64 = new Buffer(fileData).toString('base64');
    const fileMime = mime.lookup(imagePath);
    return 'url(data:' + fileMime  + ';base64,' + fileBase64 + ')';
  }
};

const inlineStyle = (content, urlResolver) => {
  return content.replace(/styleUrls\s*:\s*(\[[\s\S]*?\])/gm, function (m, styleUrls) {
    const urls = eval(styleUrls);
    return 'styles: ['
      + urls.map(styleUrl => {
        const styleFile = urlResolver(styleUrl);
        const originContent = fs.readFileSync(styleFile, 'utf8');
        const styleContent = buildSass(originContent, styleFile);
        const shortenedStyle = styleContent
          .replace(/([\n\r]\s*)+/gm, ' ')
          .replace(/"/g, '\\"')
          .replace(/inline\(([^\)]+)\)/g, inlineImage(styleFile))
        return `"${shortenedStyle}"`;
      })
      .join(',\n')
      + ']';
  });
};

const inlineResourcesFromString = (content, urlResolver) => {
  return [ inlineTemplate, inlineStyle].reduce((content, fn) => fn(content, urlResolver), content);
};

const copyFileAsync = (file, dest) => {
  const destPath = file.replace(getSource(file), dest);
  mkdirp(path.dirname(destPath));
  return readFileAsync(file, 'utf8')
    .then(content => inlineResourcesFromString(content, url => path.join(path.dirname(file), url)))
    .then(content => 
      writeFileAsync(destPath, content)
        .then(() => Promise.resolve(content))
    );
};

const copyFilesAsync = (files, dest) => {
  return Promise.all(files.map(file => copyFileAsync(file, dest)));
};

exports.copyFilesAsync = copyFilesAsync;
exports.copyFileAsync = copyFileAsync;
exports.inlineResourcesFromString = inlineResourcesFromString;
exports.inlineResources = (src, dest) => {
  const files = getFiles(src);
  return Promise.all(files.map(file => copyFilesAsync(file, dest)));
};
