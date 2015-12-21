var Marked = require("marked"),
    crypto = require("crypto"),
    Nsh    = require("node-syntaxhighlighter"),
    namer  = require("./namer"),
    directives   = require("./directives"),
    Configurable = require("./configurable");

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
  return text;
}

function evalTags(text) {

  var parts,
      name,
      pageName,
      re;
  
  var mountpath = configuration.getConfig().application.mountpath;

  for (var k in tagmap) {
    parts = tagmap[k].split("|");
    name = pageName = parts[0];
    if (parts[1]) {
      pageName = parts[1];
    }
    pageName = encodeURIComponent(namer.wikify(pageName));

    tagmap[k] = "<a class=\"internal\" href=\"" + mountpath + "/wiki/" + pageName + "\">" + name + "</a>";
  }

  for (k in tagmap) {
    re = new RegExp(k, "g");
    text = text.replace(re, tagmap[k]);
  }

  return text;
}

var directiveMap = directives.directiveMap;

function applyDirectives(text) {
  var matches = text.match(/\{\{([^}]*)\}\}/g);

  if (matches) {
    matches.forEach(function(match) {
      var directiveString = /\{\{([^}]*)\}\}/.exec(match)[1];
      var directiveSplit = directiveString.split('\n');
      var directive = directiveSplit[0];
      var args = directiveSplit.slice(1).join('\n');
      if (directive in directiveMap) {
        text = text.replace(match, directiveMap[directive](text, args));
      }
    });
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
    text = applyDirectives(text);
    return Marked(text);
  }

};

module.exports = Renderer;
