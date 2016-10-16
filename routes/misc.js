var router = require("express").Router(),
  app = require("../lib/app").getInstance(),
  renderer = require("../lib/renderer"),
  fs = require("fs"),
  models = require("../lib/models");

models.use(Git);

router.get("/misc/syntax-reference", _getSyntaxReference);
router.post("/misc/preview",         _postPreview);
router.get("/misc/existence",        _getExistence);
router.get("/misc/upload",           _getUploadForm);

function _getSyntaxReference(req, res) {
  res.render("syntax");
}

function _postPreview(req, res) {
  res.render("preview", {
    content: renderer.render(req.body.data)
  });
}

function _getUploadForm(req, res) {
  if (!res.locals.user) {
    res.render("404", {
      title: 'Modules'
    });
    return;
  }

  res.render("upload", {
    config: app.locals.config.get("application").repository,
    message: 'Ready to upload.'
  });
}

function _getExistence(req, res) {

  if (!req.query.data) {
    res.send(JSON.stringify({data: []}));
    return;
  }

  var result = [],
    page,
    n = req.query.data.length;

  req.query.data.forEach(function (pageName, idx) {
    (function (name, index) {
      page = new models.Page(name);
      if (!fs.existsSync(page.pathname)) {
        result.push(name);
      }
      if (index == (n - 1)) {
        res.send(JSON.stringify({data: result}));
      }
    }(pageName, idx));
  });
}

router.all("*", function (req, res) {
  res.locals.title = "404 - Not found";
  res.statusCode = 404;
  res.render("404.jade");
});

module.exports = router;
