
var Fs     = require("fs")
  , Namer  = require("../lib/namer")
  , Marked = require('marked')
  , Locker = require("../lib/locker")
  , Tools  = require("../lib/tools")
  , Url    = require("url")
  , Nsh    = require('node-syntaxhighlighter');

Marked.setOptions({
  gfm: true,
  pedantic: false,
  sanitize: false, // To be able to add iframes 
  highlight: function(code, lang) {
    return Nsh.highlight(code, Nsh.getLanguage(lang));
  }
});

exports.index = function(req, res) {
  res.redirect('/wiki/home');
};

exports.pageSearch = function(req, res) {

  var items = []
    , record;

  res.locals.matches = [];
  res.locals.query = req.query.query.trim();

  if (res.locals.query.length < 2) {
    res.locals.warning = "Search string is too short, sorry.";
    renderResults();
  } else {

    app.locals.Git.grep(res.locals.query, function(err, items) {

      items.forEach(function(item) {
        if (item.trim() != "") {
          record = item.split(":");
          res.locals.matches.push({
            pageName: record[0].split(".")[0],
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
    , title;

  app.locals.Git.ls(function(err, list) {

    list.forEach(function(page) {

      app.locals.Git.readFile(page, "HEAD", function(err, content) {

        (function(title) {

          app.locals.Git.log(page, "HEAD", function(err, metadata) {

            items.push({
              pageTitle: title,
              metadata: metadata
            });

            if (items.length === list.length) {
              items.sort(function(a, b) {
                return a.metadata.timestamp < b.metadata.timestamp;
              });
              res.render("list", {
                title: "Document list",
                items: items
              });
            }
          });
        })(content.split("\n")[0].substr(1));
      });
    });
  });
}

exports.pageShow = function(req, res) {

  var pageName = req.params.page
    , pageVersion = req.params.version || "HEAD";

  app.locals.Git.readFile(pageName + ".md", pageVersion, function(err, content) {

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

      app.locals.Git.log(pageName + ".md", pageVersion, function(err, metadata) {

        res.locals.canEdit = true;
        if (pageVersion != 'HEAD') {
          res.locals.warning = "You're not reading the latest revision of this page, which is " + "<a href='/wiki/" + pageName + "'>here</a>.";
          res.locals.canEdit = false;
        }

        res.locals.notice = req.session.notice;
        delete req.session.notice;

        res.render('show', {
          title:   app.locals.appTitle + " &ndash; " + content.split("\n")[0].substr(1),
          content: Marked(content),
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
    if (Fs.existsSync(app.locals.repo + "/" + res.locals.pageName + ".md")) {
      res.redirect("/wiki/" + res.locals.pageName);
      return;
    }
  }

  res.locals.errors = req.session.errors;
  res.locals.formData = req.session.formData || {};
  delete req.session.errors;
  delete req.session.formData;

  res.render('create', {
    "title": "Create a new page"
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

  pageFile = app.locals.repo + "/" + pageName + ".md";

  if (Fs.existsSync(pageFile)) {
    req.session.errors = [{msg: "A document with this title already exists"}];
    res.redirect("/pages/new");
    return;
  }

  Fs.writeFile(pageFile, "#" + req.body.pageTitle + "\n" + req.body.content, function() {
    app.locals.Git.add(pageName + ".md", "Page created (" + pageName + ")", req.user.asGitAuthor, function(err) {
      req.session.notice = "Page has been created successfully";
      res.redirect("/wiki/" + pageName);
    });
  });
}

exports.pageEdit = function(req, res) {

  var pageName = res.locals.pageName = req.params.page
    , pageRows
    , lock;

  if (lock = Locker.getLock(pageName)) {
    if (lock.user.asGitAuthor != req.user.asGitAuthor) {
      res.locals.warning = "Warning: this page is probably being edited by " + lock.user.displayName;
    }
  }

  app.locals.Git.readFile(pageName + ".md", "HEAD", function(err, content) {

    if (err) {
      res.redirect('/pages/new/' + pageName);
    } else {

      pageRows = content.split("\n");

      if (!req.session.formData) {
        res.locals.formData = {
          pageTitle: pageRows[0].substr(1),
          content: pageRows.slice(1).join("")
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
}

exports.pageUpdate = function(req, res) {

  var pageName = res.locals.pageName = Namer.normalize(req.params.page)
    , errors
    , pageFile
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

  content = "#" + req.body.pageTitle + "\n" + req.body.content;
  pageFile = app.locals.repo + "/" + pageName + ".md";

  Fs.writeFile(pageFile, content, function() {
    app.locals.Git.add(pageName + ".md", "Content updated (" + pageName + ")", req.user.asGitAuthor, function(err) {
      Locker.unlock(pageName);
      if (pageName == '_footer') {
        app.locals._footer = null;
      }
      if (pageName == '_sidebar') {
        app.locals._sidebar = null;
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

  app.locals.Git.rm(pageName + ".md", "Page removed (" + pageName + ")", req.user.asGitAuthor, function(err) {
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

  app.locals.Git.diff(pageName + ".md", revisions, function(err, diff) {

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

  app.locals.Git.readFile(pageName + ".md", "HEAD", function(err, content) {

    // FIXME This is a 404
    if (err) { res.redirect('/'); }

    app.locals.Git.log(pageName + ".md", "HEAD", 30, function(err, metadata) {
      res.locals.pageTitle = content.split("\n")[0].substr(1);
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
    content: Marked(req.body.data)
  });
}

exports.miscSyntaxReference = function(req, res) {
  res.render('syntax');
}

// Filters out pages that does not exist in the index
exports.miscExistence = function(req, res) {

  if (!req.query.data) {
    res.send(JSON.stringify({data: []}));
    return;
  }

  var result = []
    , n = req.query.data.length;

  req.query.data.forEach(function(pageName, idx) {
    (function(page, index) {
      app.locals.Git.log(page + ".md", "HEAD", function(err, metadata) {
        if (!metadata) {
          result.push(page);
        }
        if (index == (n - 1)) {
          res.send(JSON.stringify({data: result}));
        }
      });
    })(pageName, idx);
  });
}

exports.authDone = function(req, res) {
  if (!res.locals.user) {
    res.redirect("/");
    return;
  }

  if (!Tools.isAuthorized(res.locals.user.emails[0].value, app.locals.authorization.validMatches)) {
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

  req.session.destination = (req.headers.referer ? Url.parse(req.headers.referer).path : null);

  if (req.session.destination == '/login') {
    req.session.destination = '/';
  }

  res.render('login', {
    title: app.locals.appTitle
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
