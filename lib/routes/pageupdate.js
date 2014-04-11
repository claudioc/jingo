var Fs     = require("fs")
  , Namer  = require("../namer")
  , Locker = require("../locker");
  
var Git = app.locals.Git;

exports.route = function(req, res) {

  var pageName = res.locals.pageName = Namer.normalize(req.params.page)
    , errors
    , pageFile
    , message
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
  req.sanitize('message').trim();

  content = "# " + req.body.pageTitle + "\n" + req.body.content.replace(/\r\n/gm, "\n");
  pageFile = Git.absPath(pageName + ".md");

  message = (req.body.message === "") ? "Content updated (" + pageName + ")" : req.body.message;

  Fs.writeFile(pageFile, content, function() {
    Git.add(pageName + ".md", message, req.user.asGitAuthor, function(err) {
      Locker.unlock(pageName);
      if (pageName == '_footer') {
        app.locals.Components.expire('footer');
      }
      if (pageName == '_sidebar') {
        app.locals.Components.expire('sidebar');
      }
      req.session.notice = "Page has been updated successfully";
      res.redirect("/wiki/" + pageName);
    });
  });
};
