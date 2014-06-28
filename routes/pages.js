var router = require("express").Router()
  , namer  = require("../lib/namer")
  , locker = require("../lib/locker")
  , tools  = require("../lib/tools")
  , fs     = require("fs")
  , app = require("../lib/app").getInstance()
  , components     = require('../lib/components')
  ;

router.get("/pages/new", _getPagesNew);
router.get("/pages/new/:page", _getPagesNew);
router.get("/pages/:page/edit", _getPagesEdit);
router.post("/pages", _postPages);
router.put("/pages/:page", _putPages);


/*
app.delete ("/pages/:page",           routes.pageDestroy);
*/


function _getPagesNew(req, res) {

  res.locals.pageName = namer.normalize(req.params.page);

  if (res.locals.pageName) {
    if (fs.existsSync(Git.absPath(res.locals.pageName + ".md"))) {
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
    "pageTitle": namer.denormalize(res.locals.pageName)
  });
}

function _postPages(req, res) {

  var errors
    , pageName
    , pageFile
    , hasPageName = !!req.body.pageName;

  pageName = namer.normalize(req.body.pageName || req.body.pageTitle);

  req.check('pageTitle', 'The page title cannot be empty').notEmpty();
  req.check('content',   'The page content cannot be empty').notEmpty();

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

  if (fs.existsSync(pageFile)) {
    req.session.errors = [{msg: "A document with this title already exists"}];
    res.redirect("/pages/new");
    return;
  }

  fs.writeFile(pageFile, "# " + req.body.pageTitle + "\n" + req.body.content.replace(/\r\n/gm, "\n"), function() {
    Git.add(pageName + ".md", "Page created (" + pageName + ")", req.user.asGitAuthor, function(err) {
      req.session.notice = "The page has been created. <a href=\"/pages/" + pageName + "/edit\">Edit it?</a>"
      res.redirect("/wiki/" + pageName);
    });
  });
}

function _putPages(req, res) {

  var pageName = res.locals.pageName = namer.normalize(req.params.page)
    , errors
    , pageFile
    , message
    , content;

  req.check('pageTitle', 'The page title cannot be empty').notEmpty();
  req.check('content',   'The page content cannot be empty').notEmpty();

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

  message = (req.body.message == "") ? "Content updated (" + pageName + ")" : req.body.message;

  fs.writeFile(pageFile, content, function() {
    Git.add(pageName + ".md", message, req.user.asGitAuthor, function(err) {
      locker.unlock(pageName);
      if (pageName == '_footer') {
        components.expire('footer');
      }
      if (pageName == '_sidebar') {
        components.expire('sidebar');
      }
      req.session.notice = "The page has been updated. <a href=\"/pages/" + pageName + "/edit\">Edit it again?</a>";
      res.redirect("/wiki/" + pageName);
    });
  });

}

function _getPagesEdit(req, res) {
  var pageName = res.locals.pageName = req.params.page
    , lock;

  if (lock = locker.getLock(pageName)) {
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
            pageTitle: tools.getPageTitle(content, pageName),
            content: tools.getContent(content)
          };
        } else {
          res.locals.formData = req.session.formData;
        }

        res.locals.errors = req.session.errors;

        locker.lock(pageName, req.user);

        delete req.session.errors;
        delete req.session.formData;

        res.render('edit', {
          title: 'Edit page'
        });
      }
    });
  });
}

module.exports = router;
