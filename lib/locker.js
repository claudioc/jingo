
var Locker = {

  locks: {},

  purgeTime: 3600 * 1000,

  lock: function(page, user) {
    var d = new Date();
    this.locks[page] = {
      user: user,
      ts:   d.getTime() + (d.getTimezoneOffset() * 60 * 1000)
    };
  },

  unlock: function(page) {
    delete this.locks[page];
  },

  getLock: function(page) {
    return this.locks[page] ? this.locks[page] : null;
  },

  reset: function() {
    this.locks = {};
  },

  count: function() {
    return Object.keys(this.locks).length;
  },

  purge: function() {
    var d = new Date(),
        now = d.getTime() + (d.getTimezoneOffset() * 60 * 1000);

    for (var page in this.locks) {
      if ((now - this.locks[page].ts) > this.purgeTime) {
        this.unlock(page);
      }
    }
  }
};

setTimeout(function() {
  Locker.purge();
}, 3600 * 1000);

module.exports = Locker;
