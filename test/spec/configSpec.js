/* eslint-env mocha */
/* global expect */

var yaml = require('js-yaml')

var configKeys = ['application', 'authentication', 'features', 'server', 'authorization', 'pages', 'customizations']
var Config = require('../../lib/config')

describe('Config', function () {
  Config.setup()

  afterEach(function () {
    // Unset the config
    Config.setup()
  })

  it('should render a valid config in YAML', function () {
    var def = yaml.load(Config.sample())

    expect(Object.keys(def).join('')).to.equal(configKeys.join(''))

    expect(def.application.title).to.equal('Jingo')
    expect(def.application.repository).to.equal('')
    expect(def.application.docSubdir).to.equal('')
    expect(def.application.remote).to.equal('')
    expect(def.application.pushInterval).to.equal(30)
    expect(def.application.secret).to.equal('change me')
    expect(def.application.git).to.equal('git')
    expect(def.application.skipGitCheck).to.be.false
    expect(def.application.loggingMode).to.equal(1)
    expect(def.application.pedanticMarkdown).to.be.true
    expect(def.application.gfmBreaks).to.be.true
    expect(def.application.staticWhitelist).to.equal('/\\.png$/i, /\\.jpg$/i, /\\.gif$/i')
    expect(def.application.proxyPath).to.equal('')

    expect(def.features.codemirror).to.be.true
    expect(def.features.markitup).to.be.false

    expect(def.server.hostname).to.equal('localhost')
    expect(def.server.port).to.equal(6067)
    expect(def.server.localOnly).to.be.false
    expect(def.server.baseUrl).to.equal('')

    expect(def.authorization.anonRead).to.be.true
    expect(def.authorization.validMatches).to.equal('.+')
    expect(def.authorization.emptyEmailMatches).to.be.false

    expect(def.authentication.google.enabled).to.be.true
    expect(def.authentication.local.enabled).to.be.false
    expect(def.authentication.github.enabled).to.be.false
  })

  it('should get the config as a whole', function () {
    var c
    try {
      c = Config.get()
    } catch (e) {
      c = 'boom'
    }

    expect(c).to.equal('boom')

    Config.setup({
      test: 23
    })

    expect(Config.get()).to.be.an('object')
  })

  it('should get a variable from the config', function () {
    Config.setup({
      test: 23,
      test1: {
        test2: 44
      }
    })

    expect(Config.get('test')).to.equal(23)
    expect(Config.get('test1').test2).to.equal(44)
  })

  it('should get the proxyPath when not set', function () {
    expect(Config.getProxyPath()).to.equal('')
  })

  it('should get the proxyPath when set', function () {
    Config.setup({
      application: {
        proxyPath: 'foobar'
      }
    })

    expect(Config.getProxyPath()).to.equal('/foobar')
  })

  it('should not get a variable from the ungettable config', function () {
    expect(function () {
      Config.get('test')
    }).to.throw()
  })

  it('should get a variable from the default if the config is not set up', function () {
    expect(Config.get('application', true).title).to.equal('Jingo')
  })
})
