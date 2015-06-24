var path = require("path"),
    childProcess = require("child_process"),
    semver = require("semver"),
    fs = require("fs");

var gitCommands, gitDir, workTree, docSubdir;
var gitENOENT = /fatal: (Path '([^']+)' does not exist in '([0-9a-f]{40})'|ambiguous argument '([^']+)': unknown revision or path not in the working tree.)/;

// Internal helper to talk to the git subprocess (spawn)
function gitSpawn(commands, callback) {

  commands = gitCommands.concat(commands);
  var child = childProcess.spawn(gitMech.gitBin, commands, { cwd: workTree });
  var stdout = [], stderr = [];
  child.stdout.addListener('data', function (text) {
    stdout[stdout.length] = text;
  });
  child.stderr.addListener('data', function (text) {
    stderr[stderr.length] = text;
  });
  var exitCode;
  child.addListener('exit', function (code) {
    exitCode = code;
  });
  child.addListener('close', function () {
    if (exitCode > 0 && stderr.length > 0) {
      var err = new Error(gitMech.gitBin + " " + commands.join(" ") + "\n" + join(stderr, 'utf8'));
      if (gitENOENT.test(err.message)) {
        err.errno = process.ENOENT;
      }
      callback(err);
      return;
    }

    callback(null, join(stdout));
  });
  child.stdin.end();
}

// Internal helper to talk to the git subprocess (exec)
function gitExec(commands, callback) {
  commands = gitMech.gitBin + " " + gitCommands.concat(commands).join(" ");
  // There is a limit at 200KB (increase it with maxBuffer option)
  childProcess.exec(commands, { cwd: workTree }, function (error, stdout, stderr) {
    if (error || stderr.length > 0) {
      error = new Error(commands + "\n" + stderr);
      callback(error);
      return;
    }
    callback(null, stdout);
  });
}

function join(arr) {
  var result, index = 0, length;
  length = arr.reduce(function(l, b) {
    return l + b.length;
  }, 0);
  result = new Buffer(length);
  arr.forEach(function(b) {
    b.copy(result, index);
    index += b.length;
  });

  return result;
}

var gitMech = {

  // FIXME: shouldPush should be a method which understands if the local repo is in sync with the remote
  // BY default we assume the repo is dirty and needs a push
  // git rev-list master...origin/master (if the output is empty, there is no need for a push)
  shouldPush: true,

  pulling: false,

  pushing: false,

  branch: "master",

  gitBin: "git",

  remote: "",

  setup: function(gitBin, repoDir, repoDocSubdir, refspec, callback) {
    
    this.gitBin = gitBin || "git";

    childProcess.exec(this.gitBin + " --version", function (err, stdout, stderr) {

      if (err !== null || stderr !== "") {
        callback("Cannot run git (tried with " + this.gitBin + ")");
        return;
      }

      var version = stdout.trim().split(" ");

      if (version[0] != "git" || version.length < 3) {
        callback("The provided git binary (" + this.gitBin + ") doesn't seem git to me.");
        return;
      }

      version = version[2];

      var splitted = version.split('.');
      if (splitted.length > 3) {
        version = splitted.slice(0, 3 - splitted.length).join(".");
      }

      if (splitted.length == 2) {
        version = splitted.concat([0]).join('.');
      }

      if (!semver.valid(version)) {
        callback("Unrecognized git semver (" + version + ")");
        return;
      }

      try {
        fs.statSync(repoDir);
      } catch (e) {
        callback("Bad repository path (not exists): " + repoDir);
        return;
      }

      docSubdir = repoDocSubdir.trim().replace(/^\/|\/$/g, '');
      if (docSubdir !== "") {
        docSubdir = docSubdir + "/";
      }

      try {
        fs.statSync(repoDir + "/" + docSubdir);
      } catch (e) {
        callback("Bad document subdirectory (not exists): " + repoDir + "/" + docSubdir);
        return;
      }

      try {
        var gitDir = path.join(repoDir, ".git");
        fs.statSync(gitDir);
        workTree = repoDir;
        gitCommands = ["--git-dir=" + gitDir, "--work-tree=" + workTree];
      } catch (e) {
        callback("Bad repository path (not initialized): " + repoDir);
        return;
      }

      if (refspec.length > 0) {
        this.remote = refspec[0].trim();
        this.branch = refspec[1] ? refspec[1].trim() : "master";
      }

      callback(null, version);
    }.bind(this));
  },

  absPath: function(path) {
    return workTree + "/" + docSubdir + path;
  },

  show: function(path, version, callback) {
    gitSpawn(["show", version + ":" + docSubdir + path], function(err, data) {
      if (err) {
      //  console.log(err);
        callback(err);
      } else {
        callback(null, data.toString());
      }
    });
  },

  remoteExists: function(remote, callback) {
    gitSpawn(["remote"], function(err, data) {
      var remotes = (data ? data.toString().split("\n") : []);
      callback(null, remotes.indexOf(remote) !== -1);
    });
  },

  pull: function(callback) {

    if (this.pulling || this.remote === "" || this.branch === '') {
      callback(null);
      return;
    }

    this.remoteExists(this.remote, function(err, exists) {
      if (!exists) {
        callback("Remote does not exist " + "(" + this.remote + ")");
        return;
      }
      this.pulling = true;

      gitSpawn(["pull", this.remote, this.branch], function(err) {
        this.pulling = false;
        if (err && err.toString().match(/^Error:/)) {
          var lines = err.toString().split("\n");
          callback("Pull unsucessfull (" +  lines[1] + ")");
          return;
        }
        callback(null);
      }.bind(this));
    }.bind(this));
  },

  push: function(callback) {

    if (this.remote === "" || this.branch === "") {
      callback(null);
      return;
    }

    // No commits, no push
    if (this.pushing || !this.shouldPush) {
      callback(null);
      return;
    }

    this.remoteExists(this.remote, function(err, exists) {
      if (!exists) {
        callback("Remote does not exist " + "(" + this.remote + ")");
        return;
      }

      this.pushing = true;

      gitSpawn(["push", this.remote, this.branch], function(err) {
        this.pushing = false;
        if (err && err.toString().match(/^Error:/)) {
          var lines = err.toString().split("\n");
          callback("Push unsucessfull (" +  lines[1] + ")");
          return;
        }
        this.shouldPush = false;
        callback(null);
      }.bind(this));

    }.bind(this));
  },

  log: function(path, version, howMany, callback) {

    if (typeof howMany == 'function') {
      callback = howMany;
      howMany = 1;
    }

    gitSpawn(["log", "-" + howMany, "--reverse", "--no-notes", "--pretty=format:%h%n%H%n%an%n%ae%n%aD%n%ar%n%at%n%s", version, "--", docSubdir + path], function(err, data) {

      var logdata = data ? data.toString().split("\n") : [],
          group,
          metadata = [];

      for (var i = Math.floor(logdata.length / 8); i-- > 0; ) {
        group = logdata.slice(i * 8, (i + 1) * 8);
        metadata.push({
          name:      path.replace(".md", ""),
          hash:      group[0],
          hashRef:   group[0],
          fullhash:  group[1],
          author:    group[2],
          email:     group[3],
          date:      group[4],
          relDate:   group[5],
          timestamp: group[6],
          subject:   group[7]
        });
      }

      if (metadata[0]) {
        metadata[0].hashRef = ''; // This can be used linking this version, but needs to be empty for HEAD
      }

      if (howMany == 1) {
        metadata = metadata[0];
      }

      callback(null, metadata);
    });
  },

  // Returns the hashes of commits on a file
  hashes: function(path, howMany, callback) {

    gitSpawn(["log", "-" + howMany, "--reverse", "--no-notes", "--pretty=format:%h", "--", docSubdir + path], function(err, data) {
      callback(null, data.toString().split("\n"));
    });

  },

  add: function(path, message, author, callback) {
    gitSpawn(["add", docSubdir + path ], function(err) {
      if (err) {
        console.log(err);
        callback(err);
      } else {
        this.commit(path, message, author, callback);
      }
    }.bind(this));
  },

  rm: function(path, message, author, callback) {
    gitSpawn(["rm", docSubdir + path], function(err) {
      if (err) {
        console.log(err);
        callback(err);
      } else {
        this.commit(path, message, author, callback);
      }
    }.bind(this));
  },

  mv: function(path, newPath, message, author, callback) {
    gitSpawn(["mv", "-f", docSubdir + path,  docSubdir + newPath], function(err) {
      if (err) {
        console.log(err);
        callback(err);
      } else {
        this.commit(path, message, author, callback);
      }
    }.bind(this));
  },

  commit: function(path, message, author, callback) {
    var options;
    if (path) {
      options = ["commit", "--author=\"" + author + "\"", "-m", message, docSubdir + path];
    }
    else {
      options = ["commit", "--author=\"" + author + "\"", "-am", message];
    }
    gitSpawn(options, function(err) {
      this.shouldPush = true;
      callback(err);
    }.bind(this));
  },

  grep: function(pattern, callback) {
    // TODO decide for -w
    var args = [ "grep", "--no-color", "-F", "-n", "-i", "-I", pattern ];
    if (docSubdir !== "") {
      args.push(docSubdir);
    }
    gitSpawn(args, function(err, data) {

      var result;
      if (data) {
        result = data.toString().split("\n");
      } else {
        result = [];
      }

      // Search in the file names
      gitSpawn([ "ls-files", docSubdir + "*.md" ], function(err, data) {

        if (data) {
          var patternLower = pattern.toLowerCase();

          data.toString().split("\n").forEach(function(name) {
            var nameLower = path.basename(name).toLowerCase();
            if (nameLower.search(patternLower) >= 0) {
              result.push(path.basename(name));
            }
          });
        }

        callback(err, result);
      });
    });
  },

  diff: function(path, revisions, callback) {
    gitSpawn([ "diff", "--no-color", "-b", revisions, "--", docSubdir + path ], function(err, data) {
      callback(err, typeof data != "undefined" ? data.toString() : "");
    });
  },

  lastMessage: function(path, revision, callback) {
    gitSpawn(["log", "-1", revision, "--no-notes", "--pretty=format:%s", "--", docSubdir + path], function(err, data) {
      callback(err,data.toString().trim());
    });
  },

  ls: function(pattern, callback) {
    gitExec([ "ls-tree", "--name-only", "-r", "HEAD", docSubdir + pattern ], function(err, data) {
      callback(null, data.toString().split("\n").filter(function(v) { return v !== ""; }));
    });
  }

};

module.exports = gitMech;
