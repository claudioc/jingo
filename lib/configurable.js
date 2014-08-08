var _ = require("lodash"),
    app = require("./app");

var Configurable = function () {
  this.config = {};
  this.overrides = {};
};

Configurable.prototype.configOverride = function (snippet) {
  this.overrides = snippet ? _.extend(this.overrides, snippet) : {};
};

Configurable.prototype.getConfig = function () {

  try {
    this.config = _.clone(app.getInstance().locals.config.get(), true);
  } catch (e) {
    this.config = _.clone(require("./config").defaults, true);
  }
  return _.merge(this.config, this.overrides);
};

module.exports = Configurable;