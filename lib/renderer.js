var Marked = require("marked"),
    crypto = require("crypto"),
    Nsh    = require("node-syntaxhighlighter"),
    namer  = require("../lib/namer"),
    Configurable = require("./configurable"),
    reTOC = /(.?)\[\(TOC\)\](.?)/g;

var Configuration = function() {
  Configurable.call(this);
}

Configuration.prototype = Object.create(Configurable.prototype);

var configuration = new Configuration();

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
    return '<code class="md-code">' +
           (escaped ? code : escape(code, true)) +
           '\n</code>';
  }

  return '<code class="md-code '
    + this.options.langPrefix
    + escape(lang, true)
    + '">'
    + (escaped ? code : escape(code, true))
    + '\n</code>\n';

};

function escapeHeading(text) {
  return text.trim().toLowerCase().replace(/[^\w]+/g, '-');
}

mdRenderer.heading = function(text, level) {
  return '<h' + level + ' id="heading-' + escapeHeading(text) + '">' + text + '</h' + level + '>';
};

Marked.setOptions({
  gfm: true,
  renderer: mdRenderer,
  // pedantic: this is set on the render method
  // breaks: this is set on the render method
  tables: true,
  smartLists: true,
  sanitize: false, // To be able to add iframes
  highlight: function(code, lang) {
    lang = lang || "text";
    return Nsh.highlight(code, Nsh.getLanguage(lang) || Nsh.getLanguage('text'), {gutter: lang !== 'text'});
  }
});

var tagmap = {};
var includeTOC = false;

// Yields the content with the rendered [[bracket tags]]
// The rules are the same for Gollum https://github.com/github/gollum
function extractTags(text) {

  tagmap = {};

  var matches = text.match(/(.?)\[\[(.+?)\]\]([^\[]?)/g),
      tag,
      id;

  if (matches) {
    matches.forEach(function(match) {
      match = match.trim();
      tag = /(.?)\[\[(.+?)\]\](.?)/.exec(match);
      if (tag[1] == "'") {
        return;
      }
      id = crypto.createHash('sha1').update(tag[2]).digest("hex");
      tagmap[id] = tag[2];
      text = text.replace(tag[0], id);
    });

  }

  includeTOC = reTOC.test(text);

  return text;
}

function evalTags(text) {

  var parts,
      name,
      pageName,
      re;

  for (var k in tagmap) {
    parts = tagmap[k].split("|");
    name = pageName = parts[0];
    if (parts[1]) {
      pageName = parts[1];
    }
    pageName = encodeURIComponent(namer.wikify(pageName));

    tagmap[k] = "<a class=\"internal\" href=\"/wiki/" + pageName + "\">" + name + "</a>";
  }

  for (k in tagmap) {
    re = new RegExp(k, "g");
    text = text.replace(re, tagmap[k]);
  }

  text = generateTOC(text);

  return text;
}

function generateTOC(text) {
  var links = [];
  if (includeTOC) {
    headings = text.match(new RegExp(Marked.Lexer.rules.heading.source, "gm"));
    if (headings.length) {
      for (var i = 0, l= headings.length; i < l; i++) {
        var heading = headings[i].trim();
        var tag = (new RegExp(Marked.Lexer.rules.heading.source)).exec(heading);
        if (2 < tag.length) {
          if (1 < tag[1].length) { // Don't include H1 tags in TOC
            links.push('<li><a href="#heading-' + escapeHeading(tag[2]) + '">' + tag[2].trim() + '</a></li>');
          }
        }
      }
    }
    var toc='<div class="toc"><span class="toc-heading">Table of Contents</span><ul>' + links.join('') + '</ul></div>';
    text = text.replace(reTOC, toc);
  }

  return text;
}

var Renderer = {

  render: function(content) {

    Marked.setOptions({
        pedantic: configuration.getConfig().application.pedanticMarkdown,
        breaks: configuration.getConfig().application.gfmBreaks
    });

    var text = extractTags(content);
    text = evalTags(text);
    return Marked(text);
  }

};

module.exports = Renderer;
