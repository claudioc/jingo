
var Marked = require("marked")
  , Crypto = require('crypto')
  , Nsh    = require('node-syntaxhighlighter')
  , Namer  = require("../lib/namer");

Marked.setOptions({
  gfm: true,
  pedantic: false,
  sanitize: false, // To be able to add iframes 
  highlight: function(code, lang) {
    return Nsh.highlight(code, Nsh.getLanguage(lang));
  }
});

var tagmap = {};

// Yields the content with the rendered [[bracket tags]]
// The rules are the same for Gollum https://github.com/github/gollum
function extractTags(text) {

  tagmap = {};
  
  var matches = text.match(/(.?)\[\[(.+?)\]\]([^\[]?)/g)
    , tag
    , id;

  // TODO text the ' at the beginning
  if (matches) {
    matches.forEach(function(match) {
      tag = /\[\[(.+?)\]\]/.exec(match)[1];
      id = Crypto.createHash('sha1').update(tag).digest("hex")
      tagmap[id] = tag;
      text = text.replace(tag, id);
    });

  }
  return text;
}

function evalTags(text) {
  var parts
    , name
    , pageName
    , re;

  for (var k in tagmap) {
    parts = tagmap[k].split("|");
    name = pageName = parts[0];
    if (parts[1]) {
      pageName = parts[1];
    }
    pageName = Namer.normalize(pageName);

    tagmap[k] = "<a class=\"internal\" href=\"/wiki/" + pageName + "\">" + name + "</a>";
  }

  for (k in tagmap) {
    re = new RegExp("\\[\\[" + k + "\\]\\]", "g");
    text = text.replace(re, tagmap[k]);
  }
  return text.replace(/\n/g, "");
}

var Renderer = {

  render: function(content) {

    var text = Marked(content);

    text = extractTags(text);

    text = evalTags(text);

    return text;
  }

};

module.exports = Renderer;
