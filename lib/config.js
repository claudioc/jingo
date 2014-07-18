var fs   = require('fs');
var yaml = require('js-yaml');
var _ = require("lodash");

module.exports = (function() {

  var config,
      error = "";

  return {

    load: function(filename) {

      this.setup(yaml.load(fs.readFileSync(filename).toString()));

      if (!config.application || !config.server) {
        error = "Missing `application` or `server` config section.";
        return false;
      }

      return true;
    },
    
    getError: function() {
      return error;
    },

    defaults: {

      application: {
        title: "Jingo",
        repository: "",
        docSubdir: "",
        remote: "",
        pushInterval: 30,
        secret: "change me",
      },

      authentication: {
        google: {
          enabled: true,
          clientId: "replace me with the real value",
          clientSecret: "replace me with the real value"
        },
        alone: {
          enabled: false,
          username: "",
          passwordHash: "",
          email: ""
        }
      },

      features: {
        markitup: false,
        codemirror: true
      },

      server: {
        hostname: "localhost",
        port: process.env.PORT || 6067,
        localOnly: false,
        baseUrl: "http://localhost:" + (process.env.PORT || 6067)
      },

      authorization: {
        anonRead: false,
        validMatches: ".+"
      },

      // Defaults for the pages key are compatible with Jingo < 1 (which means
      // that the pages key is not present at all, thus we infer that we are in a Jingo < 1 setup)
      // These defaults are different is the pages key is present.
      // For example, if the index subkey is not present the default
      // would be Home, not home.
      pages: {
        index: "Home",
        title: {
          from: "filename",
          asciiOnly: false
        }
      }

    },

    // Ensure that all the key will have a sane default value
    validate: function() {

      config.application = _.extend({}, this.defaults.application, config.application);
      config.application.pushInterval = (parseInt(config.application.pushInterval, 10) | 0);

      config.authentication = _.extend({}, this.defaults.authentication, config.authentication);

      if (!config.authentication.google.enabled && !config.authentication.alone.enabled ) {
        error = "No authentication method provided.";
        return false;
      }

      if (config.authentication.google.enabled && (!config.authentication.google.clientId || !config.authentication.google.clientSecret)) {
        error = "Invalid or missing authentication credentials for Google (clientId and/or clientSecret).";
        return false;
      }
      
      config.features = _.extend({}, this.defaults.features, config.features);

      // For backward compatibility with version < 0.5, we set markitup as the
      // default rich editor. For new installations, the default is codemirror
      if (!config.features.markitup && !config.features.codemirror) {
        config.features.markitup = true;
      }

      if (config.features.markitup && config.features.codemirror) {
        config.features.markitup = false;
      }

      config.server = _.extend({}, this.defaults.server, config.server);

      config.authorization = _.extend({}, this.defaults.authorization, config.authorization);

      config.pages = _.extend({}, this.defaults.pages, config.pages);

      return true;
    },

    get: function(key) {
      if (typeof key == "undefined") {
        return config;
      }
      return config[key];
    },

    // Manually set the config to the setup value
    setup: function(setup) {
      config = setup;
    },

    // Dumps a sample config file
    sample: function() {
      return "---\n" +
        "# Configuration sample file for Jingo (YAML)\n" +
        yaml.dump(this.defaults);
    }
  };

})();
