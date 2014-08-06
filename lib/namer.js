var Iconv = require("iconv").Iconv,
    app   = require("./app"),
    _     = require("lodash");

var iconv = new Iconv("UTF-8", "ASCII//TRANSLIT//IGNORE");
var wsReplacement = "-";
var overrides = {};

function getWhitespaceReplacement() {
  // For future improvements
  return "-";
}

function getPagesConfig() {

  var config;

  try {
    config = _.clone(app.getInstance().locals.config.get("pages"), true);
  } catch (e) {
    config = _.clone(require("./config").defaults.pages, true);
  }

  return _.merge(config, overrides);
}

module.exports = {

  configOverride: function (snippet) {
    overrides = snippet ? _.extend(overrides, snippet) : {};
  },

  getCurrentConfig: function () {
    return getPagesConfig();
  },

  wikify: function(str) {

    var ret = str;

    if (typeof ret != "string" || ret.trim() === "") {
      return "";
    }

    wsReplacement = getWhitespaceReplacement();

    var pc = getPagesConfig();

    if (pc.title.asciiOnly) {
      ret = iconv.convert(ret)
                 .toString()
                 .replace(/[^a-zA-Z0-9\- _]/g, "");
    }

    ret = ret.trim();

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

    if (typeof ret != "string" || ret.trim() === "") {
      return "";
    }

    var pc = getPagesConfig();

    wsReplacement = getWhitespaceReplacement();

    if (pc.title.replaceWs) {
      ret = ret.replace(new RegExp(wsReplacement, "g"), " ");
    }

    if (pc.title.lowercase) {
      // "something really hot" => "Something Really Hot"
      ret = ret.split(/\b/).map(function (v) {
        return v.slice(0,1).toUpperCase() + v.slice(1);
      }).join("");
    }

    return ret;
  }
};
