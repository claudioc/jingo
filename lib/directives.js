var directives = {
  TOC: function (text) {
    var toc = require('markdown-toc')
    text = text.split('\n').slice(1).join('\n')
    return toc(text, {slugify: function (str) {
      return str.toLowerCase().replace(/[^\w]+/g, '-')
    }}).content
  }
}

module.exports = {
  directiveMap: directives
}
