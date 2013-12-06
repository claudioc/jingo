
var Fs     = require("fs")
  , Namer  = require("../lib/namer")
  , Path   = require("path")
  , Renderer = require('../lib/renderer')
  , Locker = require("../lib/locker")
  , Tools  = require("../lib/tools")
  , Url    = require("url");

var Git = app.locals.Git;

exports.index = function(req, res) {
  res.redirect('/wiki/home');
};

exports.search = function(req, res) {

  var items = []
    , record;

  res.locals.matches = [];
  res.locals.term = req.query.term.trim();

  if (res.locals.term.length < 2) {
    res.locals.warning = "Search string is too short.";
    renderResults();
  } else {

    Git.grep(res.locals.term, function(err, items) {

      items.forEach(function(item) {
        if (item.trim() != "") {
          record = item.split(":");
          res.locals.matches.push({
            pageName: Path.basename(record[0].split(".")[0]),
            line: record[1] ? ":" + record[1] : "",
            text: record.slice(2).join('')
          });
        }
      });

      renderResults();
    });
  }

  function renderResults() {
    res.render("search", {
      title: "Search results"
    });
  }
}

exports.pageList = function(req, res) {

  var items = []
    , title
    , len;

  Git.ls(function(err, list) {

    len = list.length;

    list.forEach(function(page) {

      page = Path.basename(page);

      Git.hashes(page,2, function(err, hashes) {

        Git.readFile(page, "HEAD", function(err, content) {

          (function(title) {

            Git.log(page, "HEAD", function(err, metadata) {

              Git.lastMessage(page, "HEAD", function(err, message) {

                items.push({
                  pageTitle: title,
                  message: message,
                  metadata: metadata,
                  hashes: hashes.length == 2 ? hashes.join("..") : ""
                });

                if (items.length === len) {
                  items.sort(function(a, b) {
                    return b.metadata.timestamp - a.metadata.timestamp;
                  });

                  res.render("list", {
                    title: "Document list – Sorted by update date",
                    items: items
                  });
                }
              });
            });
          })(Tools.getPageTitle(content, page));
        });
      });
    });
  });
}

exports.pageShow = function(req, res) {

  var pageName = req.params.page
    , pageVersion = req.params.version || "HEAD";

  Git.readFile(pageName + ".md", pageVersion, function(err, content) {

    if (err) {
      if (req.user) {
        res.redirect('/pages/new/' + pageName);
      } else {
        // Special case for "home", anonymous user and an empty docbase
        if (pageName == 'home') {
          res.render('welcome', {
            title: 'Welcome to ' + app.locals.appTitle
          });
        } else {
          error404(req, res);
          return;
        }
      }

    } else {

      Git.log(pageName + ".md", pageVersion, function(err, metadata) {

        res.locals.canEdit = true;
        if (pageVersion != 'HEAD') {
          res.locals.warning = "You're not reading the latest revision of this page, which is " + "<a href='/wiki/" + pageName + "'>here</a>.";
          res.locals.canEdit = false;
        }

        res.locals.notice = req.session.notice;
        delete req.session.notice;

        res.render('show', {
          title:   app.locals.appTitle + " – " + Tools.getPageTitle(content, pageName),
          content: Tools.hasTitle(content) ? Renderer.render(content) : Renderer.render("# " + pageName + "\n" + content),
          pageName: pageName, 
          metadata: metadata
        });

      });
    }
  });
};

exports.pageNew = function(req, res) {

  res.locals.pageName = Namer.normalize(req.params.page);

  if (res.locals.pageName) {
    if (Fs.existsSync(Git.absPath(res.locals.pageName + ".md"))) {
      res.redirect("/wiki/" + res.locals.pageName);
      return;
    }
  }

  res.locals.errors = req.session.errors;
  res.locals.formData = req.session.formData || {};
  delete req.session.errors;
  delete req.session.formData;

  res.render('create', {
    "title": "Create a new page",
    "pageTitle": Namer.denormalize(res.locals.pageName)
  });
}

