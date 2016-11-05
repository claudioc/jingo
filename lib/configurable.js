var _ = require('lodash')
var configObject = require('./config')

var Configurable = function () {
  this.config = {}
  this.overrides = {}
  this.configObject = configObject
}

Configurable.prototype.configOverride = function (snippet) {
  this.overrides = snippet ? _.extend(this.overrides, snippet) : {}
}

Configurable.prototype.getConfig = function () {
  try {
    // The config has been already loaded somewhere else
    this.config = _.clone(configObject.get(), true)
  } catch (e) {
    this.config = _.clone(configObject.defaults, true)
  }

  return _.merge(this.config, this.overrides)
}

// Provides a way to override the proxyPath
Configurable.prototype.getProxyPath = function () {
  return configObject.getProxyPath(this.overrides.application && this.overrides.application.proxyPath)
}

module.exports = Configurable
