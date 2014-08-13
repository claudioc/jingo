var namer = require("../../lib/namer");

describe("namer", function() {

  beforeEach(function () {
    namer.configOverride();
  });

  describe("configOverride method", function() {

    it ("should override some config parameters", function() {
      expect(namer.getConfig().pages.title.asciiOnly).to.be.false;
      namer.configOverride({
        pages: {
          title: {
            asciiOnly: true
          }
        }
      });
      expect(namer.getConfig().pages.title.asciiOnly).to.be.true;
    });

  });

  describe("wikify method", function() {

    it ("should wikify a string with the default settings", function() {

      expect(namer.wikify("34")).to.equal("34");
      expect(namer.wikify("")).to.equal("");
      expect(namer.wikify("    ")).to.equal("");
      expect(namer.wikify("hello_Sidebar")).to.equal("hello_Sidebar");
      expect(namer.wikify("_Sidebar")).to.equal("_Sidebar");
      expect(namer.wikify("nell'aria")).to.equal("nell'aria");
      expect(namer.wikify("lento  lento   lentissimo")).to.equal("lento--lento---lentissimo");
      expect(namer.wikify("nell - aria")).to.equal("nell---aria");
      expect(namer.wikify(" nell - aria ")).to.equal("nell---aria");
      expect(namer.wikify("Caffé")).to.equal("Caffé");
      expect(namer.wikify("Caffé corretto!")).to.equal("Caffé-corretto!");
      expect(namer.wikify("Caff<p>e</p> senza schiuma")).to.equal("Caffpe-p-senza-schiuma");
      expect(namer.wikify("Per favore: nessun, dico; E un punto...")).to.equal("Per-favore:-nessun,-dico;-E-un-punto...");
      expect(namer.wikify("prova.md")).to.equal("prova.md");
    });
      
    it ("should wikify a string with asciiOnly true", function() {
      namer.configOverride({
        pages: {
          title: {
            asciiOnly: true
          }
        }
      });

      expect(namer.wikify("hello_Sidebar")).to.equal("hello_Sidebar");
      expect(namer.wikify("_Sidebar")).to.equal("_Sidebar");
      expect(namer.wikify("nell'aria")).to.equal("nellaria");
      expect(namer.wikify("Caffé")).to.equal("Caffe");
      expect(namer.wikify("Caffé corretto!")).to.equal("Caffe-corretto");
      expect(namer.wikify("Per favore: nessun, dico; E un punto...")).to.equal("Per-favore-nessun-dico-E-un-punto");
      expect(namer.wikify("prova.md")).to.equal("provamd");

    });

    it ("should wikify a string with lowercase true", function() {
      namer.configOverride({
        pages: {
          title: {
            lowercase: true
          }
        }
      });
      expect(namer.wikify("hello_sidebar")).to.equal("hello_sidebar");
      expect(namer.wikify("_sidebar")).to.equal("_sidebar");
      expect(namer.wikify("nell'aria")).to.equal("nell'aria");
      expect(namer.wikify("Caffé")).to.equal("caffé");
      expect(namer.wikify("Caffé corretto!")).to.equal("caffé-corretto!");
      expect(namer.wikify("È@@@É")).to.equal("è@@@é");
    });

    it ("should wikify a string with the defaults of Jingo < 1.0", function() {
      namer.configOverride({
        pages: {
          title: {
            asciiOnly: true,
            replaceWs: true,
            lowercase: true
          }
        }
      });
      expect(namer.wikify("_Sidebar")).to.equal("_sidebar");
      expect(namer.wikify("_FOOTER")).to.equal("_footer");
      expect(namer.wikify("CoffeE")).to.equal("coffee");
      expect(namer.wikify("nell'aria")).to.equal("nellaria");
      expect(namer.wikify("lento  lento   lentissimo")).to.equal("lento--lento---lentissimo");
      expect(namer.wikify("nell - aria")).to.equal("nell---aria");
      expect(namer.wikify(" nell - aria ")).to.equal("nell---aria");
      expect(namer.wikify("Caffé")).to.equal("caffe");
      expect(namer.wikify("Caffé corretto!")).to.equal("caffe-corretto");
      expect(namer.wikify("Caff<p>e</p> senza schiuma")).to.equal("caffpe-p-senza-schiuma");
      expect(namer.wikify("Per favore: nessun, dico; E un punto...")).to.equal("per-favore-nessun-dico-e-un-punto");
    });
  });

  describe("unwikify method", function() {

    it ("should unwikify a string with the default settings", function() {

      expect(namer.unwikify("34")).to.equal("34");
      expect(namer.unwikify("carne-fresca")).to.equal("carne fresca");
      expect(namer.unwikify("carne fresca")).to.equal("carne fresca");
      expect(namer.unwikify("Carne Fresca")).to.equal("Carne Fresca");
    });

    it ("should unwikify a string with lowercase true", function() {

      namer.configOverride({
        pages: {
          title: {
            lowercase: true
          }
        }
      });

      expect(namer.unwikify("34")).to.equal("34");
      expect(namer.unwikify("disastro")).to.equal("Disastro");
      expect(namer.unwikify("carne-fresca")).to.equal("Carne Fresca");
      expect(namer.unwikify("carne fresca")).to.equal("Carne Fresca");
      expect(namer.unwikify("Carne Fresca")).to.equal("Carne Fresca");
    });

    it ("should unwikify a string with replaceWs true", function() {

      namer.configOverride({
        pages: {
          title: {
            replaceWs: true
          }
        }
      });

      expect(namer.unwikify("34")).to.equal("34");
      expect(namer.unwikify("disastro")).to.equal("disastro");
      expect(namer.unwikify("carne-fresca")).to.equal("carne fresca");
      expect(namer.unwikify("carne fresca")).to.equal("carne fresca");
      expect(namer.unwikify("Carne Fresca")).to.equal("Carne Fresca");
    });

  });
});