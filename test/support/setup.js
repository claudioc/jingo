global.sinon = require('sinon');
global.chai = require('chai');
global.expect = chai.expect;

global.Git = {

  _content: "",

  absPath: function (file) {
    return file;
  },

  rm: sinon.stub().callsArgOn(3, this),

  mv: sinon.stub().callsArgOn(4, this),

  add: sinon.stub().callsArgOn(3, this),

  show: function (a, b, cb) {
    cb.call(this, null, this._content);
  }

};

