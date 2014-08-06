var chai = require("chai");
var expect = chai.expect;

var Namer = require("../../lib/namer");

describe.only ("Namer", function() {

  beforeEach(function () {
    Namer.configOverride();
  });

  describe("configOverride method", function() {

    it ("should override some config parameters", function() {
      expect(Namer.getCurrentConfig().title.asciiOnly).to.be.false;
      Namer.configOverride({
        title: {
          asciiOnly: true
        }
      });
      expect(Namer.getCurrentConfig().title.asciiOnly).to.be.true;
    });

  });

  describe("wikify method", function() {

    it ("should wikify a string with the default settings", function() {

      expect(Namer.wikify("34")).to.equal("34");
      expect(Namer.wikify("")).to.equal("");
      expect(Namer.wikify("    ")).to.equal("");
      expect(Namer.wikify("hello_Sidebar")).to.equal("hello_Sidebar");
      expect(Namer.wikify("_Sidebar")).to.equal("_Sidebar");
      expect(Namer.wikify("nell'aria")).to.equal("nell'aria");
      expect(Namer.wikify("lento  lento   lentissimo")).to.equal("lento  lento   lentissimo");
      expect(Namer.wikify("nell - aria")).to.equal("nell - aria");
      expect(Namer.wikify(" nell - aria ")).to.equal("nell - aria");
      expect(Namer.wikify("Caffé")).to.equal("Caffé");
      expect(Namer.wikify("Caffé corretto!")).to.equal("Caffé corretto!");
      expect(Namer.wikify("Caff<p>e</p> senza schiuma")).to.equal("Caff<p>e</p> senza schiuma");
      expect(Namer.wikify("Per favore: nessun, dico; E un punto...")).to.equal("Per favore: nessun, dico; E un punto...");
      expect(Namer.wikify("prova.md")).to.equal("prova.md");
    });
      
    it ("should wikify a string with asciiOnly true", function() {
      Namer.configOverride({
        title: {
          asciiOnly: true
        }
      });
      expect(Namer.wikify("34")).to.equal("34");
      expect(Namer.wikify("")).to.equal("");
      expect(Namer.wikify("    ")).to.equal("");
      expect(Namer.wikify("hello_Sidebar")).to.equal("hello_Sidebar");
      expect(Namer.wikify("_Sidebar")).to.equal("_Sidebar");
      expect(Namer.wikify("nell'aria")).to.equal("nellaria");
      expect(Namer.wikify("lento  lento   lentissimo")).to.equal("lento  lento   lentissimo");
      expect(Namer.wikify("nell - aria")).to.equal("nell - aria");
      expect(Namer.wikify(" nell - aria ")).to.equal("nell - aria");
      expect(Namer.wikify("Caffé")).to.equal("Caffe");
      expect(Namer.wikify("Caffé corretto!")).to.equal("Caffe corretto");
      expect(Namer.wikify("Caff<p>e</p> senza schiuma")).to.equal("Caffpep senza schiuma");
      expect(Namer.wikify("Per favore: nessun, dico; E un punto...")).to.equal("Per favore nessun dico E un punto");
      expect(Namer.wikify("prova.md")).to.equal("provamd");

    });

    it ("should wikify a string with lowercase true", function() {
      Namer.configOverride({
        title: {
          lowercase: true
        }
      });
      expect(Namer.wikify("34")).to.equal("34");
      expect(Namer.wikify("")).to.equal("");
      expect(Namer.wikify("    ")).to.equal("");
      expect(Namer.wikify("hello_sidebar")).to.equal("hello_sidebar");
      expect(Namer.wikify("_sidebar")).to.equal("_sidebar");
      expect(Namer.wikify("nell'aria")).to.equal("nell'aria");
      expect(Namer.wikify("lento  lento   lentissimo")).to.equal("lento  lento   lentissimo");
      expect(Namer.wikify("nell - aria")).to.equal("nell - aria");
      expect(Namer.wikify(" nell - aria ")).to.equal("nell - aria");
      expect(Namer.wikify("Caffé")).to.equal("caffé");
      expect(Namer.wikify("Caffé corretto!")).to.equal("caffé corretto!");
      expect(Namer.wikify("Caff<p>e</p> senza schiuma")).to.equal("caff<p>e</p> senza schiuma");
      expect(Namer.wikify("Per favore: nessun, dico; E un punto...")).to.equal("per favore: nessun, dico; e un punto...");
      expect(Namer.wikify("prova.md")).to.equal("prova.md");
      expect(Namer.wikify("È@@@É")).to.equal("è@@@é");
    });

    it ("should wikify a string with replaceWs true", function() {
      Namer.configOverride({
        title: {
          replaceWs: true
        }
      });
      expect(Namer.wikify("34")).to.equal("34");
      expect(Namer.wikify("")).to.equal("");
      expect(Namer.wikify("    ")).to.equal("");
      expect(Namer.wikify("hello_sidebar")).to.equal("hello_sidebar");
      expect(Namer.wikify("_sidebar")).to.equal("_sidebar");
      expect(Namer.wikify("nell'aria")).to.equal("nell'aria");
      expect(Namer.wikify("lento  lento   lentissimo")).to.equal("lento--lento---lentissimo");
      expect(Namer.wikify("nell - aria")).to.equal("nell---aria");
      expect(Namer.wikify(" nell - aria ")).to.equal("nell---aria");
      expect(Namer.wikify("Caffé")).to.equal("Caffé");
      expect(Namer.wikify("Caffé corretto!")).to.equal("Caffé-corretto!");
      expect(Namer.wikify("Caff<p>e</p> senza schiuma")).to.equal("Caff<p>e<-p>-senza-schiuma");
      expect(Namer.wikify("Per favore: nessun, dico; E un punto...")).to.equal("Per-favore:-nessun,-dico;-E-un-punto...");
      expect(Namer.wikify("prova.md")).to.equal("prova.md");
      expect(Namer.wikify("È@@@É")).to.equal("È@@@É");
    });

    it ("should wikify a string with the defaults of Jingo < 1.0", function() {
      Namer.configOverride({
        title: {
          asciiOnly: true,
          replaceWs: true,
          lowercase: true
        }
      });
      expect(Namer.wikify("_Sidebar")).to.equal("_sidebar");
      expect(Namer.wikify("_FOOTER")).to.equal("_footer");
      expect(Namer.wikify("CoffeE")).to.equal("coffee");
      expect(Namer.wikify("nell'aria")).to.equal("nellaria");
      expect(Namer.wikify("lento  lento   lentissimo")).to.equal("lento--lento---lentissimo");
      expect(Namer.wikify("nell - aria")).to.equal("nell---aria");
      expect(Namer.wikify(" nell - aria ")).to.equal("nell---aria");
      expect(Namer.wikify("Caffé")).to.equal("caffe");
      expect(Namer.wikify("Caffé corretto!")).to.equal("caffe-corretto");
      expect(Namer.wikify("Caff<p>e</p> senza schiuma")).to.equal("caffpep-senza-schiuma");
      expect(Namer.wikify("Per favore: nessun, dico; E un punto...")).to.equal("per-favore-nessun-dico-e-un-punto");
    });
  });

  describe("unwikify method", function() {

    it ("should unwikify a string with the default settings", function() {

      expect(Namer.unwikify("34")).to.equal("34");
      expect(Namer.unwikify("carne-fresca")).to.equal("carne-fresca");
      expect(Namer.unwikify("carne fresca")).to.equal("carne fresca");
      expect(Namer.unwikify("Carne Fresca")).to.equal("Carne Fresca");
    });

    it ("should unwikify a string with lowercase true", function() {

      Namer.configOverride({
        title: {
          lowercase: true
        }
      });

      expect(Namer.unwikify("34")).to.equal("34");
      expect(Namer.unwikify("disastro")).to.equal("Disastro");
      expect(Namer.unwikify("carne-fresca")).to.equal("Carne-Fresca");
      expect(Namer.unwikify("carne fresca")).to.equal("Carne Fresca");
      expect(Namer.unwikify("Carne Fresca")).to.equal("Carne Fresca");
    });

    it ("should unwikify a string with replaceWs true", function() {

      Namer.configOverride({
        title: {
          replaceWs: true
        }
      });

      expect(Namer.unwikify("34")).to.equal("34");
      expect(Namer.unwikify("disastro")).to.equal("disastro");
      expect(Namer.unwikify("carne-fresca")).to.equal("carne fresca");
      expect(Namer.unwikify("carne fresca")).to.equal("carne fresca");
      expect(Namer.unwikify("Carne Fresca")).to.equal("Carne Fresca");
    });

    it ("should unwikify a string with the default for Jingo < 1.0", function() {

      Namer.configOverride({
        title: {
          lowercase: true,
          replaceWs: true
        }
      });

      expect(Namer.unwikify("34")).to.equal("34");
      expect(Namer.unwikify("disastro")).to.equal("Disastro");
      expect(Namer.unwikify("carne-fresca")).to.equal("Carne Fresca");
      expect(Namer.unwikify("carne fresca")).to.equal("Carne Fresca");
      expect(Namer.unwikify("Carne Fresca")).to.equal("Carne Fresca");
    });
  });
});