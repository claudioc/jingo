var path = require("path"),
    Configurable = require("./configurable"),
    ecstatic = require("ecstatic");

var WikiStatic = function () {
  Configurable.call(this);
};

WikiStatic.prototype = Object.create(Configurable.prototype);

WikiStatic.prototype.configure = function () {
  var wikiRoot = Git.absPath('');
  var middleware = ecstatic({ root: wikiRoot, handleError: false });

  var config = this.getConfig().application;
  var whiteList = config.staticWhitelist;
  var patterns = whiteList.split(',');
  var regexpList = [];

  for(var i = 0; i < patterns.length; i++) {
      var res = /^\/(.*)\/(.*)/.exec(patterns[i].trim());

      if (res) {
	  var regexp = RegExp(res[1], res[2]);
	  regexpList.push(regexp);
      }
  }

  return function(req, res, next) {
    if (regexpList.some(function(regexp) { return regexp.test(req.url); })) {
      // The requested URL matches some pattern on the white list, serve it up!
      middleware(req, res, next);
    }
    else {
      next();
    }
  }
};

module.exports = new WikiStatic();
