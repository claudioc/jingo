var Iconv = require("iconv").Iconv
  , app   = require("./app");

var iconv = new Iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE');
var wsReplacement = "-";

function getWhitespaceReplacement() {
  // For future improvements
  return "-";
}

function getPagesConfig() {
  return app.getInstance().locals.config.get("pages");
}

module.exports = {

  wikify: function(str) {

    var ret = str;

    if (typeof ret != "string" || ret.trim() == "") {
      return "";
    }

    wsReplacement = getWhitespaceReplacement();

    var pc = getPagesConfig();

    if (pc.title.asciiOnly) {
      ret = iconv.convert(ret)
                 .toString()
                 .replace(/[^a-zA-Z0-9\- _]/g, "")
                 .trim();
    }

    if (pc.title.lowercase) {
      ret = ret.toLowerCase();
    }

    if (pc.title.replaceWs) {
      ret = ret.replace(/\s/g, wsReplacement)
               .replace(/\//g, wsReplacement);
    }

    return ret;
  },

  // Not symmetric by any chance, but still better than nothing
  unwikify: function(str) {

    var ret = str;

    if (typeof ret != 'string' || ret.trim() === "") {
      return "";
    }

    var pc = getPagesConfig();

    wsReplacement = getWhitespaceReplacement();

    if (pc.title.replaceWs) {
      ret = ret.replace(new RegExp(wsReplacement, "g"), " ");
    }

    if (pc.title.lowercase) {
      // "something really hot" => "Something Really Hot"
      ret = ret.replace(/(^|\s)([a-z])/g , function(m,p1,p2) {
        return p1 + p2.toUpperCase();
      });
    }

    return ret;
  }
};
