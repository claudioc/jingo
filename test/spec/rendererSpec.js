var chai = require("chai");
var expect = chai.expect;

var Renderer = require("../../lib/renderer");

describe ("Renderer", function() {

  it ("should render bracket tags", function() {

    var text = "a [[Foo]][[Bar]] b";

    expect(Renderer.compileMarkup(text)).to.be.a("<p>a <a class=\"internal\" href=\"/Foo\">Foo</a><a class=\"internal\" href=\"/Bar\">Bar</a> b</p>");
  });


});
