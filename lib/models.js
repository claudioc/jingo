var Promise = require("bluebird");
var path = require("path");
var namer = require("../lib/namer");

function addExtension(pageName) {
  return pageName.replace(/\.md$/, "") + ".md";
}

var gitmech;

function Page(name, revision) {
  this.name = name;
  this.filename = this.name.replace(/\.md$/, "") + ".md";
  this.revision = revision || "HEAD";
  this.rawContent = "";
  this.content = "";
  this.title = "";
  this.metadata = {};
  this.error;
  this.hashes = [];
  this.lastCommand = "";
  this.lastCommitMessage = "";
}

Page.prototype.urlFor = function(action) {

  switch(true) {

    case action == 'show':
      return "/wiki/" + encodeURIComponent(namer.wikify(this.name));

    case action == 'edit':
      return "/pages/" + encodeURIComponent(namer.wikify(this.name)) + "/edit";

    case action == 'history':
      return "/wiki/" + encodeURIComponent(namer.wikify(this.name)) + "/history";

    case action == 'compare':
      return "/wiki/" + encodeURIComponent(namer.wikify(this.name)) + "/compare";

    case action == 'new':
      return "/pages/new/" + encodeURIComponent(namer.wikify(this.name));
  }
}

Page.prototype.urlForShow = function(action) {
  return this.urlFor("show");
}

Page.prototype.urlForEdit = function(action) {
  return this.urlFor("edit");
}

Page.prototype.urlForHistory = function(action) {
  return this.urlFor("history");
}

Page.prototype.urlForCompare = function(action) {
  return this.urlFor("compare");
}

Page.prototype.isIndex = function() {
  
  var app = require("../lib/app").getInstance();

  return app.locals.config.get("pages").index == this.name;
}

Page.prototype.fetch = function(extended) {

  if (!extended) {
    return Promise.all([this.fetchContent(), this.fetchMetadata()]);
  } 
  else {
    return Promise.all([this.fetchContent(), this.fetchMetadata(), this.fetchHashes(), this.fetchLastCommitMessage()]);
  }
}

Page.prototype.fetchContent = function() {

  return new Promise(function(resolve, reject) {

    if (this.error) {
      resolve();
      return;
    }

    gitmech.show(this.filename, this.revision, function(err, content) {

      this.lastCommand = "show";

      if (err) {
        this.error = err;
      }
      else {

        var app = require("../lib/app").getInstance();

        if (content.length == 0 || app.locals.config.get("pages").title.fromFilename) {
          this.title = this.name;
        } else {
          // Retrieves the title from the first line of the content
          // By default Jingo (< 1.0) stores the title as the first line of the
          // document, prefixed by a '#'
          this.title = content.split("\n")[0].trim();
          if (this.title.charAt(0) == "#") {
             this.title = this.title.substr(1).trim();
          } 
          else {
            this.title = this.name;
          }
        }

        this.rawContent = this.content = content;
        if (content.length > 0 && app.locals.config.get("pages").title.fromContent) {
          this.content = "# " + this.title + "\n" + this.rawContent;
        }

      }

      resolve();
    }.bind(this));
  }.bind(this));
}

Page.prototype.fetchMetadata = function() {

  return new Promise(function(resolve, reject) {

    if (this.error) {
      resolve();
      return;
    }
 
    gitmech.log(this.filename, this.revision, function(err, metadata) {

      this.lastCommand = "log";

      if (err) {
        this.error = err;
      }
      else {

        if (typeof metadata != "undefined") {
          this.metadata = metadata;
        }
      }

      resolve();
    }.bind(this));
  }.bind(this));
}

Page.prototype.fetchHashes = function() {

  return new Promise(function(resolve, reject) {

    if (this.error) {
      resolve();
      return;
    }

    gitmech.hashes(this.filename, 2, function(err, hashes) {

      this.lastCommand = "hashes";

      if (err) {
        this.error = err;
      }
      else {
        this.hashes = hashes;
      }

      resolve();
    }.bind(this));
  }.bind(this));
}

