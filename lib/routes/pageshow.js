var Renderer = require('../renderer')
  , Tools  = require("../tools");

var Git = global.app.locals.Git;

exports.route = function(req, res) {

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


