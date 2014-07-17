var Iconv = require("iconv").Iconv
  , app   = require("./app");

var iconv = new Iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE');
var wsReplacement = "-";

function getWhitespaceReplacement() {
  // For future improvements
  return "-";
}

function hasNamingConvention(nc) {
  var pagesConfig = app.getInstance().locals.pagesConfig;
  return pagesConfig.namingConventions.indexOf(nc) !== -1;
}

module.exports = {

  normalize: function(str) {

    var ret = str;

    if (typeof ret != 'string' || ret.trim() == "") {
      return "";
    }

    wsReplacement = getWhitespaceReplacement();

    ret = iconv.convert(ret)
               .toString()
               .trim()
               .replace(/\s/g, wsReplacement)
               .replace(/\//g, wsReplacement)
               .replace(/[^a-zA-Z0-9\- _]/g, "");

    if (hasNamingConvention('lowercase')) {
      ret = ret.toLowerCase();
    }

    return ret;
  },

  // Not symmetric by any chance, but still better than nothing
  denormalize: function(str) {

    var ret = str;

    if (typeof ret != 'string' || ret.trim() === "") {
      return "";
    }

    wsReplacement = getWhitespaceReplacement();

    ret = ret.replace(new RegExp(wsReplacement, "g"), " ");

    if (hasNamingConvention('lowercase')) {
      ret = ret.replace(/(^|\s)([a-z])/g , function(m,p1,p2) {
        return p1 + p2.toUpperCase();
      });
    }

    return ret;
  }
};
