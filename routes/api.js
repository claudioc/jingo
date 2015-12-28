var router = require("express").Router(),
    tools  = require("../lib/tools"),
    path = require("path"),
    renderer = require('../lib/renderer'),
    models = require("../lib/models"),
    app    = require("../lib/app").getInstance(),
    Promise = require("bluebird");

models.use(Git);

router.get("/api/:page", _getApiWikiPage);

function _getApiWikiPage(req, res) {
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

      res.render("api_show", {
        page: page,
        title: app.locals.config.get("application").title + " – " + page.title,
        content: renderer.render("# " + page.title + "\n" + page.content)
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

module.exports = router;
