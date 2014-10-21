var Promise = require("bluebird"),
    path = require("path"),
    namer = require("../lib/namer"),
    fs = require("fs"),
    Configurable = require("./configurable"),
    locker = require("../lib/locker");

var gitmech;

function Page(name, revision) {
  name = name || "";
  this.setNames(name);
  this.revision = revision || "HEAD";
  this.content = "";
  this.title = "";
  this.metadata = {};
  this.error = "";
  this.author = "";
  this.lockedBy = null;
  this.hashes = [];
  this.lastCommand = "";
  this.lastCommitMessage = "";
  Configurable.call(this);
}

Page.prototype = Object.create(Configurable.prototype);

Page.prototype.setNames = function(name) {
  this.name = namer.unwikify(name.replace(/\.md$/, ""));
  this.wikiname = namer.wikify(this.name);
  this.filename = this.wikiname + ".md";
  this.pathname = gitmech.absPath(this.filename);
};

Page.prototype.remove = function() {

  return new Promise(function(resolve, reject) {

    if (this.error) {
      resolve();
      return;
    }
    gitmech.rm(this.filename, "Page removed (" + this.wikiname + ")", this.author, function(err) {
      resolve();
    });
  }.bind(this));
};

Page.prototype.renameTo = function(newName) {

  var newFilename = newName + ".md";

  return new Promise(function(resolve, reject) {

    // Cannot rename if the file already exists
    if (fs.existsSync(gitmech.absPath(newFilename))) {
      reject();
      return;
    }

    gitmech.mv(this.filename, 
               newFilename, 
               "Page renamed (" + this.filename + " => " + newFilename + ")", 
               this.author, 
               function(err) {
        if (err) {
          reject();
        }
        else {
          this.setNames(newName); 
          resolve();
        }
    }.bind(this));
  }.bind(this));
};

Page.prototype.exists = function() {
  return fs.existsSync(this.pathname);
};

