var fs = require('fs');
var models = require("../../lib/models");

var m;

describe.only ("Models", function () {

  afterEach(function () {
    m.configOverride();
  });

  function getModel(name, revision) {
    return new models.Page(name, revision);
  }

  describe("Page model", function () {

    it ("should initialize the model", function () {

      m = getModel("grazie cara");

      expect(m.name).to.equal("grazie cara");
      expect(m.wikiname).to.equal("grazie cara");
      expect(m.filename).to.equal("grazie cara.md");
      expect(m.pathname).to.equal("grazie cara.md");
      expect(m.revision).to.equal("HEAD");

    });

    describe("Remove method", function () {

      it ("should delete a file", function (done) {

        m = getModel("verguenza");
        m.remove().then(function() {
          expect(Git.rm.called).to.be.true;
          done();
        });
      });
    });

    describe("Rename method", function () {

      it ("should not rename if the destination exists", function (done) {
        var stub0 = sinon.stub(fs, 'existsSync').returns(true);
        m = getModel("verguenza");
        m.renameTo('vergogna').catch(function() {
          stub0.restore();
          done();
        });
      });

      it ("should rename if the destination does not exist", function (done) {
        var stub0 = sinon.stub(fs, 'existsSync').returns(false);
        m = getModel("verguenza");
        m.renameTo('vergogna').then(function () {
          expect(m.name).to.equal("vergogna");
          expect(m.wikiname).to.equal("vergogna");
          expect(m.filename).to.equal("vergogna.md");
          expect(m.pathname).to.equal("vergogna.md");
          done();
        }); 
      });
    });

    describe("Save method", function () {

      it ("should save the right content with the default config", function (done) {

        m = getModel("verguenza");
        m.title = "The huge";
        m.content = "The verge";
        var stub0 = sinon.stub(fs, 'writeFile').callsArgOn(2, m);
        m.save().then(function (content) {
          expect(content).to.equal("The verge");
          stub0.restore();
          done();
        });
      });

      it ("should save the right content with the title in the content", function (done) {

        m = getModel("verguenza");

        m.configOverride({
          pages: {
            title: {
              fromFilename: false,
              fromContent: true
            }
          }
        });

        m.title = "The huge";
        m.content = "The verge";
        var stub0 = sinon.stub(fs, 'writeFile').callsArgOn(2, m);
        m.save().then(function (content) {
          expect(content).to.equal("# The huge\nThe verge");
          stub0.restore();
          done();
        });
      });
    });
  });
});
