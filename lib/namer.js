var Iconv = require("iconv").Iconv,
    app = require("./app"),
    Configurable = require("./configurable");

var iconv = new Iconv("UTF-8", "ASCII//TRANSLIT//IGNORE");
var wsReplacement = "-";
var overrides = {};

function getWhitespaceReplacement() {
  // For future improvements
  return "-";
}

var Namer = function () {
  Configurable.call(this);
};

Namer.prototype = Object.create(Configurable.prototype);

Namer.prototype.wikify = function (str) {

  var ret = str;

  if (typeof ret != "string" || ret.trim() === "") {
    return "";
  }

  wsReplacement = getWhitespaceReplacement();

  var pc = this.getConfig().pages;

  // Replace < and > with '' (Gollum replaces it with '-')
  ret = ret.replace(/[<>]/g, '');
  // Replace / with '-' (Gollum replaces it with '')
  ret = ret.replace(/\//g, '-');

  if (pc.title.asciiOnly) {
    ret = iconv.convert(ret)
               .toString()
               .replace(/[^a-zA-Z0-9\- _]/g, "");
  }

  ret = ret.trim();

  if (pc.title.lowercase) {
    ret = ret.toLowerCase();
  }

  ret = ret.replace(/\s/g, wsReplacement);

  return ret;
};

  // Not symmetric by any chance, but still better than nothing
Namer.prototype.unwikify = function (str) {

  var ret = str;

  if (typeof ret != "string" || ret.trim() === "") {
    return "";
  }

  var pc = this.getConfig().pages;

  wsReplacement = getWhitespaceReplacement();

  ret = ret.replace(new RegExp(wsReplacement, "g"), " ");

  if (pc.title.lowercase) {
    // "something really hot" => "Something Really Hot"
    ret = ret.split(/\b/).map(function (v) {
      return v.slice(0,1).toUpperCase() + v.slice(1);
    }).join("");
  }

  return ret;
};

module.exports = new Namer();