Page.prototype.save = function(message) {

  message = message || "";

  return new Promise(function(resolve, reject) {

    if (this.error) {
      resolve();
      return;
    }

    var defMessage = (this.exists() ? "Content updated" : "Page created") + " (" + this.wikiname + ")";

    message = (message.trim() === "") ? defMessage : message.trim();

    var content = this.content;

    if (this.getConfig().pages.title.fromContent) {
      content = "# " + this.title + "\n" + content;
    }

    content = content.replace(/\r\n/gm, "\n");

    fs.writeFile(this.pathname, content, function (err) {

      if (err) {
        reject(err);
        return;
      }

      gitmech.add(this.filename, message, this.author, function(err) {

        if (err) {
          reject(err);
          return;
        }

        resolve(content);
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

Page.prototype.urlFor = function(action) {

  var wname = encodeURIComponent(this.wikiname);

  switch(true) {

    case action == 'show':
      return "/wiki/" + wname;

    case action == 'edit':
      return "/pages/" + wname + "/edit";

    case action == 'edit error':
      return "/pages/" + wname + "/edit?e=1";

    case action == 'edit put':
      return "/pages/" + wname;

    case action == 'history':
      return "/wiki/" + wname + "/history";

    case action == 'compare':
      return "/wiki/" + wname + "/compare";

    case action == 'new':
      return "/pages/new/" + wname;

    case action == 'new error':
      return "/pages/new/" + wname + "?e=1";
  }

  return "/";
};

Page.prototype.urlForShow = function(action) {
  return this.urlFor("show");
};

Page.prototype.urlForEdit = function(action) {
  return this.urlFor("edit");
};

Page.prototype.urlForEditWithError = function(action) {
  return this.urlFor("edit error");
};

Page.prototype.urlForNewWithError = function(action) {
  return this.urlFor("new error");
};

Page.prototype.urlForEditPut = function(action) {
  return this.urlFor("edit put");
};

Page.prototype.urlForHistory = function(action) {
  return this.urlFor("history");
};

Page.prototype.urlForCompare = function(action) {
  return this.urlFor("compare");
};

Page.prototype.isIndex = function() {
  return this.getConfig().pages.index == this.name;
};

Page.prototype.isFooter = function() {
  return this.name == '_footer';
};

Page.prototype.isSidebar = function() {
  return this.name == '_sidebar';
};

Page.prototype.lock = function(user) {

  var lock = locker.getLock(this.name);

  if (lock && lock.user.asGitAuthor != user.asGitAuthor) {
    this.lockedBy = lock.user;
    return false;
  }

  locker.lock(this.name, user);
  this.lockedBy = user;
  return true;
};

Page.prototype.unlock = function(user) {
  this.lockedBy = null;
  locker.unlock(this.name);
};

Page.prototype.fetch = function(extended) {

  if (!extended) {
    return Promise.all([this.fetchContent(),
                        this.fetchMetadata()]);
  } 
  else {
    return Promise.all([this.fetchContent(),
                        this.fetchMetadata(),
                        this.fetchHashes(),
                        this.fetchLastCommitMessage()]);
  }
};

Page.prototype.fetchContent = function() {

  return new Promise(function(resolve, reject) {

    if (this.error) {
      resolve();
      return;
    }

    gitmech.show(this.filename, this.revision, function(err, content) {

      this.lastCommand = "show";

      content = content || "";

      if (err) {
        this.error = err;
      }
      else {

        this.rawContent = content;

        if (content.length === 0 || this.getConfig().pages.title.fromFilename) {
          this.title = this.name;
          this.content = content;
        } 
        else {
          // Retrieves the title from the first line of the content (and removes it from the actual content)
          // By default Jingo (< 1.0) stores the title as the first line of the
          // document, prefixed by a '#'
          var lines = content.split("\n");
          this.title = lines[0].trim();

          if (this.title.charAt(0) == "#") {
            this.title = this.title.substr(1).trim();
            this.content = lines.slice(1).join("\n");
          } 
          else {
            // Mmmmh... this file doesn't seem to follow Jingo's convention...
            this.title = this.name;
            this.content = content;
          }
        }
      }

      resolve();
    }.bind(this));
  }.bind(this));
};

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
};

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
};

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
};

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
};

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
};

function Pages() {
  this.models = [];
  this.total = 0;
  Configurable.call(this);
}

Pages.prototype = Object.create(Configurable.prototype);

Pages.prototype.fetch = function(pagen) {

  return new Promise(function(resolve, reject) {

    gitmech.ls("*.md", function(err, list) {

      var model, promises = [];

      if (err) {
        reject(err);
        return;
      }

      var itemsPerPage = this.getConfig().pages.itemsPerPage;

      this.total = list.length;
      this.totalPages = Math.ceil(this.total / itemsPerPage);

      if (pagen <= 0) {
        pagen = 1;
      }
      if (pagen > this.totalPages) {
        pagen = this.totalPages;
      }
      
      this.currentPage = pagen;

      // Read the stats from the fs to be able to sort the whole
      // list before slicing the page out
      var listWithData = list.map(function (page) {

        var stats;

        try {
          stats = fs.statSync(gitmech.absPath(page)); 
        } catch (e) {
          stats = null;
        }
        return {
          name: page,
          stats: stats
        };
      });

      listWithData.sort(function(a, b) {
         return (a.stats !== null && b.stats !== null) ? b.stats.mtime.getTime() - a.stats.mtime.getTime() : 0;
      });

      var offset = (pagen - 1) * itemsPerPage;
      var slice = listWithData.slice(offset, offset + itemsPerPage);

      slice.forEach(function(data) {
        var page = path.basename(data.name).replace(/\.md$/,"");
        model = new Page(page);
        this.models.push(model);
        promises.push(model.fetch(true));
      }.bind(this));

      Promise.all(promises).then(resolve);
    }.bind(this));
  }.bind(this));
};

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
  }
};

Promise.promisifyAll(models.pages);
Promise.promisifyAll(models.repositories);

module.exports = models;
