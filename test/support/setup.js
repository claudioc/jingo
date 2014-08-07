global.sinon = require('sinon');
global.chai = require('chai');
global.expect = chai.expect;

global.Git = {

  absPath: function (file) {
    return file;
  },

  rm: function (a,b,c,cb) {
    cb.call();
  }

};

