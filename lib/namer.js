var Iconv = require("iconv").Iconv
  , app   = require("./app");

var iconv = new Iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE');

module.exports = {

  normalize: function(str) {

    var pagesConfig = app.getInstance().locals.pagesConfig;

    var ret = str;

    if (typeof ret != 'string' || ret.trim() == "") {
      return "";
    }

    var wsReplacement = "-";
    if (pagesConfig.namingConventions.indexOf('underscore') !== -1) {
      wsReplacement = "_";
    }

    ret = iconv.convert(ret)
               .toString()
               .trim()
               .replace(/\s/g, wsReplacement)
               .replace(/\//g, wsReplacement)
               .replace(/[^a-zA-Z0-9\- _]/g, "");

    if (pagesConfig.namingConventions.indexOf('lowercase') !== -1) {
      ret = ret.toLowerCase();
    }

    return ret;
  },

  // Not symmetric by any chance, but still better than nothing
  denormalize: function(str) {

    var pagesConfig = app.getInstance().locals.pagesConfig;

    var ret = str;

    if (typeof ret != 'string' || ret.trim() === "") {
      return "";
    }

    var wsReplacement = "-";
    if (pagesConfig.namingConventions.indexOf('underscore') !== -1) {
      wsReplacement = "_";
    }

    ret = ret.replace(new RegExp(wsReplacement, "g"), " ");

    if (pagesConfig.namingConventions.indexOf('lowercase') !== -1) {
      ret = ret.replace(/(^|\s)([a-z])/g , function(m,p1,p2) {
        return p1 + p2.toUpperCase();
      });
    }

    return ret;
  }

};
