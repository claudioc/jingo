var chai = require("chai");
var expect = chai.expect;

var Tools = require("../../lib/tools");

describe ("Tools", function() {

  it ("should test for being a title", function() {
    expect(Tools.isTitle()).to.equal(false);
    expect(Tools.isTitle("test")).to.equal(false);
    expect(Tools.isTitle("#test")).to.equal(true);
  });

  it ("should test for the presence of a title", function() {
    expect(Tools.hasTitle()).to.equal(false);
    expect(Tools.hasTitle("test")).to.equal(false);
    expect(Tools.hasTitle("#test")).to.equal(true);
    expect(Tools.hasTitle("#test\nhello")).to.equal(true);
    expect(Tools.hasTitle("\n#test\nhello")).to.equal(false);
  });

  it ("should get the title of a page from content", function() {
    expect(Tools.getPageTitle("bazinga", "somepage")).to.equal("somepage");
    expect(Tools.getPageTitle("#test\nbazinga", "somepage")).to.equal("test");
  });

  it ("should get the content of a page", function() {
    expect(Tools.getContent("bazinga")).to.equal("bazinga");
    expect(Tools.getContent("#bazinga\nzot")).to.equal("\nzot");
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
