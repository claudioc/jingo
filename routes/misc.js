var router = require("express").Router()
  , renderer = require('../lib/renderer')
  , fs = require("fs")
  ;

router.get("/misc/syntax-reference", _getSyntaxReference);
router.post("/misc/preview",         _postPreview);
router.get("/misc/existence",        _getExistence);

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

  var result = []
    , n = req.query.data.length;

  req.query.data.forEach(function(pageName, idx) {
    (function(page, index) {
      if (!fs.existsSync(Git.absPath(page + ".md"))) {
        result.push(page);
      }
      if (index == (n - 1)) {
        res.send(JSON.stringify({data: result}));
      }
    })(pageName, idx);
  });
}

router.all('*', function(req, res) {
  res.locals.title = "404 - Not found";
  res.statusCode = 404;
  res.render('404.jade');
});

module.exports = router;
