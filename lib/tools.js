var Crypto = require('crypto');

var tools = {

  isTitle: function(text) {
    return typeof text == 'string' && text.charAt(0) == "#";
  },

  hasTitle: function(content) {
    return typeof content == 'string' && this.isTitle(content.split("\n")[0]);
  },

  getPageTitle: function(content, page) {
    var title = content.split("\n")[0];
    return this.isTitle(title) ? title.substr(1) : page.replace(".md", "");
  },

  getContent: function(content) {
    var pageRows = content.split("\n");
    return this.isTitle(pageRows[0]) ? content.substr(pageRows[0].length) : content;
  },

  isAuthorized: function(email, pattern) {

    if (!email || email.trim() == "") {
      return false;
    }

    if (!pattern || pattern.trim() == "") {
      return true;
    }

    if (!email.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/i)) {
      return false;
    }

    var tests = pattern.split(",").map(function(str) { return str.trim(); });
    var expr;
    for (var i=0; i < tests.length; i++) {
      try {
        expr = expr || !!email.match(new RegExp("^" + tests[i] + "$", "i"));
      } catch(e) { // Invalid regular expression
        return false;
      }
    }

    return expr;

  },

  hashify: function(str) {
    var shasum = Crypto.createHash('sha1');
    shasum.update(str);
    return shasum.digest('hex');
  }

};

module.exports = tools;
