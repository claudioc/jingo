var Iconv = require("iconv").Iconv;

var iconv = new Iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE');

var normalize = function(str) {

  var ret = str;

  if (typeof ret != 'string' || ret.trim() == "") {
    return "";
  }
  
  ret = iconv.convert(ret)
             .toString()
             .trim()
             .replace(/\s/g, '-')
             .replace(/\//g, '-')
             .replace(/[^a-zA-Z0-9\- _]/g, "")
             .toLowerCase();

  return ret;
};

// Not symmetric by any chance, but still better than nothing
var denormalize = function(str) {

  var ret = str;

  if (typeof ret != 'string' || ret.trim() == "") {
    return "";
  }

  ret = ret.replace(/-/g, " ");

  ret = ret.replace( /(^|\s)([a-z])/g , function(m,p1,p2) {
    return p1+p2.toUpperCase();
  });

  return ret;
}

exports.normalize = normalize;
exports.denormalize = denormalize;
