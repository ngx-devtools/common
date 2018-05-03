const fs = require('fs');

/**
 * Inline html template
 * @param {environment mode} envMode 
 */
const inlineTemplate = (envMode) => {
  return (content, urlResolver) => {
    return content.replace(/templateUrl:\s*'([^']+?\.html)'/g, function (m, templateUrl) {
      const templateFile = urlResolver(templateUrl);
      const templateContent = fs.readFileSync(templateFile, 'utf8');
      const shortenedTemplate = templateContent.replace(/([\n\r]\s*)+/gm, ' ').replace(/"/g, '\\"');
      return `template: "${shortenedTemplate}"`;
    });
  }
};

module.exports = inlineTemplate;