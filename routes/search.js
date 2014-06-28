var router = require("express").Router()
  , path = require("path")
  ;

router.get("/search", _getSearch);

function _getSearch(req, res) {

  var items = []
    , record;

  res.locals.matches = [];
  res.locals.term = req.query.term.trim();

  if (res.locals.term.length < 2) {
    res.locals.warning = "Search string is too short.";
    renderResults();
  } else {

    Git.grep(res.locals.term, function(err, items) {

      items.forEach(function(item) {
        if (item.trim() != "") {
          record = item.split(":");
          res.locals.matches.push({
            pageName: path.basename(record[0].split(".")[0]),
            line: record[1] ? ":" + record[1] : "",
            text: record.slice(2).join('')
          });
        }
      });

      renderResults();
    });
  }

  function renderResults() {
    res.render("search", {
      title: "Search results"
    });
  }
}


module.exports = router;