exports.pageCreate = function(req, res) {

  var errors
    , pageName
    , pageFile
    , hasPageName = !!req.body.pageName;

  pageName = Namer.normalize(req.body.pageName || req.body.pageTitle);

  req.check('pageTitle', 'Page title cannot be empty').notEmpty();
  req.check('content',   'Page content cannot be empty').notEmpty();

  errors = req.validationErrors();

  if (errors) {
    req.session.errors = errors;
    req.session.formData = req.body;
    res.redirect("/pages/new" + (hasPageName ? '/' + pageName : ''));
    return;
  }

  req.sanitize('pageTitle').trim();
  req.sanitize('content').trim();

  pageFile = Git.absPath(pageName + ".md");

  if (Fs.existsSync(pageFile)) {
    req.session.errors = [{msg: "A document with this title already exists"}];
    res.redirect("/pages/new");
    return;
  }

  Fs.writeFile(pageFile, "# " + req.body.pageTitle + "\n" + req.body.content.replace(/\r\n/gm, "\n"), function() {
    Git.add(pageName + ".md", "Page created (" + pageName + ")", req.user.asGitAuthor, function(err) {
      req.session.notice = "Page has been created successfully";
      res.redirect("/wiki/" + pageName);
    });
  });
}

exports.pageEdit = function(req, res) {

  var pageName = res.locals.pageName = req.params.page
    , lock;

  if (lock = Locker.getLock(pageName)) {
    if (lock.user.asGitAuthor != req.user.asGitAuthor) {
      res.locals.warning = "Warning: this page is probably being edited by " + lock.user.displayName;
    }
  }

  Git.pull(app.locals.remote, app.locals.branch, function(err) {

    if (err) {
      error500(req, res, err);
      return;
    }

    Git.readFile(pageName + ".md", "HEAD", function(err, content) {

      if (err) {
        res.redirect('/pages/new/' + pageName);
      } else {

        if (!req.session.formData) {
          res.locals.formData = {
            pageTitle: Tools.getPageTitle(content, pageName),
            content: Tools.getContent(content)
          };
        } else {
          res.locals.formData = req.session.formData;
        }

        res.locals.errors = req.session.errors;

        Locker.lock(pageName, req.user);

        delete req.session.errors;
        delete req.session.formData;

        res.render('edit', {
          title: 'Edit page'
        });
      }
    });
  });
}

exports.pageUpdate = function(req, res) {

  var pageName = res.locals.pageName = Namer.normalize(req.params.page)
    , errors
    , pageFile
    , message
    , content;

  req.check('pageTitle', 'Page title cannot be empty').notEmpty();
  req.check('content',   'Page content cannot be empty').notEmpty();

  errors = req.validationErrors();

  if (errors) {
    req.session.errors = errors;
    req.session.formData = req.body;
    res.redirect("/pages/" + pageName + "/edit");
    return;
  }

  req.sanitize('pageTitle').trim();
  req.sanitize('content').trim();
  req.sanitize('message').trim();

  content = "# " + req.body.pageTitle + "\n" + req.body.content.replace(/\r\n/gm, "\n");
  pageFile = Git.absPath(pageName + ".md");

  message = (req.body.message == "") ? "Content updated (" + pageName + ")" : req.body.message;

  Fs.writeFile(pageFile, content, function() {
    Git.add(pageName + ".md", message, req.user.asGitAuthor, function(err) {
      Locker.unlock(pageName);
      if (pageName == '_footer') {
        app.locals.Components.expire('footer');
      }
      if (pageName == '_sidebar') {
        app.locals.Components.expire('sidebar');
      }
      req.session.notice = "Page has been updated successfully";
      res.redirect("/wiki/" + pageName);
    });
  });
}

exports.pageDestroy = function(req, res) {

  var pageName = Namer.normalize(req.params.page);

  if (pageName == 'home') {
    res.redirect("/");
    return;
  }

  Git.rm(pageName + ".md", "Page removed (" + pageName + ")", req.user.asGitAuthor, function(err) {
    Locker.unlock(pageName);
    if (pageName == '_footer') {
      app.locals._footer = null;
    }
    if (pageName == '_sidebar') {
      app.locals._sidebar = null;
    }
    req.session.notice = "Page has been deleted successfully";
    res.redirect("/");
  });
}

