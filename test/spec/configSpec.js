var yaml   = require('js-yaml');

var configKeys = ['application', 'authentication', 'features', 'server', 'authorization', 'pages', 'customizations'];
var Config = require("../../lib/config");

describe ("Config", function() {

  beforeEach(function() {
    Config.setup();
  });  

  it ("should render a valid config in YAML", function() {

    var def = yaml.load(Config.sample());

    expect(Object.keys(def).join('')).to.equal(configKeys.join(''));

    expect(def.application.title).to.equal('Jingo');
    expect(def.application.repository).to.equal('');
    expect(def.application.docSubdir).to.equal('');
    expect(def.application.remote).to.equal('');
    expect(def.application.pushInterval).to.equal(30);
    expect(def.application.secret).to.equal('change me');

    expect(def.features.codemirror).to.be.true;
    expect(def.features.markitup).to.be.false;

    expect(def.server.hostname).to.equal('localhost');
    expect(def.server.port).to.equal(6067);
    expect(def.server.localOnly).to.be.false;

    expect(def.authorization.anonRead).to.be.true;
    expect(def.authorization.validMatches).to.equal('.+');

    expect(def.authentication.google.enabled).to.be.true;
    expect(def.authentication.alone.enabled).to.be.false;
    expect(def.authentication.alone.username).to.equal('');
    expect(def.authentication.alone.passwordHash).to.equal('');
    expect(def.authentication.alone.email).to.equal('');
  });

  it ("should get the config as a whole", function() {

    var c = Config.get();

    expect(c).to.be.an("undefined");

    Config.setup({
      test: 23
    });

    expect(Config.get()).to.be.an("object");
  });

  it ("should get a variable from the config", function() {

    Config.setup({
      test: 23,
      test1: {
        test2: 44
      }
    });

    expect(Config.get("test")).to.equal(23);
    expect(Config.get("test1").test2).to.equal(44);
  });

});