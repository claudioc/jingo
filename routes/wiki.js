var router = require("express").Router()
  , tools  = require("../lib/tools")
  , path = require("path")
  , renderer = require('../lib/renderer')
  , models = require("../lib/models")
  , Promise = require("bluebird")
  ;

models.use(Git);

router.get("/", _getIndex);
router.get("/wiki", _getWiki);
router.get("/wiki/:page", _getPage);
router.get("/wiki/:page/history", _getHistory);
router.get("/wiki/:page/:version", _getPage);
router.get("/wiki/:page/compare/:revisions", _getCompare);

function _getCompare(req, res) {

  var pageName = req.params.page
    , revisions = req.params.revisions;

  res.locals.revisions = revisions.split("..");
  res.locals.lines = [];

  models.pages.getRevisionsDiffAsync(pageName, revisions).then(function(diff) {

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

function _getHistory(req, res) {

  var pageName = req.params.page
    , pageTitle;

  models.pages

    .getHistoryAsync(pageName)

      .then(function(result) {

        res.locals.pageTitle = tools.getPageTitle(result[0], pageName);
        res.locals.pageName = pageName;
        res.locals.items = result[1];
        res.render('history', {
          title: "Revisions of"
        });
      })

      .catch(function(ex) {
        console.log(ex)
        res.redirect('/');
      });
}

function _getWiki(req, res) {

  var items = []
    , len
    , getPageInfoAsync;

  var pages = models.pages;

  pages.getAllAsync().then(function(list) {

    len = list.length;

    list.forEach(function(page) {

      getPageInfoAsync(page).then(function(info) {

        items.push({
          pageTitle: info.title,
          message: info.message,
          metadata: info.metadata,
          hashes: info.hashes.length == 2 ? info.hashes.join("..") : ""
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
  });

  function getPageInfo(page, callback) {

    var info = {};

    page = path.basename(page);

    pages.getContentAsync(page, "HEAD")

         .then(function(content) {
           info.title = tools.getPageTitle(content, page);
           return pages.getMetadataAsync(page, "HEAD");
         })

         .then(function(metadata) {
           info.metadata = metadata;
           return pages.getHashesAsync(page);
         })

         .then(function(hashes) {
           info.hashes = hashes;
           return pages.getLastMessageAsync(page);
         })

         .then(function(message) {
           info.message = message;
           callback(null, info);
         });
   }

   var getPageInfoAsync = Promise.promisify(getPageInfo);
}

function _getPage(req, res) {

  var pageName = req.params.page
    , pageVersion = req.params.version || "HEAD"
    , pageContent;

  models.pages.getContentAsync(pageName, pageVersion).then(function(content) {
    pageContent = content;
    return models.pages.getMetadataAsync(pageName, pageVersion);
  }).then(function(metadata) {

    res.locals.canEdit = true;
    if (pageVersion != 'HEAD') {
      res.locals.warning = "You're not reading the latest revision of this page, which is " + "<a href='/wiki/" + pageName + "'>here</a>.";
      res.locals.canEdit = false;
    }

    res.locals.notice = req.session.notice;
    delete req.session.notice;

    res.render('show', {
      title:   res.locals.appTitle + " – " + tools.getPageTitle(pageContent, pageName),
      content: renderer.render(tools.hasTitle(pageContent) ? pageContent : "# " + pageName + "\n" + pageContent),
      pageName: pageName,
      metadata: metadata
    });
  }).catch(function(ex) {

    if (req.user) {
      res.redirect('/pages/new/' + pageName);
    } else {
      // Special case for "home", anonymous user and an empty docbase
      if (pageName == 'home') {
        res.render('welcome', {
          title: 'Welcome to ' + res.locals.appTitle
        });
      } else {
        error404(req, res);
        return;
      }
    }
  });
}

function _getIndex(req, res) {
  res.redirect('/wiki/home');
}

module.exports = router;
