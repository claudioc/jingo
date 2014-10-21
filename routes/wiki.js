var router = require("express").Router(),
    tools  = require("../lib/tools"),
    path = require("path"),
    renderer = require('../lib/renderer'),
    models = require("../lib/models"),
    app    = require("../lib/app").getInstance(),
    Promise = require("bluebird");

models.use(Git);

router.get("/", _getIndex);
router.get("/wiki", _getWiki);
router.get("/wiki/:page", _getWikiPage);
router.get("/wiki/:page/history", _getHistory);
router.get("/wiki/:page/:version", _getWikiPage);
router.get("/wiki/:page/compare/:revisions", _getCompare);

function _getHistory(req, res) {

  var page = new models.Page(req.params.page);

  page.fetch().then(function() {

    return page.fetchHistory();
  }).then(function(history) {

    // FIXME better manage an error here
    if (!page.error) {
      res.render("history", {
        items: history,
        title: 'History of ' + page.name,
        page: page
      });
    } else {
      res.locals.title = "404 - Not found";
      res.statusCode = 404;
      res.render("404.jade");
    }
  });
}

function _getWiki(req, res) {

  var items = [];
  var pagen = 0|req.query.page;

  var pages = new models.Pages();

  pages.fetch(pagen).then(function() {

    pages.models.forEach(function(page) {

      if (!page.error) {
        items.push({
          page: page,
          hashes: page.hashes.length == 2 ? page.hashes.join("..") : ""
        });
      }
    });

    res.render("list", {
     items: items,
     title: 'All the pages',
     pageNumbers: Array.apply(null, Array(pages.totalPages)).map(function (x, i) { return i + 1; }),
     pageCurrent: pages.currentPage
    });
  }).catch(function(ex) {
    console.log(ex);
  });
}

function _getWikiPage(req, res) {

  var page = new models.Page(req.params.page, req.params.version);

  page.fetch().then(function() {

    if (!page.error) {

      res.locals.canEdit = true;
      if (page.revision != "HEAD") {
        res.locals.warning = "You're not reading the latest revision of this page, which is " + "<a href='" + page.urlForShow() + "'>here</a>.";
        res.locals.canEdit = false;
      }

      res.locals.notice = req.session.notice;
      delete req.session.notice;

      res.render("show", {
        page: page,
        title: app.locals.config.get("application").title + " – " + page.title,
        content: renderer.render("#" + page.title + "\n" + page.content)
      });
    }
    else {

      if (req.user) {

        // Try sorting out redirect loops with case insentive fs
        // Path 'xxxxx.md' exists on disk, but not in 'HEAD'.
        if (/but not in 'HEAD'/.test(page.error)) {
          page.setNames(page.name.slice(0,1).toUpperCase() + page.name.slice(1));
        }
        res.redirect(page.urlFor("new"));
      } else {

        // Special case for the index page, anonymous user and an empty docbase
        if (page.isIndex()) {
          res.render("welcome", {
            title: "Welcome to " + app.locals.config.get("application").title
          });
        }
        else {
          res.locals.title = "404 - Not found";
          res.statusCode = 404;
          res.render('404.jade');
          return;
        }
      }
    }
  });
}

function _getCompare(req, res) {

  var revisions = req.params.revisions;

  var page = new models.Page(req.params.page);

  page.fetch().then(function() {

    return page.fetchRevisionsDiff(req.params.revisions);
  }).then(function(diff) {
    if (!page.error) {

      var lines = [];
      diff.split("\n").slice(4).forEach(function(line) {

        if (line.slice(0,1) != '\\') {
          lines.push({
            text: line,
            ldln: leftDiffLineNumber(0, line),
            rdln: rightDiffLineNumber(0, line),
            className: lineClass(line)
          });
        }
      });

      var revs = req.params.revisions.split("..");
      res.render('compare', {
        page: page,
        lines: lines,
        title: 'Revisions compare',
        revs: revs
      });

    }
    else {
      res.locals.title = "404 - Not found";
      res.statusCode = 404;
      res.render('404.jade');
      return;
    }
  });

  var ldln = 0,
      cdln;

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
        ldln++;
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
        rdln = parseInt(ri, 10);
        cdln = rdln;
        return '...';

      case line.slice(0,1) == '-':
        return ' ';

      case line.slice(0,1) == '+':
      default:
        rdln += 1;
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

function _getIndex(req, res) {
  res.redirect('/wiki/' + app.locals.config.get("pages").index);
}

module.exports = router;
