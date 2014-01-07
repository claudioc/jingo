var Locker = require("../locker")
  , Tools  = require("../tools");

var Git = global.app.locals.Git;

exports.route = function(req, res) {

  var pageName = res.locals.pageName = req.params.page
    , lock;

  if ( (lock = Locker.getLock(pageName)) ) {
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
};
