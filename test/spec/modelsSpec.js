
var models = require("../../lib/models");

describe.only ("Models", function () {

  function getModel(name, revision) {
    return new models.Page(name, revision);
  }

  describe("Page model", function () {

    it ("should initialize the model", function () {

      var m = getModel("grazie cara");

      expect(m.name).to.equal("grazie cara");
      expect(m.wikiname).to.equal("grazie cara");
      expect(m.filename).to.equal("grazie cara.md");
      expect(m.pathname).to.equal("grazie cara.md");
      expect(m.revision).to.equal("HEAD");

    });

    describe("Remove method", function () {

      it ("should delete a file", function (done) {

        var m = getModel("verguenza");
        var s0 = sinon.spy(Git, "rm");
        m.remove().then(function() {
          expect(s0.called).to.be.true;
          done();
        });

      });
    });
  });
});