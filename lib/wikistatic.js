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
