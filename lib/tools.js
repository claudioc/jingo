var Crypto = require('crypto');

var tools = {

  hasTitle: function(content) {
    var title = content.split("\n")[0];

    return title.charAt(0)=="#" ? true : false;
  },

  getPageTitle: function(content, page) {
    var title = content.split("\n")[0];
    title = this.hasTitle(content) ? title.substr(1) : page.replace(".md", "");

    return title;
  },

  getContent: function(content) {
    var pageRows = content.split("\n");
    content = this.hasTitle(content) ? content.substr(pageRows[0].length) : content;

    return content;
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