Page.prototype.fetchLastCommitMessage = function() {

  return new Promise(function(resolve, reject) {

    if (this.error) {
      resolve();
      return;
    }

    gitmech.lastMessage(this.filename, "HEAD", function(err, message) {

      this.lastCommand = "lastMessage";

      if (err) {
        this.error = err;
      }
      else {
        this.lastCommitMessage = message;
      }

      resolve();
    }.bind(this));
  }.bind(this));
}

Page.prototype.fetchHistory = function() {

  return new Promise(function(resolve, reject) {

    if (this.error) {
      resolve();
      return;
    }

    gitmech.log(this.filename, "HEAD", 30, function(err, history) {

      this.lastCommand = "log";

      if (err) {
        this.error = err;
      }

      resolve(history);

    }.bind(this));
  }.bind(this));
}

Page.prototype.fetchRevisionsDiff = function(revisions) {

  return new Promise(function(resolve, reject) {

    if (this.error) {
      resolve();
      return;
    }

    gitmech.diff(this.filename, revisions, function(err, diff) {

      if (err) {
        this.error = err;
      }

      resolve(diff);

    }.bind(this));
  }.bind(this));
}

function Pages() {
  this.models = [];
}

Pages.prototype.fetch = function() {

  return new Promise(function(resolve, reject) {

    gitmech.ls(function(err, list) {

      var model, promises = [];

      if (err) {
        reject(err);
        return;
      }

      list.forEach(function(page) {
        page = path.basename(page).replace(/\.md$/,"");
        model = new Page(page);
        this.models.push(model);
        promises.push(model.fetch(true));
      }.bind(this));

      Promise.all(promises).then(resolve);
    }.bind(this));
  }.bind(this));
}

var models = {

  Page: Page,

  Pages: Pages,

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

    // getAll: function(callback) {

    //   gitmech.ls(function(err, list) {

    //     if (err) {
    //       callback(err);
    //       return;
    //     }

    //     callback(null, list);
    //   });
    // },

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

    // getTitle: function(pageName, content) {

    //   var app = require("../lib/app").getInstance(),
    //       title;

    //   if (app.locals.config.get("pages").title.fromFilename) {
    //     return pageName.replace(".md", "");
    //   }

    //   // Retrieves the title from the first line of the content
    //   // By default Jingo (< 1.0) stores the title as the first line of the
    //   // document, prefixed by a '#'
    //   title = content.split("\n")[0];
    //   return title.length > 0 ? title.substr(1).trim() : pageName.replace(".md", "");
    // },

    // getHashes: function(pageName, callback) {

    //   pageName = addExtension(pageName);

    //   gitmech.hashes(pageName, 2, function(err, hashes) {

    //     if (err) {
    //       callback(err);
    //       return;
    //     }

    //     callback(null, hashes);
    //   });

    // },

    // getMetadata: function(pageName, pageVersion, callback) {

    //   pageName = addExtension(pageName);
    //   pageVersion = pageVersion || "HEAD";

    //   gitmech.log(pageName, pageVersion, function(err, metadata) {

    //     if (err) {
    //       callback(err);
    //       return;
    //     }

    //     callback(null, metadata);
    //   });
    // },

    // getLastMessage: function(pageName, callback) {

    //   pageName = addExtension(pageName);

    //   gitmech.lastMessage(pageName, "HEAD", function(err, message) {

    //     if (err) {
    //       callback(err);
    //       return;
    //     }

    //     callback(null, message);
    //   });
    // },

    // getRevisionsDiff: function(pageName, revisions, callback) {

    //   pageName = addExtension(pageName);

    //   gitmech.diff(pageName, revisions, function(err, diff) {

    //     if (err) {
    //       callback(err);
    //       return;
    //     }

    //     callback(null, diff);

    //   });
    // },

    // getHistory: function(pageName, callback) {

    //   pageName = addExtension(pageName);

    //   gitmech.show(pageName, "HEAD", function(err, content) {

    //     if (err) {
    //       callback(err);
    //       return;
    //     }

    //     gitmech.log(pageName, "HEAD", 30, function(err, metadata) {

    //       if (err) {
    //         callback(err);
    //       }

    //       callback(null, content, metadata);
    //     });
    //   });
    // }
  }
};

Promise.promisifyAll(models.pages);
Promise.promisifyAll(models.repositories);

module.exports = models;
