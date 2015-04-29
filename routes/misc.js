var router = require("express").Router(),
    renderer = require('../lib/renderer'),
    fs = require("fs"),
    models = require("../lib/models");

models.use(Git);

router.get( "/misc/syntax-reference", _getSyntaxReference);
router.post("/misc/preview",          _postPreview);
router.get( "/misc/existence",        _getExistence);

function _getSyntaxReference(req, res) {
  res.render('syntax');
}

function _postPreview(req, res) {
  res.render('preview', {
    content: renderer.render(req.body.data)
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

  req.query.data.forEach(function(pageName, idx) {
    (function(name, index) {
      page = new models.Page(name, res.locals.mountpath);
      if (!fs.existsSync(page.pathname)) {
        result.push(name);
      }
      if (index == (n - 1)) {
        res.send(JSON.stringify({data: result}));
      }
    })(pageName, idx);
  });
}

//handle 404
router.all(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

module.exports = router;
