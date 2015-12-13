var _ = require("lodash");
var config  = require('./config');

var Configurable = function () {
  this.config = {};
  this.overrides = {};
};

Configurable.prototype.configOverride = function (snippet) {
  this.overrides = snippet ? _.extend(this.overrides, snippet) : {};
};

Configurable.prototype.getConfig = function () {

  try {
    // The config has been already loaded somewhere else
    this.config = _.clone(config.get(), true);
  } catch (e) {
    this.config = _.clone(config.defaults, true);
  }

  return _.merge(this.config, this.overrides);
};

module.exports = Configurable;