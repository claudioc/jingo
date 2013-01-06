var Iconv = require("iconv").Iconv;

var iconv = new Iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE');

var normalize = function(str) {

  if (!str) {
    return "";
  }
  
  str = iconv.convert(str)
             .toString()
             .replace(/\s/g, '-')
             .replace(/[^a-zA-Z0-9\- _]/g, "")
             .toLowerCase();

  return str;
};

exports.normalize = normalize;
