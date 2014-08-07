var crypto = require("crypto");

var tools = {

  isAuthorized: function(email, pattern) {

    if (!email || email.trim() === "") {
      return false;
    }

    if (!pattern || pattern.trim() === "") {
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
    var shasum = crypto.createHash("sha1");
    shasum.update(str);
    return shasum.digest("hex");
  }

};

module.exports = tools;
