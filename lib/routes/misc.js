
var Fs     = require("fs")
  , Namer  = require("../namer")
  , Renderer = require('../renderer')
  , Locker = require("../locker")
  , Tools  = require("../tools");

var app = global.app, Git = app.locals.Git;

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
};

exports.pageHistory = function(req, res) {

  var pageName = req.params.page;

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
};

exports.miscPreview = function(req, res) {
  res.render('preview', {
    content: Renderer.render(req.body.data)
  });
};

exports.miscSyntaxReference = function(req, res) {
  res.render('syntax');
};

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
};
