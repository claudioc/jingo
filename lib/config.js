var fs   = require('fs');
var yaml = require('yaml-js');
var _ = require("lodash");

module.exports = (function() {

  var config;

  return {

    load: function(filename) {

      this.setup(yaml.load(fs.readFileSync(filename).toString()));

      if (!config.application || !config.server) {
        return false;
      }

      return true;
    },

    has: function(key) {
      return !!this.get("pages");
    },

    def: function(key) {

      var defs, values;

      if ("pages" === key) {
        // Defaults for the pages key are compatible with Jingo < 1 (which means
        // that the pages key is not present at all, thus we infer that we are in a Jingo < 1 setup)
        // These defaults are different is the pages key is present.
        // For example, if the index subkey is not present the default
        // would be Home, not home.
        defs = {
          index: "Home",
          title: {
            from: "filename",
            asciiOnly: false
          }
        };

        console.log(this.get(key));
        
        values = _.extend(this.get(key), defs);

        return values;
      }

      if ("features" === key) {
        // For backward compatibility with version < 0.5, we set markitup as the
        // default rich editor. For new installations, the default is codemirror
        if (typeof app.locals.features.codemirror == 'undefined' &&
            typeof app.locals.features.markitup == 'undefined') {
          app.locals.features.markitup = true;
        }

        // This should never happen, of course
        if (app.locals.features.markitup &&
            app.locals.features.codemirror) {
          app.locals.features.markitup = false;
        }


      }
    },

    // Get a key in the form "xxx.yyy"
    get: function(key, def) {

      if (typeof key == "undefined") {
        return config;
      }

      var val = config;
      try {
        key.split(".").forEach(function(e) { val = val[e]; });
      } catch(e) {}

      return (typeof def != 'undefined' && typeof val == 'undefined') ? (typeof def == "function" ? def.call(this, key) : def) : val;
    },

    // Manually set the config to the setup value
    setup: function(setup) {
      config = setup;
    },

    // Dumps a sample config file
    sample: function() {
      return "\
---\n\
  # Configuration sample file for Jingo (YAML)\n\
  application:\n\
    title: \"Jingo\"\n\
    repository: \"/absolute/path/to/your/repo\"\n\
    docSubdir: \"\"\n\
    remote: \"\"\n\
    pushInterval: 30\n\
    secret: \"change me\"\n\
  features:\n\
    markitup: false\n\
    codemirror: true\n\
  pages:\n\
    # `dash` or `underscore`\n\
    nameSeparator: dash\n\
    index: Home\n\
    # `filename` or `content`\n\
    titleFrom: filename\n\
  server:\n\
    hostname: \"localhost\"\n\
    port: 6067\n\
    localOnly: false\n\
    baseUrl: \"http://localhost:6067\"\n\
  authorization:\n\
    anonRead: true\n\
    validMatches: \".+\"\n\
  authentication:\n\
    google:\n\
      enabled: true\n\
      clientId: \"replace me with the real value\"\n\
      clientSecret: \"replace me with the real value\"\n\
    alone:\n\
      enabled: false\n\
      username: \"\"\n\
      passwordHash: \"\"\n\
      email: \"\"\n\
    ";
    }

  };

})();
