var Tools = require("../../lib/tools");

describe ("Tools", function() {

  it ("should hashify a string with sha1", function() {
    expect(Tools.hashify("tornado")).to.equal("474446ad24ee5490f8e879012ee2a855a7c7bf56");
  });

  it ("should not authorize empty email", function() {
    expect(Tools.isAuthorized("       ")).to.equal(false);
    expect(Tools.isAuthorized("")).to.equal(false);
    expect(Tools.isAuthorized()).to.equal(false);
    expect(Tools.isAuthorized(null)).to.equal(false);
  });

  it ("should authorize with empty pattern", function() {
    expect(Tools.isAuthorized("claudio.cicali@gmail.com")).to.equal(true);
    expect(Tools.isAuthorized("claudio.cicali@gmail.com", null)).to.equal(true);
    expect(Tools.isAuthorized("claudio.cicali@gmail.com", "")).to.equal(true);
  });

  it ("should not authorize if email doesn't seems an email", function() {
    expect(Tools.isAuthorized("zumpa",".*")).to.equal(false);
    expect(Tools.isAuthorized("zumpa@",".*")).to.equal(false);
    expect(Tools.isAuthorized("zumpa@.com",".*")).to.equal(false);
    expect(Tools.isAuthorized("@zumpa",".*")).to.equal(false);
  });

  it ("should not authorize if the pattern is an invalid regexp", function() {
    expect(Tools.isAuthorized("zumpa@zot.com","*")).to.equal(false);
  });

  it ("should not authorize if email doesn't match a pattern", function() {
    expect(Tools.isAuthorized("zumpa@zot.com","saaa.*")).to.equal(false);
    expect(Tools.isAuthorized("zumpa@zot.com",".*@google\.com")).to.equal(false);
    expect(Tools.isAuthorized("zumpa@zot.com",".*@zot\.it")).to.equal(false);
  });

  it ("should authorize if email matches a pattern", function() {
    expect(Tools.isAuthorized("zumpa@zot.com",".*")).to.equal(true);
    expect(Tools.isAuthorized("zumpa@zot.com","zumpa.*")).to.equal(true);
    expect(Tools.isAuthorized("zumpa@zot.com",".*@zot.com,.*@zot.it")).to.equal(true);
    expect(Tools.isAuthorized("zumpa@zot.com","google.com,.*@zot.com,.*@zot.it")).to.equal(true);
    expect(Tools.isAuthorized("zumpa@zot.com","google.com,.*@zot.org        ,  .*@zot.com")).to.equal(true);
  });

});
