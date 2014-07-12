var Promise = require("bluebird");

function addExtension(pageName) {
  return pageName.replace(/\.md$/, "") + ".md";
}

var gitmech;

var models = {

  use: function(git) {
    gitmech = git;
  },

  repositories: {

    refresh: function(callback) {

      gitmech.pull(function(err) {
        callback(err);
      });
    }
  },

  pages: {

    findString: function(string, callback) {

      gitmech.grep(string, function(err, items) {

        callback(err, items);
      });
    },

    remove: function(pageName, author, callback) {

      gitmech.rm(addExtension(pageName), "Page removed (" + pageName + ")", author, function(err) {
        callback(err);
      });
    },

    add: function(pageName, author, callback) {

      gitmech.add(addExtension(pageName), "Page created (" + pageName + ")", author, function(err) {

        if (err) {
          callback(err);
          return;
        }

        callback(null);
      });
    },

    update: function(pageName, message, author, callback) {

      gitmech.add(addExtension(pageName), message, author, function(err) {

        if (err) {
          callback(err);
          return;
        }

        callback(null);
      });
    },

    getAbsolutePath: function(pageName) {
      return gitmech.absPath(addExtension(pageName));
    },

    getAll: function(callback) {

      gitmech.ls(function(err, list) {

        if (err) {
          callback(err);
          return;
        }

        callback(null, list);
      });
    },

    getContent: function(pageName, pageVersion, callback) {

      pageName = addExtension(pageName);
      pageVersion = pageVersion || "HEAD";

      gitmech.show(pageName, pageVersion, function(err, content) {

        if (err) {
          callback(err);
          return;
        }

        callback(null, content);
      });
    },

    getHashes: function(pageName, callback) {

      pageName = addExtension(pageName);

      gitmech.hashes(pageName, 2, function(err, hashes) {

        if (err) {
          callback(err);
          return;
        }

        callback(null, hashes);
      });

    },

    getMetadata: function(pageName, pageVersion, callback) {

      pageName = addExtension(pageName);
      pageVersion = pageVersion || "HEAD";

      gitmech.log(pageName, pageVersion, function(err, metadata) {

        if (err) {
          callback(err);
          return;
        }

        callback(null, metadata);
      });
    },

    getLastMessage: function(pageName, callback) {

      pageName = addExtension(pageName);

      gitmech.lastMessage(pageName, "HEAD", function(err, message) {

        if (err) {
          callback(err);
          return;
        }

        callback(null, message);
      });
    },

    getRevisionsDiff: function(pageName, revisions, callback) {

      pageName = addExtension(pageName);

      gitmech.diff(pageName, revisions, function(err, diff) {

        if (err) {
          callback(err);
          return;
        }

        callback(null, diff);

      });
    },

    getHistory: function(pageName, callback) {

      pageName = addExtension(pageName);

      gitmech.show(pageName, "HEAD", function(err, content) {

        if (err) {
          callback(err);
          return;
        }

        gitmech.log(pageName, "HEAD", 30, function(err, metadata) {

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
Promise.promisifyAll(models.repositories);

module.exports = models;
