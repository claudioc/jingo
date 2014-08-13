
var Renderer = require("../../lib/renderer");

describe ("Renderer", function() {

  it ("should render bracket tags1", function() {
    var text = "a [[Foo]] b";
    expect(Renderer.render(text)).to.be.equal("<p>a <a class=\"internal\" href=\"/wiki/Foo\">Foo</a> b</p>\n");
  });

  it ("should render bracket tags2", function() {
    var text = "a [[Foo]][[Foo]][[Foo]] b";
    expect(Renderer.render(text)).to.be.equal("<p>a <a class=\"internal\" href=\"/wiki/Foo\">Foo</a><a class=\"internal\" href=\"/wiki/Foo\">Foo</a><a class=\"internal\" href=\"/wiki/Foo\">Foo</a> b</p>\n");
  });

  it ("should render bracket tags3", function() {
    var text = "a [[Foo Bar]] b";
    expect(Renderer.render(text)).to.be.equal("<p>a <a class=\"internal\" href=\"/wiki/Foo-Bar\">Foo Bar</a> b</p>\n");
  });

  it ("should render bracket tags4", function() {
    var text = "a [[Foo]][[Bar]] b";
    expect(Renderer.render(text)).to.be.equal("<p>a <a class=\"internal\" href=\"/wiki/Foo\">Foo</a><a class=\"internal\" href=\"/wiki/Bar\">Bar</a> b</p>\n");
  });

  it ("should render bracket tags5", function() {
    var text = "a [[Foo]] [[Bar]] b";
    expect(Renderer.render(text)).to.be.equal("<p>a <a class=\"internal\" href=\"/wiki/Foo\">Foo</a> <a class=\"internal\" href=\"/wiki/Bar\">Bar</a> b</p>\n");
  });

  it ("should render bracket tags6", function() {
    var text = "a [[Il marito di Foo|Foobar]] [[Bar]] b";
    expect(Renderer.render(text)).to.be.equal("<p>a <a class=\"internal\" href=\"/wiki/Foobar\">Il marito di Foo</a> <a class=\"internal\" href=\"/wiki/Bar\">Bar</a> b</p>\n");
  });

  it ("should render bracket tags7", function() {
    var text = "a [[Foo / Bar]] b";
    expect(Renderer.render(text)).to.be.equal("<p>a <a class=\"internal\" href=\"/wiki/Foo---Bar\">Foo / Bar</a> b</p>\n");
  });


});
