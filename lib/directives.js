var directives = {
  TOC: function(text) {
    var toc = require('markdown-toc');
    return toc(text).content;
  }
};

module.exports = {
  directiveMap: directives
};
