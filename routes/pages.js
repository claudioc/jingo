var router = require("express").Router()
  , namer  = require("../lib/namer")
  , locker = require("../lib/locker")
  , tools  = require("../lib/tools")
  , fs     = require("fs")
  , app    = require("../lib/app").getInstance()
  , models = require("../lib/models")
  , components = require('../lib/components')
  ;

models.use(Git);

router.get("/pages/new", _getPagesNew);
router.get("/pages/new/:page", _getPagesNew);
router.get("/pages/:page/edit", _getPagesEdit);
router.post("/pages", _postPages);
router.put("/pages/:page", _putPages);
router.delete ("/pages/:page", _deletePages);

var pagesConfig = app.locals.config.get("pages");

function _deletePages(req, res) {

  var pageName = namer.wikify(req.params.page);

  if (pageName == app.locals.config.get("pages").index) {
    res.redirect("/");
    return;
  }

  models.pages.removeAsync(pageName, req.user.asGitAuthor).then(function() {

    locker.unlock(pageName);

    if (pageName == '_footer') {
      app.locals._footer = null;
    }

    if (pageName == '_sidebar') {
      app.locals._sidebar = null;
    }

    req.session.notice = "The page `" + pageName + "` has been deleted.";
    res.redirect("/");
  });
}

function _getPagesNew(req, res) {

  res.locals.pageName = namer.wikify(req.params.page);

  if (res.locals.pageName) {
    if (fs.existsSync(models.pages.getAbsolutePath(res.locals.pageName))) {
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
    "pageTitle": namer.unwikify(res.locals.pageName)
  });
}

function _postPages(req, res) {

  var errors
    , pageName
    , pageFile
    , hasPageName = !!req.body.pageName;

  if (pagesConfig.title.fromFilename) {
    // pageName (from url) is not considered
    pageName = namer.wikify(req.body.pageTitle);
  } else {
    // pageName (from url) is more important
    pageName = namer.wikify(req.body.pageName || req.body.pageTitle);
  }

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

  pageFile = models.pages.getAbsolutePath(pageName);

  if (fs.existsSync(pageFile)) {
    req.session.errors = [{msg: "A document with this title already exists"}];
    res.redirect("/pages/new" + (hasPageName ? '/' + pageName : ''));
    return;
  }

  var title = "";
  if (pagesConfig.title.fromContent) {
    title = "# " + req.body.pageTitle + "\n";
  }

  fs.writeFile(pageFile, title + req.body.content.replace(/\r\n/gm, "\n"), function() {
    models.pages.addAsync(pageName, req.user.asGitAuthor).then(function() {
      req.session.notice = "The page has been created. <a href=\"/pages/" + pageName + "/edit\">Edit it?</a>";
      res.redirect("/wiki/" + encodeURIComponent(pageName));
    });
  });
}

function _putPages(req, res) {

  var pageName = res.locals.pageName = namer.wikify(req.params.page)
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
  pageFile = models.pages.getAbsolutePath(pageName);

  message = (req.body.message.trim() === "") ? "Content updated (" + pageName + ")" : req.body.message.trim();

  fs.writeFile(pageFile, content, function() {

    models.pages.updateAsync(pageName, message, req.user.asGitAuthor).then(function() {

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

  models.repositories.refreshAsync().then(function() {

    return models.pages.getContentAsync(pageName, "HEAD");
  }).then(function(content) {

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

  }).catch(function(ex) {
    console.log(ex);
  });
}

module.exports = router;
