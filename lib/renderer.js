
var Marked = require("marked");

Marked.setOptions({
  gfm: true,
  pedantic: false,
  sanitize: false, // To be able to add iframes 
  highlight: function(code, lang) {
    return Nsh.highlight(code, Nsh.getLanguage(lang));
  }
});


var Renderer = {

  tagmap: {},

  render: function(content) {

    var text = Marked(content);

    return Marked(content);
  },

  // Yields the content with the rendered [[bracket tags]]
  // The rules are the same for Gollum https://github.com/github/gollum
  compileMarkup: function(content) {

    var text = content.match(/(.?)\[\[(.+?)\]\]([^\[]?)/g);
console.log(text);    
    return text;

  },

  extractTags: function(content) {

    return 
  }






};

module.exports = Renderer;
