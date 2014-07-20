var fs       = require('fs')
  , models = require("../lib/models")
  , Promise = require("bluebird")
  , renderer = require('../lib/renderer');

models.use(Git);

function Component(name, file) {
  this.name    = name;
  this.file    = file;
  this.cache   = null;
  this.timer   = 0;
  this._exists = false;
}

Component.prototype.exists = function() {

  if ((Date.now() - this.timer) > 30000) {
    this.timer = Date.now();
    this.cache = null;
  } else {
    return this._exists;
  }

  this._exists = fs.existsSync(Git.absPath(this.file));

  if (!this._exists) {
    this.cache = null;
  }

  return this._exists;
};

Component.prototype.fetchAsync = function(cb) {

  if (!this.exists()) {
    cb.call(null, null);
    return;
  }

  if (this.cache) {
    cb.call(null, null, this.cache);
    return;
  }

  var page = new models.Page(this.file);

  page.fetch().then(function() {
    cb.call(null, null, this.cache = renderer.render(page.content));
  });
};

Component.prototype.fetchSync = function() {

  if (!this.exists()) {
    return null;
  }

  if (!this.cache) {
    this.cache = fs.readFileSync(Git.absPath(this.file));
  }

  return this.cache;
};

module.exports = (function() {

  var components = [
    new Component("sidebar", "_sidebar.md"),
    new Component("footer",  "_footer.md"),
    new Component("style",   "_style.css"),
    new Component("script",  "_script.js"),
  ];

  function find(name) {
    return components.filter(function(c) {
      return c.name == name;
    })[0];
  }

  var publicMethods = {

    expire: function(name) {
      find(name).cache = null;
    },

    hasSidebar: function() {
      return find("sidebar").exists();
    },

    hasFooter: function() {
      return find("footer").exists();
    },

    hasCustomStyle: function() {
      return find("style").exists();
    },

    hasCustomScript: function() {
      return find("script").exists();
    },

    sidebar: function(cb) {
      find("sidebar").fetchAsync(cb);
    },

    footer: function(cb) {
      find("footer").fetchAsync(cb);
    },

    customStyle: function() {
      // Read sync because this info is needed by the layout
      return find("style").fetchSync();
    },

    customScript: function() {
      // Read sync because this info is needed by the layout
      return find("script").fetchSync();
    }
  };

  publicMethods.sidebarAsync = Promise.promisify(publicMethods.sidebar, publicMethods);
  publicMethods.footerAsync = Promise.promisify(publicMethods.footer, publicMethods);

  return publicMethods;

})();
