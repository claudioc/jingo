var fs   = require('fs');
var yaml = require('yaml-js');

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

    // Get a key in the form "xxx.yyy"
    get: function(key, def) {

      if (typeof key == "undefined") {
        return config;
      }

      var val = config;
      try {
        key.split(".").forEach(function(e) { val = val[e]; });
      } catch(e) {}

      return (typeof def != 'undefined' && typeof val == 'undefined') ? def : val;
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
    namingConvention: lowercase\n\
    index: home\n\
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
