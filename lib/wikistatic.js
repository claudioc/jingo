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

  return function(req, res, next) {
    if (req.url.match(/\.md$/)) {
      next();
    }
    else {
      middleware(req, res, next);
    }
  }
};

module.exports = new WikiStatic();
