var Fs   = require('fs');
var yaml = require('yaml-js');

module.exports = Config = (function() {

  var config;

  return {

    load: function(filename) {

      this.setup(yaml.load(Fs.readFileSync(filename).toString()));

      if (!config.application || !config.server) {
        console.log("Error: a problem exists in the config file. Cannot continue.");
        process.exit(-1);
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
    alone:\n\
      enabled: false\n\
      username: \"\"\n\
      passwordHash: \"\"\n\
      email: \"\"\n\
    ";
    }

  };

})();