exports.pageCompare = function(req, res) {

  var pageName = req.params.page
    , revisions = req.params.revisions;
    
  res.locals.revisions = revisions.split("..");
  res.locals.lines = [];

  Git.diff(pageName + ".md", revisions, function(err, diff) {

    diff.split("\n").slice(4).forEach(function(line) {

      if (line.slice(0,1) != '\\') {
        res.locals.lines.push({
          text: line,
          ldln: leftDiffLineNumber(0, line),
          rdln: rightDiffLineNumber(0, line),
          class: lineClass(line)
        });
      }

    });

    res.render('compare', {
      title: "Compare Revisions"
    });

  });

  var ldln = 0
    , cdln;
  function leftDiffLineNumber(id, line) {

    var li;
    
    switch(true) {

      case line.slice(0,2) == '@@':
        li = line.match(/\-(\d+)/)[1];
        ldln = parseInt(li, 10);
        cdln = ldln;
        return '...';

      case line.slice(0,1) == '+':
        return "";

      case line.slice(0,1) == '-':
      default:
        ldln++
        cdln = ldln - 1;
        return cdln;
    }
  }

   var rdln = 0;
   function rightDiffLineNumber(id, line) {

    var ri;

    switch(true) {

      case line.slice(0,2) == '@@':
        ri = line.match(/\+(\d+)/)[1];
        rdln = parseInt(ri, 10)
        cdln = rdln;
        return '...';

      case line.slice(0,1) == '-':
        return ' ';

      case line.slice(0,1) == '+':
      default:
        rdln += 1
        cdln = rdln - 1;
        return cdln;
    }
  }

  function lineClass(line) {
    if (line.slice(0,2) === '@@') {
      return "gc";
    }
    if (line.slice(0,1) === '-') {
      return "gd";
    }
    if (line.slice(0,1) === '+') {
      return "gi";
    }
  }
}

exports.pageHistory = function(req, res) {

  var pageName = req.params.page
    , pageTitle;

  Git.readFile(pageName + ".md", "HEAD", function(err, content) {

    // FIXME This is a 404
    if (err) { res.redirect('/'); }

    Git.log(pageName + ".md", "HEAD", 30, function(err, metadata) {
      res.locals.pageTitle = Tools.getPageTitle(content, pageName);
      res.locals.pageName = pageName;
      res.locals.items = metadata;
      res.render('history', {
        title: "Revisions of"
      });
    });
  });
}

exports.miscPreview = function(req, res) {
  res.render('preview', {
    content: Renderer.render(req.body.data)
  });
}

exports.miscSyntaxReference = function(req, res) {
  res.render('syntax');
}

// Filters out pages that do not exist in the index
exports.miscExistence = function(req, res) {

  if (!req.query.data) {
    res.send(JSON.stringify({data: []}));
    return;
  }

  var result = []
    , n = req.query.data.length;

  req.query.data.forEach(function(pageName, idx) {
    (function(page, index) {
      if (!Fs.existsSync(Git.absPath(page + ".md"))) {
        result.push(page);
      }
      if (index == (n - 1)) {
        res.send(JSON.stringify({data: result}));
      }
    })(pageName, idx);
  });
}

exports.authDone = function(req, res) {

  if (!res.locals.user) {
    res.redirect("/");
    return;
  }

console.log(req.session.destination);
  if (!app.locals.authentication.alone.used && !Tools.isAuthorized(res.locals.user.email, app.locals.authorization.validMatches)) {
    req.logout();
    req.session = null;
    res.statusCode = 403;
    res.end('<h1>Forbidden</h1>');
  } else {
    var dst = req.session.destination || "/";
    delete req.session.destination;
    res.redirect(dst);
  }
}

/*
 * GET Login page.
 */
exports.login = function(req, res) {

  req.session.destination = req.query.destination; // (req.headers.referer ? Url.parse(req.headers.referer).path : null);

  if (req.session.destination == '/login') {
    req.session.destination = '/';
  }

  res.locals.errors = req.flash();

  res.render('login', {
    title: app.locals.appTitle,
    auth: app.locals.authentication
  });
};

exports.logout = function(req, res) {
  req.logout();
  req.session = null;
  res.redirect('/');
};

error404 = exports.error404 = function(req, res) {
  res.locals.title = "404 - Not found";
  res.statusCode = 404;
  res.render('404.jade');
}

error500 = exports.error500 = function(req, res, message) {
  res.locals.title = "500 - Internal server error";
  res.statusCode = 500;
  res.render('500.jade', {
    error: message
  });
}
