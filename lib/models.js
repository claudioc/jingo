var Promise = require("bluebird");

var models = {

  gitmech: null,

  use: function(gitmech) {
    this.gitmech = gitmech;
  },

  pages: {

    getAll: function(callback) {

      Git.ls(function(err, list) {

        if (err) {
          callback(err);
          return;
        }

        callback(null, list);
      });
    },

    getContent: function(pageName, callback) {

      Git.show(pageName, "HEAD", function(err, content) {

        if (err) {
          callback(err);
          return;
        }

        callback(null, content);
      });
    },

    getHashes: function(pageName, callback) {

      Git.hashes(pageName, 2, function(err, hashes) {

        if (err) {
          callback(err);
          return;
        }

        callback(null, hashes);
      });
    },

    getHashes: function(pageName, callback) {

      Git.hashes(pageName, 2, function(err, hashes) {

        if (err) {
          callback(err);
          return;
        }

        callback(null, hashes);
      });

    },

    getLastLog: function(pageName, callback) {

      Git.log(pageName, "HEAD", function(err, metadata) {

        if (err) {
          callback(err);
          return;
        }

        callback(null, metadata);
      });
    },

    getLastMessage: function(pageName, callback) {

      Git.lastMessage(pageName, "HEAD", function(err, message) {

        if (err) {
          callback(err);
          return;
        }

        callback(null, message);
      });
    },

    getHistory: function(pageName, callback) {

      Git.show(pageName + ".md", "HEAD", function(err, content) {

        if (err) {
          callback(err);
          return;
        }

        Git.log(pageName + ".md", "HEAD", 30, function(err, metadata) {

          if (err) {
            callback(err);
          }

          callback(null, content, metadata);
        });
      });
    }
  }

};

Promise.promisifyAll(models.pages);

module.exports = models;
