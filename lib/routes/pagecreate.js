var Fs     = require("fs")
  , Namer  = require("../namer");
  
var Git = global.app.locals.Git;

exports.route = function(req, res) {

  var errors
    , pageName
    , pageFile
    , hasPageName = !!req.body.pageName;

  pageName = Namer.normalize(req.body.pageName || req.body.pageTitle);

  req.check('pageTitle', 'Page title cannot be empty').notEmpty();
  req.check('content',   'Page content cannot be empty').notEmpty();

  errors = req.validationErrors();

  if (errors) {
    req.session.errors = errors;
    req.session.formData = req.body;
    res.redirect("/pages/new" + (hasPageName ? '/' + pageName : ''));
    return;
  }

  req.sanitize('pageTitle').trim();
  req.sanitize('content').trim();

  pageFile = Git.absPath(pageName + ".md");

  if (Fs.existsSync(pageFile)) {
    req.session.errors = [{msg: "A document with this title already exists"}];
    res.redirect("/pages/new");
    return;
  }

  Fs.writeFile(pageFile, "# " + req.body.pageTitle + "\n" + req.body.content.replace(/\r\n/gm, "\n"), function() {
    Git.add(pageName + ".md", "Page created (" + pageName + ")", req.user.asGitAuthor, function(err) {
      req.session.notice = "Page has been created successfully";
      res.redirect("/wiki/" + pageName);
    });
  });
};
