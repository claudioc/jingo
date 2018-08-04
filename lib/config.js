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
        // MOD Allow unlimited keys in aliases section as long as they have string values
        if (keys[i] === 'aliases') {
          for (var k in config['aliases']) {
            if (typeof config['aliases'][k] !== 'string') {
              error = 'Value for configuration field ' + k + ' in section aliases must be a string.'
              return false
            }
          }
        } else {
          aliens = _.difference(Object.keys(config[keys[i]]), Object.keys(this.defaults[keys[i]]))
          if (aliens.length > 0) {
            error = 'Unrecognized configuration option(s) ' + aliens.join(',') + ' in section ' + keys[i]
            return false
          }
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
        logo: '',
        favicon: '',
        repository: '',
        docSubdir: '',
        mediaSubdir: '', // MOD name of sub-directory to use for additional public accessible media
        serveLocal: false, // MOD enable serving of files from local server rather than a CDN
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
        codemirror: true,
        gravatar: true,
        pageSummaries: true, // MOD enable initial paragraph to be returned in list of documents
        caseSensitiveAliases: false // MOD enable case sensitivity in redirection
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
      },

      // MOD comma delineated strings of css and js files to include in assets on page load 
      assets: {
        css: '',
        js: ''
      },
      
      // MOD map of alias terms and the page each redirects to
      aliases: {
        introduction: 'Home.md'
      },

      // MOD configuration of columns in layout.pug
      layout: {
        sidebarWidth: 2,
        mainWidth: 8,
        footerWidth: 8,
        sidebarMobile: true
      },

      // MOD various types of RegExp to use for redaction of content
      redaction: {
        enabled: false,
        hiddenPage: '^<!(--\\s?Hidden[\\s\\S]*?--)>',
        privateContent: '<!--\\s?Private([\\s\\S]*?)-->',
        futureContent: '<!(--\\s\\d{4}\\.\\d{2}\\.\\d{2}[\\s\\S]*?--)>([\\s\\S]*?)<!(--\\sEnd\\s--)>',
        sectionContent: [{
          expression: '<!(--\\schapter-\\d+[\\s\\S]*?--)>([\\s\\S]*?)<!(--\\sEnd\\s--)>',
          current: 0
        }]
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

      // As of Jingo 1.8, Markitup is not an option anymore
      // For backward compatibility with version < 0.5, we set markitup as the
      // default rich editor. For new installations, the default is codemirror
      if (!config.features.markitup && !config.features.codemirror) {
        config.features.markitup = true
      }

      if (config.features.markitup && config.features.codemirror) {
        config.features.markitup = false
      }

      // As of Jingo 1.8, Markitup is not an option anymore
      if (config.features.markitup) {
        error = 'Starting with Jingo 1.8, Markitup has been removed as its own Markdown editor.\nPlease use codemirror or use an older version of Jingo'
        return false
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

      // MOD extend and validate assets
      config.assets = _.extend({}, this.defaults.assets, config.assets)
      var import_assets = config.assets.css
      if (import_assets){
        import_assets += ', '
      }
      import_assets += config.assets.js
      if (import_assets && !config.application.mediaSubdir){
        error = 'Use of assets ' + import_assets + ' requires the specification of a mediaSubdir.'
        return false
      }
      
      // MOD validate layout fields
      config.layout = _.extend({}, this.defaults.layout, config.layout)
      config.layout.sidebarWidth = parseInt(config.layout.sidebarWidth, 10)
      config.layout.sidebarWidth = config.layout.sidebarWidth < 11 ? config.layout.sidebarWidth : 3
      config.layout.sidebarWidth = config.layout.sidebarWidth >= 0 ? config.layout.sidebarWidth : 3
      config.layout.mainWidth = parseInt(config.layout.mainWidth, 10)
      config.layout.mainWidth = config.layout.mainWidth < 13 ? config.layout.mainWidth : 9
      config.layout.mainWidth = config.layout.mainWidth > 1 ? config.layout.mainWidth : 9
      if (config.layout.sidebarWidth + config.layout.mainWidth > 12) {
        error = 'Total width of sidebarWidth + mainWidth must not exceed 12.'
        return false
      }
      config.layout.footerWidth = parseInt(config.layout.footerWidth, 10)
      config.layout.footerWidth = config.layout.footerWidth < 13 ? config.layout.footerWidth : 9
      config.layout.footerWidth = config.layout.footerWidth > 0 ? config.layout.footerWidth : 9

      // MOD extend aliases
      config.aliases = _.extend({}, this.defaults.aliases, config.aliases)

      // MOD validate redaction fields
      config.redaction = _.extend({}, this.defaults.redaction, config.redaction)
      var regexFields = [ 'hiddenPage', 'privateContent', 'futureContent' ]
      for (var i = 0; i < regexFields.length; i++) {
        var regexValue = config.redaction[regexFields[i]]
        if (regexValue) {
          try {
            var testRegex = RegExp(regexValue)
          } catch (e) {
            error = 'Value for configuration field ' + regexFields[i] + ' in section redaction must be a valid RegExp string.'
            return false
          }
        }
      }
      // MOD validate sequential section fields
      if (config.redaction.sectionContent) {
        for (var i = 0; i < config.redaction.sectionContent.length; i++) {
          var latestSection = config.redaction.sectionContent[i]
          var errorPrefix = 'Value for configuration field sectionContent item [' + i.toString() + '] key expression in section redaction'
          if (latestSection.expression) {
            try {
              var testRegex = RegExp(latestSection.expression)
            } catch (e) {
              error = errorPrefix + ' must be a valid RegExp string.'
              return false
            }
            if (!(/\\d\+/.test(latestSection.expression))) {
              error = errorPrefix + ' must contain the term \\d+.'
              return false
            }
            if (typeof (latestSection.current) !== 'number') {
              error = errorPrefix + ' requires a current be included.'
              return false
            }
          }
        }
      }

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
