var Fs     = require("fs")
  , Namer  = require("../namer");

var Git = global.app.locals.Git;

exports.route = function(req, res) {

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
};
