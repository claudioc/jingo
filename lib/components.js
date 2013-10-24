var Fs       = require('fs')
  , Renderer = require('../lib/renderer')

module.exports = Components = (function() {

  var Git;

  var components = {
    'sidebar': { 
      cache: null, 
      timer: 0,
      file: "_sidebar.md"
    },
    'footer': { 
      cache: null, 
      timer: 0,
      file: "_footer.md"
    },
    'style': { 
      cache: null, 
      timer: 0,
      file: "_style.css"
    },
    'script': { 
      cache: null, 
      timer: 0,
      file: "_script.js"
    },
  }

  function verify(filename) {

    if (!timer[filename]) {
      timer[filename] = Date.now();
    }

    if (Date.now() - timer[filename] > 30000) {

    }
    exists = Fs.existsSync(Git.absPath("_sidebar.md"));

  }

  return {

    init: function(git) {
      Git = git;
    },

    hasSidebar: function() {
      return verify("_sidebar.md");
    },

    hasFooter: function() {
      return Fs.existsSync(Git.absPath("_footer.md"));
    },

    hasCustomStyle: function() {
      return Fs.existsSync(Git.absPath("_style.css"));
    },

    hasCustomScript: function() {
      return Fs.existsSync(Git.absPath("_script.js"));
    },

    sidebar: function(cb) {

      if (this.hasSidebar()) {
        if (!_sidebar) {
          Git.readFile("_sidebar.md", "HEAD", function(err, content) {
            if (!err) {
              _sidebar = Renderer.render(content.split("\n").splice(1).join("\n"));
              cb.call(null, _sidebar);
            }
          });
        } else {
          cb.call(null, _sidebar);
        }
      } else {
        _sidebar = null;
        cb.call(null, _sidebar);
      }
    },

    footer: function(cb) {

      if (this.hasFooter()) {
        if (!_footer) {
          Git.readFile("_footer.md", "HEAD", function(err, content) {
            if (!err) {
              _footer = Renderer.render(content.split("\n").splice(1).join("\n"));
            }
          });
        } else {
          cb.call(null, _footer);
        }
      } else {
        _footer = null;
        cb.call(null, _footer);
      }
    },

    customStyle: function() {

      if (this.hasCustomStyle() && !_style) {
        // Read sync because this info is needed by the layout
        _style = Fs.readFileSync(Git.absPath("_style.css"));
      } else {
        _style = null;
      }

      return _style;
    },

    customScript: function() {

      if (this.hasCustomScript() && !_script) {
        // Read sync because this info is needed by the layout
        _script = Fs.readFileSync(Git.absPath("_script.js"));
      } else {
        _script = null;
      }

      return _script;
    }
  };

})();
