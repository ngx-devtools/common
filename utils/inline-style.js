const fs = require('fs');
const path = require('path');
const sass = require('node-sass');
const mime = require('mime');

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

const buildSass = (content, sourceFile) => {
  try {
    return sourceFile.endsWith('.scss') ? 
      sass.renderSync({ data: content, file: sourceFile, outputStyle: 'compressed' })
        .css.toString() : content;
  } catch (e) {
    console.error('\x1b[41m');
    console.error('at ' + sourceFile + ':' + e.line + ":" + e.column);
    console.error(e.formatted);
    console.error('\x1b[0m');
    return "";
  }
};

const inlineStyleProdMode = (content, urlResolver) => {
  return content.replace(/styleUrls\s*:\s*(\[[\s\S]*?\])/gm, (m, styleUrls) => {
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
      .join(',\n').replace('\n', ' ')
      + ']';
  });
};

const inlineStyleDevMode = (content, urlResolver) => {
  return content.replace(/styleUrls\s*:\s*(\[[\s\S]*?\])/gm,  (m, styleUrls) => {
    m = m.replace('styleUrls', 'styles');
    const urls = eval(styleUrls);
    urls.forEach(styleUrl => {
      const styleFile = urlResolver(styleUrl);
      const originContent = fs.readFileSync(styleFile, 'utf8');
      const styleContent = buildSass(originContent, styleFile);
      const shortenedStyle = styleContent
        .replace(/([\n\r]\s*)+/gm, '')
        .replace(/"/g, '\\"')
        .replace(/inline\(([^\)]+)\)/g, inlineImage(styleFile));
      m = m.replace(styleUrl, shortenedStyle);
    });
    return m;
  });
};

exports.inlineStyle = (envMode = false) => {
  return (envMode) ? inlineStyleProdMode : inlineStyleDevMode;
};
exports.inlineStyleDevMode = inlineStyleDevMode;
exports.inlineStyleProdMode = inlineStyleProdMode;
exports.buildSass = buildSass;
