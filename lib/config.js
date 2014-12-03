var fs   = require('fs'),
    yaml = require('js-yaml'),
    _ = require("lodash");

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

      // Find any alien configuration options section
      var aliens = _.difference(Object.keys(config), Object.keys(this.defaults));
      if (aliens.length > 0) {
        error = "Unrecognized section name(s) " + aliens.join(',');
        return false;
      }

      // Find any alien configuration options section name
      var keys = Object.keys(this.defaults);
      for (var i = 0; i < keys.length; i++) {
        if (typeof config[keys[i]] == 'undefined') {
          continue;
        }
        aliens = _.difference(Object.keys(config[keys[i]]), Object.keys(this.defaults[keys[i]]));
        if (aliens.length > 0) {
          error = "Unrecognized configuration option(s) " + aliens.join(',') + " in section " + keys[i];
          return false;
        }
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
        git: "git",
        skipGitCheck: false,
        loggingMode: 1,
        pedanticMarkdown: true,
        staticWhitelist: "/\\.png$/i, /\\.jpg$/i, /\\.gif$/i"
      },

      authentication: {
        google: {
          enabled: true,
          clientId: "replace me with the real value",
          clientSecret: "replace me with the real value"
        },
        github: {
          enabled: false,
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
        baseUrl: ""
      },

      authorization: {
        anonRead: true,
        validMatches: ".+"
      },

      // Defaults for the pages key are compatible with Jingo < 1 (which means
      // that the pages key is not present at all, thus we infer that we are in a Jingo < 1 setup)
      // These defaults are different is the pages key is present.
      // For example, if the index subkey is not present the default
      // would be Home, not home.

      // Please note that the combination of "from filename" and "ascii only" 
      // is not really an valid option (information will be probably lost regarding
      // non ASCII only caracters)
      pages: {
        index: "Home",
        title: {
          fromFilename: true,
          fromContent: false,
          asciiOnly: false,
          lowercase: false
        },
        itemsPerPage: 10
      },

      customizations: {
        sidebar: "_sidebar.md",
        footer: "_footer.md",
        style: "_style.css",
        script: "_script.js",
      }
    },

    // Ensure that all the key will have a sane default value
    validate: function() {

      config.application = _.extend({}, this.defaults.application, config.application);
      config.application.pushInterval = (parseInt(config.application.pushInterval, 10) | 0);

      config.authentication = _.extend({}, this.defaults.authentication, config.authentication);

      if (!config.authentication.google.enabled && !config.authentication.github.enabled && !config.authentication.alone.enabled ) {
        error = "No authentication method provided.";
        return false;
      }

      if (config.authentication.google.enabled && (!config.authentication.google.clientId || !config.authentication.google.clientSecret)) {
        error = "Invalid or missing authentication credentials for Google (clientId and/or clientSecret).";
        return false;
      }

      if (config.authentication.github.enabled && (!config.authentication.github.clientId || !config.authentication.github.clientSecret)) {
        error = "Invalid or missing authentication credentials for Github (clientId and/or clientSecret).";
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

      if (config.pages) {
        config.pages = _.extend({}, this.defaults.pages, config.pages);

        if (!config.pages.title.fromFilename && !config.pages.title.fromContent) {
          config.pages.title.fromFilename = true;
        }

        if (config.pages.title.fromFilename && config.pages.title.fromContent) {
          config.pages.title.fromFilename = true;
        }
      }
      else {
        config.pages = _.extend({}, this.defaults.pages, config.pages);
        // If the pages config key is not present, we desume that the user has
        // upgraded Jingo but not the config file so we need to maintain the "old"
        // behavior
        config.pages.index = "home";
        config.pages.title.fromFilename = false;
        config.pages.title.fromContent = true;
        config.pages.title.asciiOnly = true;
      }

      config.customizations = _.extend({}, this.defaults.customizations, config.customizations);

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
