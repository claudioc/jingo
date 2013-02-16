var Path = require("path")
  , ChildProcess = require('child_process')
  , Fs = require("fs");

module.exports = Gitmech = (function() {
  
  var Repo;
  var gitCommands, gitDir, workTree;
  var gitENOENT = /fatal: (Path '([^']+)' does not exist in '([0-9a-f]{40})'|ambiguous argument '([^']+)': unknown revision or path not in the working tree.)/;

  // Internal helper to talk to the git subprocess
  function gitExec(commands, callback) {
    commands = gitCommands.concat(commands);
    var child = ChildProcess.spawn("git", commands, { cwd: workTree });
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
      if (exitCode > 0) {
        var err = new Error("git " + commands.join(" ") + "\n" + join(stderr, 'utf8'));
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

  return {

    // FIXME: shouldPush should be a method which understands if the local repo is in sync with the remote
    // BY default we assume the repo is dirty and needs a push
    // git rev-list master...origin/master (if the output is empty, there is no need for a push)
    shouldPush: true,

    setup: function(repoDir) {

      try {
        Fs.statSync(repoDir);
      } catch (e) {
        throw new Error("Bad repository path (not exists): " + repoDir);
      }

      try {
        var gitDir = Path.join(repoDir, ".git");
        Fs.statSync(gitDir);
        workTree = repoDir;
        gitCommands = ["--git-dir=" + gitDir, "--work-tree=" + workTree];
      } catch (e) {
        throw new Error("Bad repository path (not initialized): " + repoDir);
      }
    },

    readFile: function(path, version, callback) {
      gitExec(["show", version + ":" + path], function(err, data) {
        if (err) {
          callback(err);
        } else {
          callback(null, data.toString());
        }
      });
    },

    remoteExists: function(remote, callback) {
      gitExec(["remote"], function(err, data) {
        var remotes = (data ? data.toString().split("\n") : []);
        callback(null, remotes.indexOf(remote) !== -1);
      });
    },

    push: function(remote, refspec, callback) {
      // No commits, no push
      if (!this.shouldPush) {
        callback(null);
        return;
      }

      this.remoteExists(remote, function(err, exists) {
        if (!exists) {
          callback("Remote does not exist " + "(" + remote + ")");
          return;
        }

        gitExec(["push", remote, refspec], function(err) {
          if (err && err.toString().match(/^Error:/)) {
            var lines = err.toString().split("\n");
            callback("Push unsucessfull (" +  lines[1] + ")");
            return;
          }
          this.shouldPush = false;
          callback(null);
        });

      });
    },

    log: function(path, version, howMany, callback) {

      if (typeof howMany == 'function') {
        callback = howMany;
        howMany = 1;
      }

      gitExec(["log", "-" + howMany, "--reverse", "--no-notes", "--pretty=format:%h%n%H%n%an%n%ae%n%aD%n%ar%n%at%n%s", version, "--", path], function(err, data) {

        var logdata = data ? data.toString().split("\n") : []
          , group
          , metadata = [];

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

    add: function(path, message, author, callback) {
      gitExec(["add", path], function(err) {
        if (err) {
          callback(err);
        } else {
          this.commit(path, message, author, callback);
        }
      }.bind(this));
    },

    rm: function(path, message, author, callback) {
      gitExec(["rm", path], function(err) {
        if (err) {
          callback(err);
        } else {
          this.commit(path, message, author, callback);
        }
      }.bind(this));
    },

    commit: function(path, message, author, callback) {
      gitExec(["commit", "--author=\"" + author + "\"", "-m", message, path], function(err) {
        this.shouldPush = true;
        callback(err);
      }.bind(this));
    },

    grep: function(pattern, callback) {
      // TODO decide for -w
      gitExec([ "grep", "--no-color", "-F", "-n", "-i", "-I", pattern ], function(err, data) {
        var result;
        if (data) {
          result = data.toString().split("\n");
        } else {
          result = [];
        }

        gitExec([ "ls-files", "*" + pattern + "*.md" ], function(err, data) {

          if (data) {
            data.toString().split("\n").forEach(function(name) {
              result.push(name);
            });
          }

          callback(err, result);
        });
      });
    },

    diff: function(path, revisions, callback) {
      gitExec([ "diff", "--no-color", "-b", revisions, "--", path ], function(err, data) {
        callback(err, data.toString());
      });
    },

    ls: function(callback) {
      gitExec([ "ls-tree", "--name-only", "-r", "HEAD" ], function(err, data) {
        callback(null, data.toString().split("\n").filter(function(v) { return v!=""}));
      });
    }
  };

})();
