var fs = require('fs')
var yaml = require('js-yaml')
var _ = require('lodash')

module.exports = (function () {
  var config
  var error = ''

  return {

    load: function (filename) {
      this.setup(yaml.load(fs.readFileSync(filename).toString()))

      if (!config.application || !config.server) {
        error = 'Missing `application` or `server` config section.'
        return false
      }

      // Find any alien configuration options section
      var aliens = _.difference(Object.keys(config), Object.keys(this.defaults))
      if (aliens.length > 0) {
        error = 'Unrecognized section name(s) ' + aliens.join(',')
        return false
      }

      // Find any alien configuration options section name
      var keys = Object.keys(this.defaults)
      for (var i = 0; i < keys.length; i++) {
        if (typeof config[keys[i]] === 'undefined') {
          continue
        }
        aliens = _.difference(Object.keys(config[keys[i]]), Object.keys(this.defaults[keys[i]]))
        if (aliens.length > 0) {
          error = 'Unrecognized configuration option(s) ' + aliens.join(',') + ' in section ' + keys[i]
          return false
        }
      }

      return true
    },

    getError: function () {
      return error
    },

    defaults: {

      application: {
        title: 'Jingo',
        repository: '',
        docSubdir: '',
        remote: '',
        pushInterval: 30,
        secret: 'change me',
        git: 'git',
        skipGitCheck: false,
        loggingMode: 1,
        pedanticMarkdown: true,
        gfmBreaks: true,
        staticWhitelist: '/\\.png$/i, /\\.jpg$/i, /\\.gif$/i',
        proxyPath: ''
      },

      authentication: {
        google: {
          enabled: true,
          clientId: 'replace me with the real value',
          clientSecret: 'replace me with the real value',
          redirectURL: ''
        },
        github: {
          enabled: false,
          clientId: 'replace me with the real value',
          clientSecret: 'replace me with the real value',
          redirectURL: ''
        },
        ldap: {
          enabled: false,
          url: 'ldap://example.org:389',
          bindDn: '',
          bindCredentials: '',
          searchBase: 'ou=people,dc=example,dc=org',
          searchFilter: '(uid={{username}})',
          searchAttributes: ''
        },
        // @deprecated, use local with just an user
        alone: {
          enabled: false,
          username: '',
          passwordHash: '',
          email: ''
        },
        local: {
          enabled: false,
          accounts: [{
            username: '',
            passwordHash: '',
            email: ''
          }]
        }
      },

      features: {
        markitup: false,
        codemirror: true
      },

      server: {
        hostname: 'localhost',
        port: process.env.PORT || 6067,
        localOnly: false,
        baseUrl: '',
        // Since Jingo 1.6
        CORS: {
          enabled: false,
          allowedOrigin: '*'
        }
      },

      authorization: {
        anonRead: true,
        validMatches: '.+',
        // Breaking changes in Jingo 1.5 (when this parameter has been added): the default for new servers is to NOT allow empty emails to validate
        emptyEmailMatches: false
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
        index: 'Home',
        title: {
          fromFilename: true,
          fromContent: false,
          asciiOnly: false,
          lowercase: false
        },
        itemsPerPage: 10
      },

      customizations: {
        sidebar: '_sidebar.md',
        footer: '_footer.md',
        style: '_style.css',
        script: '_script.js'
      }
    },

    // Ensure that all the key will have a sane default value
    validate: function () {
      config.application = _.extend({}, this.defaults.application, config.application)
      config.application.pushInterval = (parseInt(config.application.pushInterval, 10) | 0)

      config.authentication = _.extend({}, this.defaults.authentication, config.authentication)

      if (!config.authentication.google.enabled &&
        !config.authentication.github.enabled &&
        !config.authentication.ldap.enabled &&
        !config.authentication.alone.enabled &&
        !config.authentication.local.enabled
      ) {
        error = 'No authentication method provided.'
        return false
      }

      if (config.authentication.google.enabled && (!config.authentication.google.clientId || !config.authentication.google.clientSecret)) {
        error = 'Invalid or missing authentication credentials for Google (clientId and/or clientSecret).'
        return false
      }

      if (config.authentication.github.enabled && (!config.authentication.github.clientId || !config.authentication.github.clientSecret)) {
        error = 'Invalid or missing authentication credentials for Github (clientId and/or clientSecret).'
        return false
      }

      if (config.authentication.ldap.enabled && (!config.authentication.ldap.url || !config.authentication.ldap.searchBase || !config.authentication.ldap.searchFilter)) {
        error = 'Invalid or missing config for LDAP (url and/or searchBase and/or searchFilter).'
        return false
      }

      if (config.authentication.alone.enabled && config.authentication.local.enabled) {
        error = 'Alone and Local authentication cannot be used at the same time'
        return false
      }

      if (config.authentication.alone.enabled) {
        console.warn('Deprecation: Alone authentication is deprecated and should be changed with Local.')
      }

      config.features = _.extend({}, this.defaults.features, config.features)

      // For backward compatibility with version < 0.5, we set markitup as the
      // default rich editor. For new installations, the default is codemirror
      if (!config.features.markitup && !config.features.codemirror) {
        config.features.markitup = true
      }

      if (config.features.markitup && config.features.codemirror) {
        config.features.markitup = false
      }

      config.server = _.extend({}, this.defaults.server, config.server)

      config.authorization = _.extend({}, this.defaults.authorization, config.authorization)

      if (config.pages) {
        config.pages = _.extend({}, this.defaults.pages, config.pages)

        if (!config.pages.title.fromFilename && !config.pages.title.fromContent) {
          config.pages.title.fromFilename = true
        }

        if (config.pages.title.fromFilename && config.pages.title.fromContent) {
          config.pages.title.fromFilename = true
        }
      } else {
        config.pages = _.extend({}, this.defaults.pages, config.pages)
        // If the pages config key is not present, we desume that the user has
        // upgraded Jingo but not the config file so we need to maintain the "old"
        // behavior
        config.pages.index = 'home'
        config.pages.title.fromFilename = false
        config.pages.title.fromContent = true
        config.pages.title.asciiOnly = true
      }

      config.customizations = _.extend({}, this.defaults.customizations, config.customizations)

      return true
    },

    get: function (key, useDefaults) {
      if (!config && !useDefaults) {
        throw new Error('The configuration has not been read and cannot be `get`')
      }

      if (!config && useDefaults) {
        return this.defaults[key]
      }

      if (typeof key === 'undefined') {
        return config
      }

      return config[key]
    },

    getProxyPath: function (override) {
      var path = (override || this.get('application', true).proxyPath).trim()

      // @TODO make sure the path is something that makes sense (?)
      if (path.length === 0 || path === '/') {
        return ''
      }

      if (path.charAt(0) !== '/') {
        path = '/' + path
      }

      return path
    },

    // Manually set the config to the setup value
    setup: function (setup) {
      config = setup
    },

    // Dumps a sample config file
    sample: function () {
      var defs = _.clone(this.defaults)

      // Removes deprecated auth method
      delete defs.authentication.alone

      return '---\n' +
        '# Configuration sample file for Jingo (YAML)\n' +
        yaml.dump(defs)
    }
  }
}())
