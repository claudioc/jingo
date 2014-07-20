var router = require("express").Router()
  , tools  = require("../lib/tools")
  , path = require("path")
  , renderer = require('../lib/renderer')
  , models = require("../lib/models")
  , app    = require("../lib/app").getInstance()
  , Promise = require("bluebird")
  ;

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
      res.render('history', {
        items: history,
        page: page
      });
    } else {
      res.locals.title = "404 - Not found";
      res.statusCode = 404;
      res.render('404.jade');
    }
  });
}

function _getWiki(req, res) {

  var items = [];

  var pages = new models.Pages();

  pages.fetch().then(function() {

    pages.models.forEach(function(page) {

      if (!page.error) {
        items.push({
          page: page,
          hashes: page.hashes.length == 2 ? page.hashes.join("..") : ""
        });
      }
    });

    items.sort(function(a, b) {
      return b.page.metadata.timestamp - a.page.metadata.timestamp;
    });

    res.render("list", {
     title: "Document list – Sorted by update date",
     items: items
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
      if (page.revision != 'HEAD') {
        res.locals.warning = "You're not reading the latest revision of this page, which is " + "<a href='" + page.urlForShow() + "'>here</a>.";
        res.locals.canEdit = false;
      }

      res.locals.notice = req.session.notice;
      delete req.session.notice;

      res.render('show', {
        page: page,
        title: app.locals.config.get("application").title + " – " + page.title,
        content: renderer.render(page.rawContent)
      });
    }
    else {

      if (req.user) {
        res.redirect(page.urlFor("new"));
      } else {

        // Special case for "home", anonymous user and an empty docbase
        if (page.isIndex()) {
          res.render('welcome', {
            title: 'Welcome to ' + app.locals.config.get("application").title
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

      res.render('compare', {
        page: page,
        lines: lines
      });

    }
    else {
      res.locals.title = "404 - Not found";
      res.statusCode = 404;
      res.render('404.jade');
      return;
    }
  })

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

function _getIndex(req, res) {
  res.redirect('/wiki/' + app.locals.config.get("pages").index);
}

module.exports = router;
