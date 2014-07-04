var router = require("express").Router()
  , tools  = require("../lib/tools")
  , path = require("path")
  , renderer = require('../lib/renderer')
  ;

router.get("/", _getIndex);
router.get("/wiki", _getWiki);
router.get("/wiki/:page", _getPage);

function _getWiki(req, res) {

    var items = []
      , title
      , len;

    Git.ls(function(err, list) {

      len = list.length;

      list.forEach(function(page) {

        page = path.basename(page);

        Git.hashes(page, 2, function(err, hashes) {

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
            })(tools.getPageTitle(content, page));
          });
        });
      });
    });
  }

function _getPage(req, res) {

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
            title: 'Welcome to ' + res.locals.appTitle
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
          title:   res.locals.appTitle + " – " + tools.getPageTitle(content, pageName),
          content: renderer.render(tools.hasTitle(content) ? content : "# " + pageName + "\n" + content),
          pageName: pageName,
          metadata: metadata
        });

      });
    }
  });
}

function _getIndex(req, res) {
  res.redirect('/wiki/home');
}

module.exports = router;
