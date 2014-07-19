
var Marked = require("marked")
  , Crypto = require('crypto')
  , Nsh    = require('node-syntaxhighlighter')
  , Namer  = require("../lib/namer");

var mdRenderer = new Marked.Renderer();

mdRenderer.code = function(code, lang, escaped) {

  if (this.options.highlight) {
    var out = this.options.highlight(code, lang);
    if (out !== null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  if (!lang) {
    return '<code class="md-code">'
      + (escaped ? code : escape(code, true))
      + '\n</code>';
  }

  return '<code class="md-code '
    + this.options.langPrefix
    + escape(lang, true)
    + '">'
    + (escaped ? code : escape(code, true))
    + '\n</code>\n';

};

Marked.setOptions({
  gfm: true,
  renderer: mdRenderer,
  pedantic: false,
  breaks: true,
  smartLists: true,
  sanitize: false, // To be able to add iframes
  highlight: function(code, lang) {
    lang = lang || "text";
    return Nsh.highlight(code, Nsh.getLanguage(lang) || Nsh.getLanguage('text'), {gutter: lang !== 'text'});
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

  if (matches) {
    matches.forEach(function(match) {
      match = match.trim();
      tag = /(.?)\[\[(.+?)\]\](.?)/.exec(match);
      if (tag[1] == "'") {
        return;
      }
      id = Crypto.createHash('sha1').update(tag[2]).digest("hex");
      tagmap[id] = tag[2];
      text = text.replace(tag[0], id);
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
    pageName = Namer.wikify(pageName);

    tagmap[k] = "<a class=\"internal\" href=\"/wiki/" + pageName + "\">" + name + "</a>";
  }

  for (k in tagmap) {
    re = new RegExp(k, "g");
    text = text.replace(re, tagmap[k]);
  }

  return text;

  //return text.replace(/\n/g, "");
}

var Renderer = {

  render: function(content) {
    var text = extractTags(content);
    text = evalTags(text);
    return Marked(text);
  }

};

module.exports = Renderer;
