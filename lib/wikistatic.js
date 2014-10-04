var path = require("path"),
    Configurable = require("./configurable"),
    ecstatic = require("ecstatic");

var WikiStatic = function () {
  Configurable.call(this);
};

WikiStatic.prototype = Object.create(Configurable.prototype);

WikiStatic.prototype.configure = function () {
  var config = this.getConfig().application;
  var whiteList = config.staticWhitelist;
  var wikiRoot = Git.absPath('');
  var middleware = ecstatic({ root: wikiRoot, handleError: false });

  console.log('>>>> ' + whiteList);

  var regexpList = [];
  var patterns = whiteList.split(',');

  for(var i = 0; i < patterns.length; i++) {
      var pattern = patterns[i];
      console.log(i, pattern);
      var res = /^\/(.*)\/(.*)/.exec(pattern);

      if (res) {
	  var regexp = RegExp(res[1], res[2]);
	  console.log(regexp);
	  regexpList.push(regexp);
      }
  }

  console.log(regexpList.length + ' regexes found');
  console.log(regexpList);

  return function(req, res, next) {
    if (regexpList.some(function(regexp) { return regexp.test(req.url); })) {
      // The requested URL matches some pattern on the white list, serve it up!
      console.log('>>> serving ' + req.url);
      middleware(req, res, next);
    }
    else {
      next();
    }
  }
};

module.exports = new WikiStatic();
