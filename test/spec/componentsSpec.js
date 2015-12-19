
var Components = require("../../lib/components");

describe ("Components", function() {

  it ("should not find any component", function() {
    expect(Components.hasSidebar()).to.be.false;
    expect(Components.hasFooter()).to.be.false;
    expect(Components.hasCustomStyle()).to.be.false;
    expect(Components.hasCustomScript()).to.be.false;
  });

  it ("should not fetch any component", function() {
    expect(Components.customStyle()).to.be.a("null");
    expect(Components.customScript()).to.be.a("null");
  });

});