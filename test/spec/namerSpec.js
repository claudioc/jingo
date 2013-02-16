var chai = require("chai");
var expect = chai.expect;

var Namer = require("../../lib/namer");

describe ("Namer", function() {

  it ("should normalize a string", function() {
    expect(Namer.normalize("34")).to.equal("34");
    expect(Namer.normalize("  ")).to.equal("--");
    expect(Namer.normalize("hello_Sidebar")).to.equal("hello_sidebar");
    expect(Namer.normalize("_Sidebar")).to.equal("_sidebar");
    expect(Namer.normalize("_FOOTER")).to.equal("_footer");
    expect(Namer.normalize("CoffeE")).to.equal("coffee");
    expect(Namer.normalize("Caffé")).to.equal("caffe");
    expect(Namer.normalize("Caffé corretto!")).to.equal("caffe-corretto");
    expect(Namer.normalize("Caff<p>e</p> senza schiuma")).to.equal("caffpe-p-senza-schiuma");
    expect(Namer.normalize("Per favore: nessun, dico; E un punto...")).to.equal("per-favore-nessun-dico-e-un-punto");
  });

});